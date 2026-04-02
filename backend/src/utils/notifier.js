const Notification = require("../models/Notification");

/**
 * Create one notification per recipient.
 * Accepts a single recipientId or an array of recipientIds.
 *
 * @param {object} opts
 * @param {string|string[]} opts.recipientId - single or array of ObjectId strings
 * @param {string} opts.type        - notification type enum
 * @param {string} opts.title       - short title shown in bell
 * @param {string} opts.message     - human-readable body
 * @param {string} [opts.link]      - in-app link (e.g. "/tasks")
 * @param {object} [opts.metadata]  - extra data
 */
async function notify(opts) {
  try {
    const ids = Array.isArray(opts.recipientId)
      ? opts.recipientId
      : [opts.recipientId];

    if (ids.length === 0) return;

    const docs = ids.map((id) => ({
      recipientId: id,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      link: opts.link || "",
      metadata: opts.metadata || {},
    }));

    await Notification.insertMany(docs, { ordered: false });
  } catch (err) {
    console.error("Notification error:", err.message);
  }
}

module.exports = { notify };
