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
    const data = req.body;

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

    // 🔥 EMPLOYEE NI DB DAN TOPAMIZ
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
    console.log("🆔 Employee Code:", employee.employeeCode);
    console.log("🏬 Bo‘lim:", employee.department?.name);
    console.log("🕒 Sana/Vaqt:", dateTime);
    console.log("===================================");

    return res.status(200).send("OK");
  } catch (err) {
    console.error("Device Error:", err);
    return res.status(200).send("OK");
  }
};
