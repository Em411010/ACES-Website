const router = require("express").Router();
const Event = require("../models/Event");
const { authenticate, checkPerm } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");

const DEFAULT_EVENT = "General";

async function ensureDefaultEvent() {
  const existing = await Event.findOne({ name: DEFAULT_EVENT });
  if (existing) {
    if (!existing.isDefault) {
      existing.isDefault = true;
      await existing.save();
    }
    return existing;
  }

  return Event.create({ name: DEFAULT_EVENT, isDefault: true, createdBy: null });
}

router.get("/", authenticate, async (_req, res) => {
  await ensureDefaultEvent();
  const events = await Event.find().sort({ isDefault: -1, name: 1 });
  res.json(events);
});

router.post("/", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const name = (req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Event name is required" });

  if (name.toLowerCase() === DEFAULT_EVENT.toLowerCase()) {
    return res.status(400).json({ error: "General is a reserved default event" });
  }

  const exists = await Event.findOne({ name: new RegExp(`^${name}$`, "i") });
  if (exists) return res.status(400).json({ error: "Event already exists" });

  const created = await Event.create({
    name,
    isDefault: false,
    createdBy: req.user._id,
  });

  await audit(req, {
    action: "CREATE_EVENT",
    module: "EVENT",
    targetType: "Event",
    targetId: created._id,
    details: `Created event cluster "${name}"`,
  });

  res.status(201).json(created);
});

router.put("/:id", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const nextName = (req.body.name || "").trim();
  if (!nextName) return res.status(400).json({ error: "Event name is required" });

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.isDefault) {
    return res.status(400).json({ error: "Default event cannot be renamed" });
  }

  if (nextName.toLowerCase() === DEFAULT_EVENT.toLowerCase()) {
    return res.status(400).json({ error: "General is a reserved default event" });
  }

  const duplicate = await Event.findOne({
    _id: { $ne: event._id },
    name: new RegExp(`^${nextName}$`, "i"),
  });
  if (duplicate) return res.status(400).json({ error: "Event already exists" });

  event.name = nextName;
  await event.save();

  await audit(req, {
    action: "RENAME_EVENT",
    module: "EVENT",
    targetType: "Event",
    targetId: event._id,
    details: `Renamed event cluster to "${nextName}"`,
  });

  res.json(event);
});

router.delete("/:id", authenticate, checkPerm("CREATE_TASK"), async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).json({ error: "Event not found" });
  if (event.isDefault) {
    return res.status(400).json({ error: "Default event cannot be deleted" });
  }

  await audit(req, {
    action: "DELETE_EVENT",
    module: "EVENT",
    targetType: "Event",
    targetId: event._id,
    details: `Deleted event cluster "${event.name}"`,
  });

  await Event.findByIdAndDelete(req.params.id);
  res.json({ message: "Event deleted" });
});

module.exports = router;
