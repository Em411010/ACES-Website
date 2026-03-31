const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Role = require("../models/Role");

// Verify JWT and attach user to req
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate("roleId");
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "User not found or deactivated" });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Check if user's role has a specific permission
function checkPerm(permissionKey) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ error: "No role assigned" });
    }
    const role = req.user.roleId; // Already populated
    if (!role.permissions.includes(permissionKey)) {
      return res
        .status(403)
        .json({ error: `Missing permission: ${permissionKey}` });
    }
    next();
  };
}

// Hierarchy protection: block actions on roles with equal or lower position
function checkHierarchy(targetRoleIdParam = "roleId") {
  return async (req, res, next) => {
    try {
      const targetRoleId = req.params[targetRoleIdParam] || req.body[targetRoleIdParam];
      if (!targetRoleId) return next();

      const targetRole = await Role.findById(targetRoleId);
      if (!targetRole) {
        return res.status(404).json({ error: "Target role not found" });
      }

      const userRole = req.user.roleId;
      if (targetRole.position <= userRole.position) {
        return res.status(403).json({
          error: "Cannot modify a role at or above your hierarchy level",
        });
      }

      req.targetRole = targetRole;
      next();
    } catch (err) {
      return res.status(500).json({ error: "Hierarchy check failed" });
    }
  };
}

// Generate tokens
function generateAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

module.exports = {
  authenticate,
  checkPerm,
  checkHierarchy,
  generateAccessToken,
  generateRefreshToken,
};
