const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    dateTime: { type: Date, required: true },
    description: { type: String, default: "" },
    image: { type: String, default: "" },         // Cloudinary secure URL
    imagePublicId: { type: String, default: "" }, // Cloudinary public_id for deletion
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Embedded attendance records
    attendance: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        markedAt: { type: Date, default: Date.now },
        markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        method: { type: String, enum: ["qr-scan", "self-mark"], required: true },
      },
    ],

    // Audit trail per activity
    auditLogs: [
      {
        action: { type: String, required: true }, // e.g. "SELF_MARKED_PRESENT", "QR_SCANNED"
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        targetUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: "" },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate attendance: one user per activity
activitySchema.index({ _id: 1, "attendance.userId": 1 });

module.exports = mongoose.model("Activity", activitySchema);
