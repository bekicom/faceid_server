import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 8062;

/**
 * WS clientlar:
 * - local sender (hikvision client)
 * - frontend listenerlar
 */
const clients = new Set();

/* ===================== MIDDLEWARE ===================== */
app.use(helmet());
app.use(express.json({ limit: "10mb" }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
  }),
);

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

      /**
       * LOCAL → SERVER (attendance_event)
       */
      if (parsed?.type === "attendance_event" && parsed?.data) {
        ws.role = "local";

        console.log("📥 LOCAL EVENT:", parsed.data);

        const out = JSON.stringify({
          type: "attendance_event",
          data: parsed.data,
        });

        // 🔁 FRONTENDlarga tarqatamiz
        clients.forEach((client) => {
          if (
            client !== ws &&
            client.role !== "local" &&
            client.readyState === WebSocket.OPEN
          ) {
            client.send(out);
          }
        });

        return;
      }

      /**
       * FRONTEND HELLO (ixtiyoriy)
       */
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
  console.log(`🔌 WS: ws://SERVER_IP:${PORT}`);
});
