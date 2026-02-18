const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Organization", organizationSchema);
