const router = require("express").Router();
const Role = require("../models/Role");
const User = require("../models/User");
const { authenticate, checkPerm, checkHierarchy } = require("../middleware/auth");
const { audit } = require("../utils/auditLogger");

// Get all roles (sorted by position)
router.get("/", authenticate, async (_req, res) => {
  const roles = await Role.find().sort({ position: 1 });
  res.json(roles);
});

// Create role
router.post("/", authenticate, checkPerm("MANAGE_ROLES"), async (req, res) => {
  const { name, color, position, permissions, officialDuties } = req.body;

  // Ensure position is below user's role
  const userRole = req.user.roleId;
  if (position <= userRole.position) {
    return res.status(403).json({ error: "Cannot create a role at or above your level" });
  }

  const role = await Role.create({
    name,
    color,
    position,
    permissions: permissions || [],
    officialDuties: officialDuties || "",
  });

  await audit(req, {
    action: "CREATE_ROLE",
    module: "ROLE",
    targetType: "Role",
    targetId: role._id,
    details: `Created role "${role.name}"`,
    metadata: { roleName: name, position },
  });

  res.status(201).json(role);
});

// Update role permissions only (works on any role except Chairman)
router.put("/:id/permissions", authenticate, checkPerm("MANAGE_ROLES"), async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (role.name === "Chairman") {
    return res.status(403).json({ error: "Cannot modify Chairman permissions" });
  }

  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: "permissions must be an array" });
  }

  role.permissions = permissions;
  await role.save();

  await audit(req, {
    action: "UPDATE_ROLE_PERMISSIONS",
    module: "ROLE",
    targetType: "Role",
    targetId: role._id,
    details: `Updated permissions for role "${role.name}"`,
    metadata: { roleName: role.name, permissions },
  });

  res.json(role);
});

// Update role
router.put("/:id", authenticate, checkPerm("MANAGE_ROLES"), async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (!role.isEditable) return res.status(403).json({ error: "Cannot edit default roles" });

  // Hierarchy check
  const userRole = req.user.roleId;
  if (role.position <= userRole.position) {
    return res.status(403).json({ error: "Cannot edit a role at or above your level" });
  }

  const { name, color, position, permissions, officialDuties } = req.body;
  if (name) role.name = name;
  if (color) role.color = color;
  if (position !== undefined) role.position = position;
  if (permissions) role.permissions = permissions;
  if (officialDuties !== undefined) role.officialDuties = officialDuties;

  await role.save();

  await audit(req, {
    action: "UPDATE_ROLE",
    module: "ROLE",
    targetType: "Role",
    targetId: role._id,
    details: `Updated role "${role.name}"`,
    metadata: { roleName: role.name },
  });

  res.json(role);
});

// Delete role (cascade: revert users to Member)
router.delete("/:id", authenticate, checkPerm("MANAGE_ROLES"), async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) return res.status(404).json({ error: "Role not found" });
  if (!role.isEditable) return res.status(403).json({ error: "Cannot delete default roles" });

  const userRole = req.user.roleId;
  if (role.position <= userRole.position) {
    return res.status(403).json({ error: "Cannot delete a role at or above your level" });
  }

  const memberRole = await Role.findOne({ name: "Member", isEditable: false });
  await User.updateMany({ roleId: role._id }, { roleId: memberRole._id });

  await audit(req, {
    action: "DELETE_ROLE",
    module: "ROLE",
    targetType: "Role",
    targetId: role._id,
    details: `Deleted role "${role.name}" — affected users reverted to Member`,
    metadata: { roleName: role.name },
  });

  await Role.findByIdAndDelete(req.params.id);

  res.json({ message: "Role deleted, affected users reverted to Member" });
});

// Reorder roles (batch update positions)
router.put("/reorder/batch", authenticate, checkPerm("MANAGE_ROLES"), async (req, res) => {
  const { order } = req.body; // [{ _id, position }]
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "order must be an array" });
  }

  const ops = order.map(({ _id, position }) => ({
    updateOne: {
      filter: { _id },
      update: { position },
    },
  }));
  await Role.bulkWrite(ops);

  await audit(req, {
    action: "REORDER_ROLES",
    module: "ROLE",
    details: `Reordered ${order.length} roles`,
    metadata: { order },
  });

  const roles = await Role.find().sort({ position: 1 });
  res.json(roles);
});

module.exports = router;
