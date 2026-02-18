const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Organization = require("../modules/organization.model");
const Admin = require("../modules/admin.model");

exports.register = async (req, res) => {
  try {
    const { name, phone, address, fullName, password } = req.body;

    const existing = await Admin.findOne({ phone });
    if (existing) {
      return res.status(400).json({ message: "Phone already registered" });
    }

    const organization = await Organization.create({
      name,
      phone,
      address,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await Admin.create({
      organizationId: organization._id,
      fullName,
      phone,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        adminId: admin._id,
        organizationId: organization._id,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const admin = await Admin.findOne({ phone });
    if (!admin) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        adminId: admin._id,
        organizationId: admin.organizationId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
