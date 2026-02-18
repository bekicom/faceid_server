const crypto = require("crypto");
const Device = require("../modules/device.model");
const Employee = require("../modules/employee.model"); // 🔥 SHU YO‘Q
const Attendance = require("../modules/attendance.model"); // 🔥 SHU YO‘Q EDI



const parseTimeToMinutes = (timeStr) => {
  const [hour, minute] = timeStr.split(":").map(Number);
  return hour * 60 + minute;
};



/* =========================
   CREATE DEVICE
========================= */
exports.createDevice = async (req, res) => {
  try {
    const { name, floor, direction, locationDescription } = req.body;

    // 🔥 Unique device key generatsiya
    const deviceKey = crypto.randomBytes(6).toString("hex");

    const device = await Device.create({
      organizationId: req.organizationId, // 🔥 TOKEN DAN
      name,
      floor,
      direction,
      locationDescription,
      deviceKey,
    });

    res.status(201).json({
      success: true,
      data: device,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   GET DEVICES (faqat o'z organization)
========================= */
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({
      organizationId: req.organizationId,
    });

    res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DEVICE EVENT (PUBLIC)
========================= */
exports.deviceEvent = async (req, res) => {
  try {
    const { employeeNo, dateTime } = req.body;

    if (!employeeNo || !dateTime) {
      return res.status(400).json({
        success: false,
        message: "employeeNo yoki dateTime yo‘q",
      });
    }

    // 🔥 organizationId middleware orqali keladi deb olamiz
    const organizationId = req.organizationId;

    const employee = await Employee.findOne({
      organizationId,
      employeeCode: employeeNo,
      isActive: true,
    }).populate("department");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Hodim topilmadi",
      });
    }

    const shift = employee.department.shifts.find(
      (s) => s.name === employee.shiftName,
    );

    if (!shift) {
      return res.status(400).json({
        success: false,
        message: "Shift topilmadi",
      });
    }

    const eventTime = new Date(dateTime);
    const today = eventTime.toISOString().split("T")[0];

    const currentMinutes = eventTime.getHours() * 60 + eventTime.getMinutes();

    const shiftStart = parseTimeToMinutes(shift.startTime);

    const shiftEnd = parseTimeToMinutes(shift.endTime);

    let attendance = await Attendance.findOne({
      organizationId,
      employee: employee._id,
      date: today,
    });

    // ======================
    // 🟢 CHECK IN
    // ======================
    if (!attendance) {
      let status = "ON_TIME";

      if (currentMinutes > shiftStart + shift.lateAfterMinutes) {
        status = "LATE";
      }

      await Attendance.create({
        organizationId,
        employee: employee._id,
        department: employee.department._id,
        shiftName: shift.name,
        date: today,
        checkIn: eventTime,
        status,
      });

      console.log(`✅ ${employee.fullName} → IN`);

      return res.status(200).json({
        success: true,
        message: "Check-in yozildi",
      });
    }

    // ======================
    // ⚠️ DOUBLE SCAN
    // ======================
    const diff = (eventTime - attendance.updatedAt) / 1000;

    if (diff < 5) {
      console.log("⚠️ Double scan ignored");
      return res.status(200).json({
        success: true,
        message: "Double scan ignored",
      });
    }

    // ======================
    // 🔴 CHECK OUT
    // ======================
    if (!attendance.checkOut) {
      let status = attendance.status;

      if (currentMinutes < shiftEnd - shift.earlyLeaveMinutes) {
        status = "EARLY_LEAVE";
      }

      attendance.checkOut = eventTime;
      attendance.status = status;

      await attendance.save();

      console.log(`🚪 ${employee.fullName} → OUT`);

      return res.status(200).json({
        success: true,
        message: "Check-out yozildi",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Allaqachon chiqib ketgan",
    });
  } catch (error) {
    console.error("Device Event Error:", error);
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};

 