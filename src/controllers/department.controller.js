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


exports.getDepartments = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const departments = await Department.find({
      organizationId,
      isActive: { $ne: false }, // agar modelda bo‘lsa
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};


exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({})
      .populate("organizationId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: departments.length,
      data: departments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};
