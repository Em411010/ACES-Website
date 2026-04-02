const router = require("express").Router();
const User = require("../models/User");
const Role = require("../models/Role");
const { authenticate, checkPerm } = require("../middleware/auth");
const { cloudinary, uploadActivity } = require("../config/cloudinary");
const { audit } = require("../utils/auditLogger");
const { notify } = require("../utils/notifier");
const { sendWelcomeEmail } = require("../utils/mailer");

// Reuse cloudinary config with an avatar-specific multer instance
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: "aces/avatars", allowed_formats: ["jpg", "jpeg", "png", "webp"], transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto" }] },
});
const uploadAvatar = multer({ storage: avatarStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// List all active users (sorted by role hierarchy, then alphabetical)
router.get("/", authenticate, async (req, res) => {
  const perms = req.user?.roleId?.permissions || [];
  const canManageMembers = perms.includes("MANAGE_MEMBERS");
  const canCreateTask = perms.includes("CREATE_TASK");

  if (!canManageMembers && !canCreateTask) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const users = await User.find({ isActive: true }).populate("roleId");
  // Sort by role position (ascending = higher rank), then alphabetical
  users.sort((a, b) => {
    const posA = a.roleId?.position ?? 9999;
    const posB = b.roleId?.position ?? 9999;
    if (posA !== posB) return posA - posB;
    return a.fullName.localeCompare(b.fullName);
  });
  res.json(users);
});

// List pending (unapproved) registrations
router.get("/pending", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  const users = await User.find({ isActive: false }).populate("roleId").sort({ createdAt: -1 });
  res.json(users);
});

// Approve a pending registration
router.put("/:id/approve", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.isActive) return res.status(400).json({ error: "User is already active" });

  user.isActive = true;
  await user.save();

  await audit(req, {
    action: "APPROVE_USER",
    module: "USER",
    targetType: "User",
    targetId: user._id,
    details: `Approved registration of ${user.fullName}`,
  });

  await notify({
    recipientId: user._id,
    type: "REGISTRATION_APPROVED",
    title: "Registration Approved",
    message: `Your account has been approved by ${req.user.fullName}. Welcome to ACES!`,
    link: "/dashboard",
  });

  // Send acceptance email
  const approverRole = req.user.roleId?.name || "Officer";
  sendWelcomeEmail(user.email, user.fullName, req.user.fullName, approverRole).catch((err) =>
    console.error("Welcome email error:", err)
  );

  const updated = await User.findById(user._id).populate("roleId");
  res.json(updated);
});

// Reject a pending registration
router.delete("/:id/reject", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  if (user.isActive) return res.status(400).json({ error: "Cannot reject an active user" });

  await audit(req, {
    action: "REJECT_USER",
    module: "USER",
    targetType: "User",
    targetId: user._id,
    details: `Rejected registration of ${user.fullName}`,
    metadata: { email: user.email },
  });

  await user.deleteOne();
  res.json({ message: "Registration rejected" });
});

// Get single user
router.get("/:id", authenticate, async (req, res) => {
  const user = await User.findById(req.params.id).populate("roleId");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// Roles that only one person can hold at a time
const UNIQUE_ROLES = [
  "Chairman",
  "Internal Vice-Chairman",
  "External Vice-Chairman",
  "Secretary",
  "Treasurer",
  "Auditor",
  "Public Information Officer",
];

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

  // Check uniqueness constraint for restricted roles
  if (UNIQUE_ROLES.includes(targetRole.name)) {
    const existing = await User.findOne({ roleId, _id: { $ne: user._id }, isActive: true });
    if (existing) {
      return res.status(409).json({
        error: `The role "${targetRole.name}" is already held by ${existing.fullName}. Only one person can hold this role.`,
      });
    }
  }

  user.roleId = roleId;
  await user.save();

  await audit(req, {
    action: "ASSIGN_ROLE",
    module: "USER",
    targetType: "User",
    targetId: user._id,
    details: `Assigned role "${targetRole.name}" to ${user.fullName}`,
    metadata: { roleName: targetRole.name, roleId: String(roleId) },
  });

  await notify({
    recipientId: user._id,
    type: "ROLE_CHANGED",
    title: "Role Changed",
    message: `${req.user.fullName} changed your role to "${targetRole.name}"`,
    link: "/chain",
    metadata: { roleName: targetRole.name },
  });

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

  await audit(req, {
    action: "UPDATE_PROFILE",
    module: "USER",
    targetType: "User",
    targetId: user._id,
    details: isSelf ? `${user.fullName} updated their profile` : `Updated profile of ${user.fullName}`,
    metadata: updates,
  });

  res.json(user);
});

// ── Upload / update avatar ────────────────────────────────────────
router.put("/:id/avatar", authenticate, uploadAvatar.single("avatar"), async (req, res) => {
  const isSelf = req.user._id.toString() === req.params.id;
  const hasManagePerm = req.user.roleId.permissions.includes("MANAGE_MEMBERS");
  if (!isSelf && !hasManagePerm) return res.status(403).json({ error: "Forbidden" });
  if (!req.file) return res.status(400).json({ error: "No image provided" });

  const existing = await User.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found" });

  // Delete old Cloudinary avatar if it has one stored
  if (existing.avatarPublicId) {
    await cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => {});
  }

  const updated = await User.findByIdAndUpdate(
    req.params.id,
    { avatar: req.file.path, avatarPublicId: req.file.filename },
    { new: true }
  ).populate("roleId");

  await audit(req, {
    action: "UPDATE_AVATAR",
    module: "USER",
    targetType: "User",
    targetId: updated._id,
    details: isSelf ? `${updated.fullName} updated their avatar` : `Updated avatar of ${updated.fullName}`,
  });

  res.json(updated);
});

// ── Chairman: notify all members to update profile ──────────────
router.post("/notify-profile-update", authenticate, checkPerm("MANAGE_MEMBERS"), async (req, res) => {
  try {
    // Set profileUpdatePending = true for everyone except the sender
    await User.updateMany(
      { _id: { $ne: req.user._id } },
      { $set: { profileUpdatePending: true } }
    );

    await audit(req, {
      action: "NOTIFY_PROFILE_UPDATE",
      module: "USER",
      details: "Notified all members to update their profile",
    });

    // Send in-app notification to all active users
    const allUsers = await User.find({ isActive: true, _id: { $ne: req.user._id } }).select("_id");
    await notify({
      recipientId: allUsers.map((u) => u._id),
      type: "PROFILE_UPDATE_REQUESTED",
      title: "Profile Update Requested",
      message: `${req.user.fullName} requested all members to update their profile information`,
      link: "/id",
    });

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

// ── Pass Chairmanship ─────────────────────────────────────────────
// Verify current user's password (used for sensitive actions)
router.post("/verify-password", authenticate, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const user = await User.findById(req.user._id);
    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: "Incorrect password" });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Pass Chairmanship ─────────────────────────────────────────────
router.post("/pass-chairmanship", authenticate, async (req, res) => {
  try {
    const { password, newChairmanId, selfRoleName } = req.body;

    // Must be the current Chairman
    const chairmanRole = await Role.findOne({ name: "Chairman" });
    if (!chairmanRole || String(req.user.roleId._id) !== String(chairmanRole._id)) {
      return res.status(403).json({ error: "Only the Chairman can pass chairmanship" });
    }

    // Validate inputs
    if (!password || !newChairmanId || !selfRoleName) {
      return res.status(400).json({ error: "Password, successor, and new role are required" });
    }
    if (selfRoleName !== "Alumni" && selfRoleName !== "Member") {
      return res.status(400).json({ error: "New role must be Alumni or Member" });
    }
    if (String(newChairmanId) === String(req.user._id)) {
      return res.status(400).json({ error: "You cannot pass chairmanship to yourself" });
    }

    // Validate password
    const currentUser = await User.findById(req.user._id);
    const passwordMatch = await currentUser.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Find successor
    const successor = await User.findById(newChairmanId);
    if (!successor || !successor.isActive) {
      return res.status(404).json({ error: "Successor not found" });
    }

    // Find target roles
    const selfRole = await Role.findOne({ name: selfRoleName });
    if (!selfRole) {
      return res.status(500).json({ error: `Role "${selfRoleName}" not found` });
    }

    // Transfer chairmanship
    successor.roleId = chairmanRole._id;
    await successor.save();

    currentUser.roleId = selfRole._id;
    await currentUser.save();

    await audit(req, {
      action: "PASS_CHAIRMANSHIP",
      module: "USER",
      targetType: "User",
      targetId: successor._id,
      details: `${currentUser.fullName} passed Chairmanship to ${successor.fullName} and became ${selfRoleName}`,
      metadata: { newChairmanId: String(successor._id), selfNewRole: selfRoleName },
    });

    // Notify the successor
    await notify({
      recipientId: successor._id,
      type: "CHAIRMANSHIP_TRANSFERRED",
      title: "Chairmanship Transferred",
      message: `${currentUser.fullName} has transferred the Chairmanship to you`,
      link: "/chain",
    });

    // Notify all other active users about the transfer
    const otherUsers = await User.find({
      isActive: true,
      _id: { $nin: [currentUser._id, successor._id] },
    }).select("_id");
    if (otherUsers.length > 0) {
      await notify({
        recipientId: otherUsers.map((u) => u._id),
        type: "CHAIRMANSHIP_TRANSFERRED",
        title: "Leadership Change",
        message: `${successor.fullName} is the new Chairman (transferred from ${currentUser.fullName})`,
        link: "/chain",
      });
    }

    const updatedSelf = await User.findById(currentUser._id).populate("roleId");
    res.json({ user: updatedSelf, message: "Chairmanship transferred successfully" });
  } catch (err) {
    console.error("Pass chairmanship error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
