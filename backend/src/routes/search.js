const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");

const User = require("../models/User");
const Announcement = require("../models/Announcement");
const Task = require("../models/Task");
const Document = require("../models/Document");
const Activity = require("../models/Activity");

router.get("/", authenticate, async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q || q.length < 2) {
      return res.json({ results: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const limit = 5;

    const [members, announcements, tasks, documents, activities] =
      await Promise.all([
        User.find({
          isActive: true,
          $or: [
            { fullName: regex },
            { email: regex },
            { studentNumber: regex },
          ],
        })
          .select("_id fullName email studentNumber avatar roleId")
          .populate("roleId", "name color")
          .limit(limit)
          .lean(),

        Announcement.find({
          $or: [{ title: regex }, { content: regex }],
        })
          .select("_id title content isMustRead createdAt")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),

        Task.find({
          $or: [{ title: regex }, { description: regex }],
        })
          .select("_id title status deadline eventCluster")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),

        Document.find({
          $or: [{ title: regex }, { fileName: regex }],
        })
          .select("_id title fileName createdAt")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),

        Activity.find({
          $or: [{ name: regex }, { venue: regex }, { description: regex }],
        })
          .select("_id name venue dateTime image")
          .sort({ dateTime: -1 })
          .limit(limit)
          .lean(),
      ]);

    const results = [];

    for (const m of members) {
      results.push({
        type: "member",
        id: m._id,
        title: m.fullName,
        subtitle: m.studentNumber || m.email,
        avatar: m.avatar || null,
        role: m.roleId ? { name: m.roleId.name, color: m.roleId.color } : null,
        link: `/members/${m._id}`,
      });
    }

    for (const a of announcements) {
      results.push({
        type: "announcement",
        id: a._id,
        title: a.title,
        subtitle:
          a.content.length > 80 ? a.content.slice(0, 80) + "…" : a.content,
        isMustRead: a.isMustRead,
        link: "/billboard",
        linkState: { selectedAnnouncementId: a._id },
      });
    }

    for (const t of tasks) {
      results.push({
        type: "task",
        id: t._id,
        title: t.title,
        subtitle: `${t.status} · ${t.eventCluster || "General"}`,
        status: t.status,
        link: "/tasks",
      });
    }

    for (const d of documents) {
      results.push({
        type: "document",
        id: d._id,
        title: d.title,
        subtitle: d.fileName,
        link: "/documents",
      });
    }

    for (const act of activities) {
      results.push({
        type: "activity",
        id: act._id,
        title: act.name,
        subtitle: act.venue,
        image: act.image || null,
        link: `/activities/${act._id}`,
      });
    }

    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Search failed" });
  }
});

module.exports = router;
