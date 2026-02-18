const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },

    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    date: {
      type: String,
      required: true,
    },

    checkIn: Date,
    checkOut: Date,

    status: {
      type: String,
      enum: ["ON_TIME", "LATE", "EARLY_LEAVE"],
      default: "ON_TIME",
    },
  },
  { timestamps: true },
);

attendanceSchema.index(
  { organizationId: 1, employee: 1, date: 1 },
  { unique: true },
);

module.exports = mongoose.model("Attendance", attendanceSchema);
