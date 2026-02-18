const Department = require("../modules/department.model");

exports.createDepartment = async (req, res) => {
  try {
    const {
      organizationId,
      name,
      checkInTime,
      checkOutTime,
      lateAfterMinutes,
      earlyLeaveMinutes,
    } = req.body;

    if (!organizationId || !name || !checkInTime || !checkOutTime) {
      return res.status(400).json({
        success: false,
        message: "Majburiy maydonlar to‘ldirilmagan",
      });
    }

    const department = await Department.create({
      organizationId,
      name,
      checkInTime,
      checkOutTime,
      lateAfterMinutes: lateAfterMinutes || 0,
      earlyLeaveMinutes: earlyLeaveMinutes || 0,
    });

    return res.status(201).json({
      success: true,
      data: department,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};
