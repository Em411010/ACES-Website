const Role = require("../models/Role");

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
];

async function seedRoles() {
  const count = await Role.countDocuments();
  if (count > 0) return;

  console.log("Seeding default roles...");

  await Role.insertMany([
    {
      name: "Chairman",
      color: "#D4A017",
      position: 0,
      permissions: ALL_PERMISSIONS,
      isEditable: false,
      officialDuties: "Overall management of ACES organization activities and operations.",
    },
    {
      name: "Member",
      color: "#64748B",
      position: 999,
      permissions: [],
      isEditable: false,
      officialDuties: "",
    },
  ]);

  console.log("Default roles created: Chairman, Member");
}

module.exports = seedRoles;
