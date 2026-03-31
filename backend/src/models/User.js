const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, sparse: true },
    facebookId: { type: String, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    // Split name fields (populated on register; fullName auto-derived)
    firstName: { type: String, trim: true, default: "" },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, trim: true, default: "" },
    fullName: { type: String, required: true, trim: true },
    studentNumber: { type: String, default: "" },
    section: { type: String, default: "" },
    yearLevel: { type: Number, default: 1 },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    digitalIDHash: { type: String, unique: true, sparse: true },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    // Semester profile-update request flag
    profileUpdatePending: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function () {
  if (this.isModified("password") && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  if (!this.digitalIDHash) {
    this.digitalIDHash = crypto
      .createHash("sha256")
      .update(`${this._id}-${this.email}-${Date.now()}`)
      .digest("hex")
      .slice(0, 16);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Exclude password from JSON serialization
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
