const mongoose = require("mongoose");

const schema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true },
  otp: { type: String, required: true },
  otpExpiry: { type: Date, required: true },
  // Full registration payload — kept until user verifies
  payload: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL: Mongo auto-deletes the document after 10 minutes
schema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });
// Fast lookup by email (so we can upsert on re-register)
schema.index({ email: 1 });

module.exports = mongoose.model("PendingRegistration", schema);
