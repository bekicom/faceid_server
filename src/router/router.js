const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const deviceController = require("../controllers/device.controller");
const employeeid = require("../controllers/employee.controller");
const departmentController = require("../controllers/department.controller");
const hikvisionController = require("../controllers/hikvision.controller");
const attendanceController = require("../controllers/attendance.controller");
const organizationController = require("../controllers/organization.controller");
const dashboardController = require("../controllers/dashboard.controller");



router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/device/create", authMiddleware, deviceController.createDevice);
router.get("/device/list", authMiddleware, deviceController.getDevices);
router.post("/device/event/:key", deviceController.deviceEvent);
router.post("/employee/create", authMiddleware, employeeid.createEmployee);
router.get("/employee/list", authMiddleware, employeeid.getEmployees);
router.get("/employee/:id", employeeid.getOneEmployee);
router.put("/employee/:id", employeeid.updateEmployee);
router.delete("/employee/:id", employeeid.deleteEmployee);



router.post("/departments", departmentController.createDepartment);
router.get("/departments/:organizationId", departmentController.getDepartments);
router.get("/departments", departmentController.getAllDepartments);
router.put("/departments/:id", departmentController.updateDepartment);
router.delete("/departments/:id", departmentController.deleteDepartment);

// ================= ORGANIZATIONS =================

router.post("/organizations", organizationController.createOrganization);
router.get("/organizations", organizationController.getOrganizations);
router.get("/organizations/:id", organizationController.getOneOrganization);
router.put("/organizations/:id", organizationController.updateOrganization);
router.delete("/organizations/:id", organizationController.deleteOrganization);
router.post(
  "/hikvision/event/:organizationId",
  upload.any(),
  hikvisionController.deviceEvent,
);
router.get("/attendance/:organizationId", attendanceController.getAttendance);



router.get("/dashboard/:organizationId", dashboardController.getDailyDashboard);
router.get(
  "/dashboard/employee/:employeeId",
  dashboardController.getEmployeeMonthlyStats,
);




router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    adminId: req.adminId,
    organizationId: req.organizationId,
  });
});

module.exports = router;
