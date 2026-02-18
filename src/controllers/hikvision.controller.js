const Employee = require("../modules/employee.model");
const Attendance = require("../modules/attendance.model");

const findField = (obj, fieldNames) => {
  if (!obj || typeof obj !== "object") return null;

  for (const key of Object.keys(obj)) {
    if (fieldNames.includes(key)) {
      return obj[key];
    }

    if (typeof obj[key] === "object") {
      const result = findField(obj[key], fieldNames);
      if (result) return result;
    }
  }

  return null;
};

exports.deviceEvent = async (req, res) => {
  try {
    const { organizationId } = req.params;

    let data = null;

    // 1️⃣ Multipart JSON (Hikvision)
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          data = JSON.parse(file.buffer.toString());
          break;
        } catch {}
      }
    }

    // 2️⃣ Oddiy JSON
    if (!data && req.body && Object.keys(req.body).length > 0) {
      try {
        const firstKey = Object.keys(req.body)[0];
        data = JSON.parse(req.body[firstKey]);
      } catch {
        data = req.body;
      }
    }

    if (!data) return res.status(200).send("OK");

    if (data.eventType === "heartBeat") {
      return res.status(200).send("OK");
    }

    const employeeNo = findField(data, [
      "employeeNoString",
      "employeeNo",
      "EmployeeNo",
      "cardNo",
      "CardNo",
    ]);

    if (!employeeNo) {
      return res.status(200).send("OK");
    }

    const dateTime =
      findField(data, ["dateTime", "DateTime"]) || new Date().toISOString();

    const eventTime = new Date(dateTime);
    const today = eventTime.toISOString().split("T")[0];

    const employee = await Employee.findOne({
      organizationId,
      employeeCode: employeeNo,
      isActive: true,
    }).populate("department");

    if (!employee) {
      console.log("❌ Employee topilmadi:", employeeNo);
      return res.status(200).send("OK");
    }

    let attendance = await Attendance.findOne({
      organizationId,
      employee: employee._id,
      date: today,
    });

    // 🟢 FIRST ENTRY
    if (!attendance) {
      await Attendance.create({
        organizationId,
        employee: employee._id,
        department: employee.department._id,
        date: today,
        firstEntry: eventTime,
        lastExit: eventTime,
        totalHours: 0,
      });

      console.log("===================================");
      console.log("🏢 Filial:", organizationId);
      console.log("🏬 Bo‘lim:", employee.department?.name);
      console.log("👤 Hodim:", employee.fullName);
      console.log("🆔 Code:", employee.employeeCode);
      console.log("🟢 FIRST ENTRY:", eventTime);
      console.log("===================================");
    }

    // 🔄 UPDATED EXIT
    else {
      const diffSeconds = (eventTime - attendance.lastExit) / 1000;

      // ⚠️ Double scan protection (5 sec)
      if (diffSeconds < 5) {
        return res.status(200).send("OK");
      }

      attendance.lastExit = eventTime;

      const totalMs = attendance.lastExit - attendance.firstEntry;

      attendance.totalHours = totalMs / (1000 * 60 * 60);

      await attendance.save();

      console.log("===================================");
      console.log("🏢 Filial:", organizationId);
      console.log("🏬 Bo‘lim:", employee.department?.name);
      console.log("👤 Hodim:", employee.fullName);
      console.log("🆔 Code:", employee.employeeCode);
      console.log("🔄 UPDATED EXIT:", eventTime);
      console.log("⏱ Umumiy soat:", attendance.totalHours.toFixed(2));
      console.log("===================================");
    }

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Device Error:", err);
    return res.status(200).send("OK");
  }
};
