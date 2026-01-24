import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 8062;

/* ===================== CLIENTS ===================== */
const clients = new Set();

/**
 * attendanceState:
 * key: employeeId + date (YYYY-MM-DD)
 * value: {
 *   employeeId,
 *   date,
 *   firstIn,
 *   lastOut,
 *   currentStatus,
 *   lastScanAt
 * }
 */
const attendanceState = new Map();

/* ===================== MIDDLEWARE ===================== */
app.use(helmet());
app.use(express.json({ limit: "10mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),
);

/* ===================== HELPERS ===================== */
function getDateKey(isoTime) {
  return isoTime.slice(0, 10); // YYYY-MM-DD
}

function resolveAttendance({ employeeId, name, time }) {
  const date = getDateKey(time);
  const key = `${employeeId}_${date}`;
  const now = Date.now();

  let rec = attendanceState.get(key);

  if (!rec) {
    rec = {
      employeeId,
      name,
      date,
      firstIn: null,
      lastOut: null,
      currentStatus: "OUT",
      lastScanAt: 0,
    };
  }

  // 🔁 debounce: 5 sekund
  if (now - rec.lastScanAt < 5000) {
    return null;
  }
  rec.lastScanAt = now;

  if (rec.currentStatus === "OUT") {
    // 👉 KELDI
    rec.currentStatus = "IN";

    if (!rec.firstIn) {
      rec.firstIn = time;
    }
  } else {
    // 👉 KETDI
    rec.currentStatus = "OUT";
    rec.lastOut = time;
  }

  attendanceState.set(key, rec);

  return {
    employeeId,
    name,
    date,
    firstIn: rec.firstIn,
    lastOut: rec.lastOut,
    status: rec.currentStatus,
    label: rec.currentStatus === "IN" ? "KELDI" : "KETDI",
    time,
  };
}

/* ===================== WEBSOCKET ===================== */
wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  ws.isAlive = true;
  ws.role = "unknown"; // local | frontend
  clients.add(ws);

  console.log(`🟢 WS ulandi: ${ip} | Jami: ${clients.size}`);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());

      /* =====================
         LOCAL → SERVER
      ===================== */
      if (parsed?.type === "attendance_event" && parsed?.data) {
        ws.role = "local";

        const resolved = resolveAttendance(parsed.data);
        if (!resolved) return;

        console.log(
          `👤 ${resolved.name} (${resolved.employeeId}) → ${resolved.label}`,
        );

        const out = JSON.stringify({
          type: "attendance_event",
          data: resolved,
        });

        // 🔁 FRONTENDlarga tarqatamiz
        clients.forEach((client) => {
          if (
            client !== ws &&
            client.role === "frontend" &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(out);
          }
        });

        return;
      }

      /* =====================
         FRONTEND HELLO
      ===================== */
      if (parsed?.type === "frontend_hello") {
        ws.role = "frontend";
        return;
      }
    } catch (err) {
      console.error("❌ WS message parse xato:", err.message);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`🔴 WS uzildi | Qoldi: ${clients.size}`);
  });
});

/* ===================== HEARTBEAT ===================== */
setInterval(() => {
  clients.forEach((ws) => {
    if (!ws.isAlive) {
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

/* ===================== HEALTH ===================== */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    wsClients: clients.size,
    uptime: process.uptime(),
  });
});

/* ===================== START ===================== */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 WS Server ishga tushdi: ${PORT}`);
  console.log(`🔌 WS: wss://faceidserver.richman.uz`);
});
