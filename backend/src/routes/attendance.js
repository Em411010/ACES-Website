const router = require("express").Router();
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { authenticate, checkPerm } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");

// Scan QR code for attendance
router.post("/scan", authenticate, checkPerm("SCAN_ATTENDANCE"), async (req, res) => {
  const { digitalIDHash, eventName } = req.body;

  if (!digitalIDHash || !eventName) {
    return res.status(400).json({ error: "digitalIDHash and eventName required" });
  }

  const user = await User.findOne({ digitalIDHash });
  if (!user) {
    return res.status(404).json({ error: "Invalid QR code — user not found" });
  }

  // Check for duplicate scan
  const existing = await Attendance.findOne({ userId: user._id, eventName });
  if (existing) {
    return res.status(409).json({
      error: "Already scanned",
      attendance: existing,
      user: { fullName: user.fullName, studentNumber: user.studentNumber },
    });
  }

  const attendance = await Attendance.create({
    userId: user._id,
    eventName,
    scannedBy: req.user._id,
  });

  await audit(req, {
    action: "SCAN_ATTENDANCE",
    module: "ATTENDANCE",
    targetType: "User",
    targetId: user._id,
    details: `Scanned QR attendance for ${user.fullName} at "${eventName}"`,
    metadata: { eventName, scannedUserName: user.fullName },
  });

  res.status(201).json({
    attendance,
    user: { fullName: user.fullName, studentNumber: user.studentNumber },
  });
});

// Get attendance for an event
router.get("/event/:eventName", authenticate, async (req, res) => {
  const records = await Attendance.find({ eventName: req.params.eventName })
    .populate("userId", "fullName studentNumber yearLevel")
    .populate("scannedBy", "fullName")
    .sort({ scannedAt: -1 });
  res.json(records);
});

module.exports = router;
