const AuditLog = require("../models/AuditLog");

/**
 * Log an audit event.
 *
 * @param {object} req    - Express request (used for userId + IP)
 * @param {object} opts
 * @param {string} opts.action      - e.g. "LOGIN", "APPROVE_USER"
 * @param {string} opts.module      - e.g. "AUTH", "USER", "ROLE"
 * @param {string} [opts.targetType]- e.g. "User", "Activity"
 * @param {string} [opts.targetId]  - ObjectId of the target
 * @param {string} [opts.details]   - Human-readable description
 * @param {object} [opts.metadata]  - Any extra structured data
 * @param {string} [opts.userId]    - Override user ID (for unauthenticated actions like register)
 */
async function audit(req, opts) {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress ||
      "";

    await AuditLog.create({
      userId: opts.userId || req.user?._id,
      action: opts.action,
      module: opts.module,
      targetType: opts.targetType || "",
      targetId: opts.targetId || undefined,
      details: opts.details || "",
      metadata: opts.metadata || {},
      ip,
    });
  } catch (err) {
    // Never let audit logging break the main flow
    console.error("Audit log error:", err.message);
  }
}

module.exports = { audit };
