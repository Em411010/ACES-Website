const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#64748B" },
    position: { type: Number, required: true },
    permissions: { type: [String], default: [] },
    isEditable: { type: Boolean, default: true },
    officialDuties: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for sorting hierarchy
roleSchema.index({ position: 1 });

module.exports = mongoose.model("Role", roleSchema);
