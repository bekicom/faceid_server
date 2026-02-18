const Employee = require("../modules/employee.model");

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

    // 🔥 1️⃣ Multipart JSON ni olish
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          data = JSON.parse(file.buffer.toString());
          break;
        } catch {}
      }
    }

    // 🔥 2️⃣ Oddiy JSON bo‘lsa
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
      console.log("❌ employeeNo topilmadi");
      return res.status(200).send("OK");
    }

    const dateTime =
      findField(data, ["dateTime", "DateTime"]) || new Date().toISOString();

    const employee = await Employee.findOne({
      organizationId,
      employeeCode: employeeNo,
      isActive: true,
    }).populate("department");

    if (!employee) {
      console.log("❌ DB da employee topilmadi:", employeeNo);
      return res.status(200).send("OK");
    }

    console.log("===================================");
    console.log("🏢 Filial:", organizationId);
    console.log("👤 Hodim:", employee.fullName);
    console.log("🆔 Code:", employee.employeeCode);
    console.log("🏬 Bo‘lim:", employee.department?.name);
    console.log("🕒 Vaqt:", dateTime);
    console.log("===================================");

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Device Error:", err);
    return res.status(200).send("OK");
  }
};
