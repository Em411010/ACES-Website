const router = require("express").Router();
const Announcement = require("../models/Announcement");
const { authenticate } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");
const { notify } = require("../utils/notifier");
const User = require("../models/User");

// Get all announcements (newest first)
router.get("/", authenticate, async (_req, res) => {
  const announcements = await Announcement.find()
    .populate({ path: "authorId", select: "fullName avatar roleId", populate: { path: "roleId", select: "name color" } })
    .populate({ path: "acknowledgedBy", select: "fullName roleId", populate: { path: "roleId", select: "name color" } })
    .sort({ createdAt: -1 });
  res.json(announcements);
});

// Create announcement
router.post("/", authenticate, async (req, res) => {
  const role = req.user.roleId;
  const canPublish =
    Array.isArray(role?.permissions) && role.permissions.includes("POST_ANNOUNCEMENT");

  if (!canPublish) {
    return res.status(403).json({ error: "Missing permission: POST_ANNOUNCEMENT" });
  }

  const { title, content, isMustRead } = req.body;

  // Only users with BYPASS_MUST_READ can post must-read content
  if (isMustRead && !req.user.roleId.permissions.includes("BYPASS_MUST_READ")) {
    return res.status(403).json({ error: "Missing BYPASS_MUST_READ permission" });
  }

  const announcement = await Announcement.create({
    authorId: req.user._id,
    title,
    content,
    isMustRead: !!isMustRead,
  });

  await audit(req, {
    action: "CREATE_ANNOUNCEMENT",
    module: "ANNOUNCEMENT",
    targetType: "Announcement",
    targetId: announcement._id,
    details: `Created announcement "${title}"${isMustRead ? " (must-read)" : ""}`,
  });

  // Notify all active users except the author
  const allUsers = await User.find({ isActive: true, _id: { $ne: req.user._id } }).select("_id");
  const recipientIds = allUsers.map((u) => u._id);
  await notify({
    recipientId: recipientIds,
    type: isMustRead ? "MUST_READ_ANNOUNCEMENT" : "NEW_ANNOUNCEMENT",
    title: isMustRead ? "Must-Read Announcement" : "New Announcement",
    message: `${req.user.fullName} posted: "${title}"`,
    link: "/billboard",
    metadata: { announcementId: String(announcement._id) },
  });

  res.status(201).json(announcement);
});

// Acknowledge announcement
router.post("/:id/acknowledge", authenticate, async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Not found" });

  if (!announcement.acknowledgedBy.includes(req.user._id)) {
    announcement.acknowledgedBy.push(req.user._id);
    await announcement.save();
  }

  res.json({ message: "Acknowledged" });
});

// Update announcement (Chairman only)
router.put("/:id", authenticate, async (req, res) => {
  if (req.user?.roleId?.name !== "Chairman") {
    return res.status(403).json({ error: "Only Chairman can edit announcements" });
  }

  const { title, content, isMustRead } = req.body;
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Not found" });

  if (isMustRead && !req.user.roleId.permissions.includes("BYPASS_MUST_READ")) {
    return res.status(403).json({ error: "Missing BYPASS_MUST_READ permission" });
  }

  announcement.title = title ?? announcement.title;
  announcement.content = content ?? announcement.content;
  announcement.isMustRead = typeof isMustRead === "boolean" ? isMustRead : announcement.isMustRead;
  await announcement.save();

  await audit(req, {
    action: "UPDATE_ANNOUNCEMENT",
    module: "ANNOUNCEMENT",
    targetType: "Announcement",
    targetId: announcement._id,
    details: `Updated announcement "${announcement.title}"`,
  });

  const updated = await Announcement.findById(announcement._id).populate({
    path: "authorId",
    select: "fullName avatar roleId",
    populate: { path: "roleId", select: "name color" },
  });

  res.json(updated);
});

// Delete announcement (Chairman only)
router.delete("/:id", authenticate, async (req, res) => {
  if (req.user?.roleId?.name !== "Chairman") {
    return res.status(403).json({ error: "Only Chairman can delete announcements" });
  }

  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Not found" });

  await audit(req, {
    action: "DELETE_ANNOUNCEMENT",
    module: "ANNOUNCEMENT",
    targetType: "Announcement",
    targetId: announcement._id,
    details: `Deleted announcement "${announcement.title}"`,
  });

  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
