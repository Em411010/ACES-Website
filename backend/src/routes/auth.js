const router = require("express").Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { authenticate, generateAccessToken, generateRefreshToken } = require("../middleware/auth");
const User = require("../models/User");
const Role = require("../models/Role");
const PendingRegistration = require("../models/PendingRegistration");
const { sendOtpEmail } = require("../utils/mailer");
const { audit } = require("../utils/auditLogger");

/** Generate a cryptographically random 6-digit OTP string */
function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// ─── Local Login ──────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).populate("roleId");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "Your account is pending approval. Please wait for an officer to accept your registration." });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await audit(req, {
      action: "LOGIN",
      module: "AUTH",
      userId: user._id,
      targetType: "User",
      targetId: user._id,
      details: `${user.fullName} logged in`,
    });

    res.json({ accessToken, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Register Step 1: Validate + Send OTP ─────────────
router.post("/register", async (req, res) => {
  try {
    const { email, password, firstName, middleName, lastName, studentNumber, section } = req.body;

    if (!email || !password || !firstName || !lastName || !studentNumber) {
      return res.status(400).json({ error: "First name, last name, email, password, and student number are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Upsert: replace any previous pending registration for this email
    const pending = await PendingRegistration.findOneAndReplace(
      { email: email.toLowerCase() },
      {
        email: email.toLowerCase(),
        otp,
        otpExpiry,
        payload: { email, password, firstName, middleName, lastName, studentNumber, section },
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email.toLowerCase(), otp);

    res.json({ pendingId: pending._id, message: "OTP sent to your email" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Register Step 2: Verify OTP + Create User ────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { pendingId, code } = req.body;
    if (!pendingId || !code) {
      return res.status(400).json({ error: "Pending ID and OTP code are required" });
    }

    const pending = await PendingRegistration.findById(pendingId);
    if (!pending) {
      return res.status(400).json({ error: "Registration session expired. Please register again." });
    }
    if (new Date() > pending.otpExpiry) {
      await pending.deleteOne();
      return res.status(400).json({ error: "OTP has expired. Please register again." });
    }
    if (pending.otp !== String(code).trim()) {
      return res.status(400).json({ error: "Incorrect OTP. Please try again." });
    }

    const { email, password, firstName, middleName, lastName, studentNumber, section } = pending.payload;

    // Double-check email wasn't registered while OTP was pending
    const existingCheck = await User.findOne({ email: email.toLowerCase() });
    if (existingCheck) {
      await pending.deleteOne();
      return res.status(409).json({ error: "Email already registered" });
    }

    const memberRole = await Role.findOne({ name: "Member", isEditable: false });
    const yearLevel = section ? (parseInt(section[0]) || 1) : 1;
    const fullName = [firstName.trim(), middleName?.trim(), lastName.trim()].filter(Boolean).join(" ");

    const user = new User({
      email: email.toLowerCase(),
      password,
      firstName: firstName.trim(),
      middleName: (middleName || "").trim(),
      lastName: lastName.trim(),
      fullName,
      studentNumber: studentNumber.trim(),
      section: section || "",
      yearLevel,
      roleId: memberRole ? memberRole._id : null,
      isActive: false, // pending approval by Chairman / Vice-Chairmans
    });
    await user.save();
    await pending.deleteOne();

    await audit(req, {
      action: "REGISTER",
      module: "AUTH",
      userId: user._id,
      targetType: "User",
      targetId: user._id,
      details: `${user.fullName} registered (pending approval)`,
      metadata: { email: user.email, studentNumber: user.studentNumber },
    });

    res.status(201).json({
      pendingApproval: true,
      message: "Registration successful! Your account is pending approval by an officer.",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Resend OTP ────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { pendingId } = req.body;
    if (!pendingId) {
      return res.status(400).json({ error: "Pending ID required" });
    }

    const pending = await PendingRegistration.findById(pendingId);
    if (!pending) {
      return res.status(400).json({ error: "Registration session expired. Please register again." });
    }

    const otp = generateOtp();
    pending.otp = otp;
    pending.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    pending.createdAt = new Date(); // reset TTL
    await pending.save();

    await sendOtpEmail(pending.email, otp);

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── Refresh Token ─────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found" });
    }

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
});

// ─── Get Current User ──────────────────────────────────
router.get("/me", authenticate, async (req, res) => {
  const user = await User.findById(req.user._id).populate("roleId");
  res.json(user);
});

// ─── Logout ────────────────────────────────────────────
router.post("/logout", (_req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
});

module.exports = router;
