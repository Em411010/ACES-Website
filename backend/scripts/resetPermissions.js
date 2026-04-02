/**
 * resetPermissions.js
 * Sets Chairman to have ALL permissions, every other role to have NONE.
 * Run once: node scripts/resetPermissions.js
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Role = require("../src/models/Role");

const ALL_PERMISSIONS = [
  "MANAGE_ROLES",
  "MANAGE_MEMBERS",
  "VIEW_AUDIT_LOGS",
  "POST_ANNOUNCEMENT",
  "MANAGE_DOCUMENTS",
  "BYPASS_MUST_READ",
  "CREATE_TASK",
  "APPROVE_SUBMISSIONS",
  "SCAN_ATTENDANCE",
  "MANAGE_ACTIVITIES",
];

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://emmanueljr11010_db_user:TzKrRJeSQs7nPaF9@cluster0.0n24qnt.mongodb.net/?appName=Cluster0";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Chairman gets everything
  const chairRes = await Role.updateOne(
    { name: "Chairman" },
    { $set: { permissions: ALL_PERMISSIONS } }
  );
  console.log(`Chairman updated (${chairRes.modifiedCount} modified)`);

  // Every other role gets nothing
  const othersRes = await Role.updateMany(
    { name: { $ne: "Chairman" } },
    { $set: { permissions: [] } }
  );
  console.log(`All other roles cleared (${othersRes.modifiedCount} modified)`);

  // Verify
  const roles = await Role.find().sort({ position: 1 }).select("name permissions");
  console.log("\nCurrent state:");
  for (const r of roles) {
    console.log(`  ${r.name}: [${r.permissions.join(", ") || "none"}]`);
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
