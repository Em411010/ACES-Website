const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "TASK_ASSIGNED",
        "NEW_ANNOUNCEMENT",
        "MUST_READ_ANNOUNCEMENT",
        "ROLE_CHANGED",
        "REGISTRATION_APPROVED",
        "PROFILE_UPDATE_REQUESTED",
        "TASK_STATUS_CHANGED",
        "CHAIRMANSHIP_TRANSFERRED",
      ],
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
