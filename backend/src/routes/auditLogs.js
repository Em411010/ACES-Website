const router = require("express").Router();
const AuditLog = require("../models/AuditLog");
const { authenticate, checkPerm } = require("../middleware/auth");

// GET /api/audit-logs — paginated, filterable audit trail
router.get("/", authenticate, checkPerm("VIEW_AUDIT_LOGS"), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      module,
      action,
      userId,
      search,
      from,
      to,
    } = req.query;

    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = { $regex: action, $options: "i" };
    if (userId) filter.userId = userId;

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search) {
      filter.details = { $regex: search, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: "userId",
          select: "fullName avatar roleId",
          populate: { path: "roleId", select: "name color" },
        })
        .lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    console.error("Audit log fetch error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/audit-logs/modules — distinct modules for filter dropdown
router.get("/modules", authenticate, checkPerm("VIEW_AUDIT_LOGS"), async (_req, res) => {
  const modules = await AuditLog.distinct("module");
  res.json(modules);
});

// GET /api/audit-logs/actions — distinct actions for filter dropdown
router.get("/actions", authenticate, checkPerm("VIEW_AUDIT_LOGS"), async (_req, res) => {
  const actions = await AuditLog.distinct("action");
  res.json(actions.sort());
});

module.exports = router;
