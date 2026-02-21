const Organization = require("../modules/organization.model");
const mongoose = require("mongoose");

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
    console.error("CREATE ORG ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 GET ALL ORGANIZATIONS
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: organizations,
    });
  } catch (error) {
    console.error("GET ALL ORG ERROR:", error);
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Noto‘g‘ri ID",
      });
    }

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
    console.error("GET ONE ORG ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 UPDATE ORGANIZATION
exports.updateOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Noto‘g‘ri ID",
      });
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization topilmadi",
      });
    }

    // Agar phone o‘zgartirilsa unique tekshiramiz
    if (phone && phone !== organization.phone) {
      const existing = await Organization.findOne({ phone });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Bu telefon bilan boshqa organization mavjud",
        });
      }
    }

    organization.name = name ?? organization.name;
    organization.phone = phone ?? organization.phone;
    organization.address = address ?? organization.address;

    await organization.save();

    res.json({
      success: true,
      data: organization,
    });
  } catch (error) {
    console.error("UPDATE ORG ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// 🔹 DELETE ORGANIZATION (Hard delete)
exports.deleteOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Noto‘g‘ri ID",
      });
    }

    const organization = await Organization.findById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization topilmadi",
      });
    }

    await organization.deleteOne();

    res.json({
      success: true,
      message: "Organization o‘chirildi",
    });
  } catch (error) {
    console.error("DELETE ORG ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
