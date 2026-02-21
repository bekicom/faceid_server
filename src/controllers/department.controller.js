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
const mongoose = require("mongoose");

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Noto‘g‘ri ID",
      });
    }

    const allowedFields = [
      "name",
      "checkInTime",
      "checkOutTime",
      "lateAfterMinutes",
      "earlyLeaveMinutes",
    ];

    const bodyKeys = Object.keys(req.body);

    const invalidField = bodyKeys.find((key) => !allowedFields.includes(key));

    if (invalidField) {
      return res.status(400).json({
        success: false,
        message: `Ruxsat etilmagan field: ${invalidField}`,
      });
    }

    const department = await Department.findById(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Department topilmadi",
      });
    }

    // ⏰ Time format validation (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (req.body.checkInTime && !timeRegex.test(req.body.checkInTime)) {
      return res.status(400).json({
        success: false,
        message: "checkInTime noto‘g‘ri format (HH:MM)",
      });
    }

    if (req.body.checkOutTime && !timeRegex.test(req.body.checkOutTime)) {
      return res.status(400).json({
        success: false,
        message: "checkOutTime noto‘g‘ri format (HH:MM)",
      });
    }

    // Update qilish
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        department[field] = req.body[field];
      }
    });

    await department.save();

    res.json({
      success: true,
      message: "Department yangilandi",
      data: department,
    });
  } catch (err) {
    console.error("UPDATE DEPARTMENT ERROR:", err);
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
