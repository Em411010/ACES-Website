const router = require("express").Router();
const User = require("../models/User");
const Role = require("../models/Role");
const { authenticate, checkPerm } = require("../middleware/auth");

// List all users
router.get("/", authenticate, checkPerm("MANAGE_MEMBERS"), async (_req, res) => {
  const users = await User.find().populate("roleId").sort({ fullName: 1 });
  res.json(users);
});

// Get single user
router.get("/:id", authenticate, async (req, res) => {
  const user = await User.findById(req.params.id).populate("roleId");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Assign role to user
router.put("/:id/role", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  const { roleId } = req.body;
  const targetRole = await Role.findById(roleId);
  if (!targetRole) return res.status(404).json({ error: "Role not found" });

  const userRole = req.user.roleId;
  if (targetRole.position <= userRole.position) {
    return res.status(403).json({ error: "Cannot assign a role at or above your level" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Cannot change role of someone at or above your level
  const currentTargetRole = await Role.findById(user.roleId);
  if (currentTargetRole && currentTargetRole.position <= userRole.position) {
    return res.status(403).json({ error: "Cannot modify a user at or above your level" });
  }

  user.roleId = roleId;
  await user.save();

  const updated = await User.findById(user._id).populate("roleId");
  res.json(updated);
});

// Update user profile
router.put("/:id", authenticate, async (req, res) => {
  const isSelf = req.user._id.toString() === req.params.id;
  const hasManagePerm = req.user.roleId.permissions.includes("MANAGE_MEMBERS");

  if (!isSelf && !hasManagePerm) {
    return res.status(403).json({ error: "Cannot edit other users" });
  }

  const { firstName, middleName, lastName, studentNumber, section } = req.body;
  const updates = {};
  if (firstName) {
    updates.firstName = firstName.trim();
    updates.middleName = (middleName || "").trim();
    updates.lastName = (lastName || "").trim();
    updates.fullName = [firstName.trim(), middleName?.trim(), lastName?.trim()]
      .filter(Boolean)
      .join(" ");
  }
  if (studentNumber) updates.studentNumber = studentNumber;
  if (section) {
    updates.section = section;
    updates.yearLevel = parseInt(section[0]) || 1;
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
  }).populate("roleId");

  res.json(user);
});

// ── Chairman: notify all members to update profile ──────────────
router.post("/notify-profile-update", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  try {
    // Set profileUpdatePending = true for everyone except the sender
    await User.updateMany(
      { _id: { $ne: req.user._id } },
      { $set: { profileUpdatePending: true } }
    );
    res.json({ message: "All members notified to update their profile." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── Member: dismiss profile-update notification after updating ───
router.post("/dismiss-profile-update", authenticate, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { profileUpdatePending: false });
    res.json({ message: "Notification dismissed." });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
