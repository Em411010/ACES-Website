const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventName: { type: String, required: true },
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    scannedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate scans per user per event
attendanceSchema.index({ userId: 1, eventName: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
