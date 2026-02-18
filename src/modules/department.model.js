const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    checkInTime: {
      type: String, // "08:00"
      required: true,
    },

    checkOutTime: {
      type: String, // "21:00"
      required: true,
    },

    lateAfterMinutes: {
      type: Number,
      default: 0,
    },

    earlyLeaveMinutes: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// 🔥 bir organization ichida department nomi unique
departmentSchema.index({ organizationId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
