const Employee = require("../modules/employee.model");

/* =========================
   CREATE EMPLOYEE
========================= */
exports.createEmployee = async (req, res) => {
  try {
    const {
      organizationId,
      fullName,
      employeeCode,
      department
    } = req.body;

    if (!organizationId || !fullName || !employeeCode || !department) {
      return res.status(400).json({
        success: false,
        message: "Majburiy maydonlar yo‘q"
      });
    }

    const employee = await Employee.create({
      organizationId,
      fullName,
      employeeCode,
      department
    });

    res.status(201).json({
      success: true,
      data: employee
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   GET EMPLOYEES
========================= */
exports.getEmployees = async (req, res) => {
  try {
    const { organizationId } = req.query;

    const employees = await Employee.find({
      organizationId,
    }).populate("department", "name");

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
/* =========================
   GET ONE EMPLOYEE
========================= */
exports.getOneEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate("department", "name");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee topilmadi"
      });
    }

    res.json({
      success: true,
      data: employee
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


/* =========================
   UPDATE EMPLOYEE
========================= */
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      employeeCode,
      department
    } = req.body;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee topilmadi"
      });
    }

    employee.fullName = fullName || employee.fullName;
    employee.employeeCode = employeeCode || employee.employeeCode;
    employee.department = department || employee.department;

    await employee.save();

    res.json({
      success: true,
      message: "Employee yangilandi",
      data: employee
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   DELETE EMPLOYEE
========================= */
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee topilmadi"
      });
    }

    employee.isActive = false;
    await employee.save();

    res.json({
      success: true,
      message: "Employee o‘chirildi (soft delete)"
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
