const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, index: true },
    module: {
      type: String,
      required: true,
      enum: [
        "AUTH",
        "USER",
        "ROLE",
        "ACTIVITY",
        "ANNOUNCEMENT",
        "DOCUMENT",
        "TASK",
        "EVENT",
        "ATTENDANCE",
      ],
      index: true,
    },
    targetType: { type: String },
    targetId: { type: mongoose.Schema.Types.ObjectId },
    details: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: "" },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
