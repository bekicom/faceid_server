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
