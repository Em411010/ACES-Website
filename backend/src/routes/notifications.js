const router = require("express").Router();
const Notification = require("../models/Notification");
const { authenticate } = require("../middleware/auth");

// GET /api/notifications — current user's notifications (newest first)
router.get("/", authenticate, async (req, res) => {
  try {
    const { unreadOnly, limit = 50, page = 1 } = req.query;

    const filter = { recipientId: req.user._id };
    if (unreadOnly === "true") filter.isRead = false;

    const skip = (Number(page) - 1) * Number(limit);

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipientId: req.user._id, isRead: false }),
    ]);

    res.json({ notifications, total, unreadCount, page: Number(page) });
  } catch (err) {
    console.error("Notifications fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/notifications/unread-count — lightweight badge poll
router.get("/unread-count", authenticate, async (req, res) => {
  const count = await Notification.countDocuments({
    recipientId: req.user._id,
    isRead: false,
  });
  res.json({ count });
});

// PUT /api/notifications/:id/read — mark single as read
router.put("/:id/read", authenticate, async (req, res) => {
  const notif = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notif) return res.status(404).json({ error: "Notification not found" });
  res.json(notif);
});

// PUT /api/notifications/read-all — mark all as read
router.put("/read-all", authenticate, async (req, res) => {
  await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { isRead: true }
  );
  res.json({ message: "All notifications marked as read" });
});

module.exports = router;
