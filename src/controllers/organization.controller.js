const Organization = require("../modules/organization.model");

// 🔹 CREATE ORGANIZATION
exports.createOrganization = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Name va phone majburiy",
      });
    }

    const existing = await Organization.findOne({ phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bu telefon bilan organization mavjud",
      });
    }

    const organization = await Organization.create({
      name,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 GET ALL ORGANIZATIONS
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find();

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 GET ONE ORGANIZATION
exports.getOneOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization topilmadi",
      });
    }

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
