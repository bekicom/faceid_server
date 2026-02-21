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

// 🔹 UPDATE DEPARTMENT
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      checkInTime,
      checkOutTime,
      lateAfterMinutes,
      earlyLeaveMinutes,
    } = req.body;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department topilmadi",
      });
    }

    department.name = name || department.name;
    department.checkInTime = checkInTime || department.checkInTime;
    department.checkOutTime = checkOutTime || department.checkOutTime;

    if (lateAfterMinutes !== undefined)
      department.lateAfterMinutes = lateAfterMinutes;

    if (earlyLeaveMinutes !== undefined)
      department.earlyLeaveMinutes = earlyLeaveMinutes;

    await department.save();

    res.json({
      success: true,
      message: "Department yangilandi",
      data: department,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};


// 🔹 DELETE DEPARTMENT (Soft delete)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department topilmadi",
      });
    }

    department.isActive = false;
    await department.save();

    res.json({
      success: true,
      message: "Department o‘chirildi (soft delete)",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server xatosi",
    });
  }
};
