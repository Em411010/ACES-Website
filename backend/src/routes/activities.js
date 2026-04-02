const router = require("express").Router();

const Activity = require("../models/Activity");
const User = require("../models/User");
const { authenticate, checkPerm } = require("../middleware/auth");
const { cloudinary, uploadActivity } = require("../config/cloudinary");
const { audit } = require("../utils/auditLogger");

/* ──────────────────────────────────────────────
   GET /  — list all activities (newest first)
   ────────────────────────────────────────────── */
router.get("/", authenticate, async (_req, res) => {
  const activities = await Activity.find()
    .sort({ dateTime: -1 })
    .populate("createdBy", "fullName")
    .select("-auditLogs"); // lightweight list
  res.json(activities);
});

/* ──────────────────────────────────────────────
   GET /:id  — single activity with full data
   ────────────────────────────────────────────── */
router.get("/:id", authenticate, async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate("createdBy", "fullName")
    .populate("attendance.userId", "fullName studentNumber email section yearLevel roleId")
    .populate({ path: "attendance.markedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.performedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.targetUser", select: "fullName roleId", populate: { path: "roleId", select: "name" } });
  if (!activity) return res.status(404).json({ error: "Activity not found" });
  res.json(activity);
});

/* ──────────────────────────────────────────────
   POST /  — create activity (executives only)
   ────────────────────────────────────────────── */
router.post("/", authenticate, checkPerm("MANAGE_ACTIVITIES"), uploadActivity.single("image"), async (req, res) => {
  const { name, venue, dateTime, description } = req.body;
  if (!name || !venue || !dateTime) {
    return res.status(400).json({ error: "name, venue, and dateTime are required" });
  }

  const activity = await Activity.create({
    name: name.trim(),
    venue: venue.trim(),
    dateTime: new Date(dateTime),
    description: (description || "").trim(),
    image: req.file ? req.file.path : "",
    imagePublicId: req.file ? req.file.filename : "",
    createdBy: req.user._id,
    auditLogs: [
      {
        action: "ACTIVITY_CREATED",
        performedBy: req.user._id,
        details: `Activity "${name.trim()}" created`,
      },
    ],
  });

  await audit(req, {
    action: "CREATE_ACTIVITY",
    module: "ACTIVITY",
    targetType: "Activity",
    targetId: activity._id,
    details: `Created activity "${name.trim()}"`,
    metadata: { venue: venue.trim(), dateTime },
  });

  res.status(201).json(activity);
});

/* ──────────────────────────────────────────────
   PUT /:id  — update activity
   ────────────────────────────────────────────── */
router.put("/:id", authenticate, checkPerm("MANAGE_ACTIVITIES"), uploadActivity.single("image"), async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: "Activity not found" });

  const { name, venue, dateTime, description } = req.body;
  if (name) activity.name = name.trim();
  if (venue) activity.venue = venue.trim();
  if (dateTime) activity.dateTime = new Date(dateTime);
  if (description !== undefined) activity.description = description.trim();
  if (req.file) {
    // Delete old Cloudinary image if exists
    if (activity.imagePublicId) {
      await cloudinary.uploader.destroy(activity.imagePublicId).catch(() => {});
    }
    activity.image = req.file.path;
    activity.imagePublicId = req.file.filename;
  }

  activity.auditLogs.push({
    action: "ACTIVITY_UPDATED",
    performedBy: req.user._id,
    details: `Activity updated by ${req.user.fullName}`,
  });

  await activity.save();

  await audit(req, {
    action: "UPDATE_ACTIVITY",
    module: "ACTIVITY",
    targetType: "Activity",
    targetId: activity._id,
    details: `Updated activity "${activity.name}"`,
  });

  res.json(activity);
});

/* ──────────────────────────────────────────────
   DELETE /:id  — delete activity
   ────────────────────────────────────────────── */
router.delete("/:id", authenticate, checkPerm("MANAGE_ACTIVITIES"), async (req, res) => {
  const activity = await Activity.findByIdAndDelete(req.params.id);
  if (!activity) return res.status(404).json({ error: "Activity not found" });
  // Delete Cloudinary image
  if (activity.imagePublicId) {
    await cloudinary.uploader.destroy(activity.imagePublicId).catch(() => {});
  }

  await audit(req, {
    action: "DELETE_ACTIVITY",
    module: "ACTIVITY",
    targetType: "Activity",
    targetId: activity._id,
    details: `Deleted activity "${activity.name}"`,
  });

  res.json({ message: "Activity deleted" });
});

/* ──────────────────────────────────────────────
   POST /:id/self-mark  — executive self-marks present
   ────────────────────────────────────────────── */
router.post("/:id/self-mark", authenticate, checkPerm("SCAN_ATTENDANCE"), async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: "Activity not found" });

  const already = activity.attendance.find((a) => a.userId.toString() === req.user._id.toString());
  if (already) return res.status(409).json({ error: "Already marked present" });

  activity.attendance.push({
    userId: req.user._id,
    markedBy: req.user._id,
    method: "self-mark",
  });

  activity.auditLogs.push({
    action: "SELF_MARKED_PRESENT",
    performedBy: req.user._id,
    targetUser: req.user._id,
    details: `${req.user.fullName} self-marked as present`,
  });

  await activity.save();

  await audit(req, {
    action: "SELF_MARK_ATTENDANCE",
    module: "ACTIVITY",
    targetType: "Activity",
    targetId: activity._id,
    details: `${req.user.fullName} self-marked present at "${activity.name}"`,
  });

  // Re-populate for response
  const updated = await Activity.findById(activity._id)
    .populate("attendance.userId", "fullName studentNumber email section yearLevel roleId")
    .populate({ path: "attendance.markedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.performedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.targetUser", select: "fullName roleId", populate: { path: "roleId", select: "name" } });

  res.json(updated);
});

/* ──────────────────────────────────────────────
   POST /:id/scan  — scan QR code for attendance
   ────────────────────────────────────────────── */
router.post("/:id/scan", authenticate, checkPerm("SCAN_ATTENDANCE"), async (req, res) => {
  const { digitalIDHash } = req.body;
  if (!digitalIDHash) return res.status(400).json({ error: "digitalIDHash required" });

  const activity = await Activity.findById(req.params.id);
  if (!activity) return res.status(404).json({ error: "Activity not found" });

  const targetUser = await User.findOne({ digitalIDHash });
  if (!targetUser) return res.status(404).json({ error: "Invalid QR code — user not found" });

  const already = activity.attendance.find((a) => a.userId.toString() === targetUser._id.toString());
  if (already) {
    return res.status(409).json({
      error: "Already marked present",
      user: { fullName: targetUser.fullName, studentNumber: targetUser.studentNumber },
    });
  }

  activity.attendance.push({
    userId: targetUser._id,
    markedBy: req.user._id,
    method: "qr-scan",
  });

  activity.auditLogs.push({
    action: "QR_SCANNED",
    performedBy: req.user._id,
    targetUser: targetUser._id,
    details: `${req.user.fullName} scanned QR for ${targetUser.fullName}`,
  });

  await activity.save();

  await audit(req, {
    action: "QR_SCAN_ATTENDANCE",
    module: "ACTIVITY",
    targetType: "Activity",
    targetId: activity._id,
    details: `${req.user.fullName} scanned QR for ${targetUser.fullName} at "${activity.name}"`,
    metadata: { scannedUserId: String(targetUser._id), scannedUserName: targetUser.fullName },
  });

  const updated = await Activity.findById(activity._id)
    .populate("attendance.userId", "fullName studentNumber email section yearLevel roleId")
    .populate({ path: "attendance.markedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.performedBy", select: "fullName roleId", populate: { path: "roleId", select: "name" } })
    .populate({ path: "auditLogs.targetUser", select: "fullName roleId", populate: { path: "roleId", select: "name" } });

  res.json({
    activity: updated,
    scannedUser: { fullName: targetUser.fullName, studentNumber: targetUser.studentNumber },
  });
});

/* ──────────────────────────────────────────────
   GET /user/:userId/attendance  — attendance history for a user
   ────────────────────────────────────────────── */
router.get("/user/:userId/attendance", authenticate, async (req, res) => {
  const activities = await Activity.find({ "attendance.userId": req.params.userId })
    .select("name venue dateTime attendance")
    .sort({ dateTime: -1 });

  const history = activities.map((a) => {
    const record = a.attendance.find((att) => att.userId.toString() === req.params.userId);
    return {
      activityId: a._id,
      activityName: a.name,
      venue: a.venue,
      dateTime: a.dateTime,
      markedAt: record?.markedAt,
      method: record?.method,
    };
  });

  res.json(history);
});

module.exports = router;
