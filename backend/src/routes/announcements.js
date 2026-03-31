const router = require("express").Router();
const Announcement = require("../models/Announcement");
const { authenticate, checkPerm } = require("../middleware/auth");

// Get all announcements (newest first)
router.get("/", authenticate, async (_req, res) => {
  const announcements = await Announcement.find()
    .populate("authorId", "fullName avatar roleId")
    .sort({ createdAt: -1 });
  res.json(announcements);
});

// Create announcement
router.post("/", authenticate, checkPerm("POST_ANNOUNCEMENT"), async (req, res) => {
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

// Delete announcement
router.delete("/:id", authenticate, checkPerm("POST_ANNOUNCEMENT"), async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) return res.status(404).json({ error: "Not found" });

  // Only author or higher can delete
  if (announcement.authorId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: "Only the author can delete" });
  }

  await Announcement.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;
