const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const deviceController = require("../controllers/device.controller");
const employeeid = require("../controllers/employee.controller");
const departmentController = require("../controllers/department.controller");

const organizationController = require("../controllers/organization.controller");

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/device/create", authMiddleware, deviceController.createDevice);
router.get("/device/list", authMiddleware, deviceController.getDevices);
router.post("/device/event/:key", deviceController.deviceEvent);
router.post("/employee/create", authMiddleware, employeeid.createEmployee);
router.get("/employee/list", authMiddleware, employeeid.getEmployees);
router.post("/departments", departmentController.createDepartment);

router.post("/organizations", organizationController.createOrganization);
router.get("/organizations", organizationController.getOrganizations);
router.get("/organizations/:id", organizationController.getOneOrganization);

router.get("/me", authMiddleware, (req, res) => {
  res.json({
    success: true,
    adminId: req.adminId,
    organizationId: req.organizationId,
  });
});




module.exports = router;
