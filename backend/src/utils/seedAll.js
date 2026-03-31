const Role = require("../models/Role");
const User = require("../models/User");
const Announcement = require("../models/Announcement");
const Task = require("../models/Task");

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

async function seedAll() {
  // Skip if data already exists
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with dummy data...");

  // ─── Roles ───────────────────────────────────────────
  const roles = await Role.insertMany([
    {
      name: "Chairman",
      color: "#D4A017",
      position: 0,
      permissions: ALL_PERMISSIONS,
      isEditable: false,
      officialDuties: "Overall management of ACES organization activities and operations.",
    },
    {
      name: "Vice Chairman",
      color: "#00BCD4",
      position: 1,
      permissions: [
        "MANAGE_MEMBERS", "POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS",
        "CREATE_TASK", "APPROVE_SUBMISSIONS", "SCAN_ATTENDANCE",
      ],
      isEditable: true,
      officialDuties: "Assists the Chairman and oversees committee operations.",
    },
    {
      name: "Secretary",
      color: "#8B5CF6",
      position: 2,
      permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
      isEditable: true,
      officialDuties: "Handles documentation and official communications.",
    },
    {
      name: "Treasurer",
      color: "#10B981",
      position: 3,
      permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
      isEditable: true,
      officialDuties: "Manages financial records and organization funds.",
    },
    {
      name: "Auditor",
      color: "#F59E0B",
      position: 4,
      permissions: ["VIEW_AUDIT_LOGS"],
      isEditable: true,
      officialDuties: "Reviews financial records and ensures transparency.",
    },
    {
      name: "P.R.O.",
      color: "#EC4899",
      position: 5,
      permissions: ["POST_ANNOUNCEMENT"],
      isEditable: true,
      officialDuties: "Public relations and social media management.",
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

  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // ─── Users ───────────────────────────────────────────
  // Password for all seeded accounts: "password123"
  const usersData = [
    {
      email: "chairman@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Juan", middleName: "Santos", lastName: "Dela Cruz",
      fullName: "Juan Santos Dela Cruz",
      studentNumber: "2023-00001",
      section: "41001", yearLevel: 4,
      roleId: roleMap["Chairman"],
    },
    {
      email: "vice@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Maria", middleName: "", lastName: "Santos",
      fullName: "Maria Santos",
      studentNumber: "2023-00002",
      section: "41002", yearLevel: 4,
      roleId: roleMap["Vice Chairman"],
    },
    {
      email: "secretary@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Ana", middleName: "Cruz", lastName: "Reyes",
      fullName: "Ana Cruz Reyes",
      studentNumber: "2023-00003",
      section: "31001", yearLevel: 3,
      roleId: roleMap["Secretary"],
    },
    {
      email: "treasurer@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Carlos", middleName: "", lastName: "Garcia",
      fullName: "Carlos Garcia",
      studentNumber: "2024-00010",
      section: "31002", yearLevel: 3,
      roleId: roleMap["Treasurer"],
    },
    {
      email: "auditor@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Mark", middleName: "Jose", lastName: "Villanueva",
      fullName: "Mark Jose Villanueva",
      studentNumber: "2024-00011",
      section: "32001", yearLevel: 3,
      roleId: roleMap["Auditor"],
    },
    {
      email: "pro@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Rica", middleName: "", lastName: "Mendoza",
      fullName: "Rica Mendoza",
      studentNumber: "2024-00020",
      section: "21001", yearLevel: 2,
      roleId: roleMap["P.R.O."],
    },
    {
      email: "member1@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Paolo", middleName: "", lastName: "Rivera",
      fullName: "Paolo Rivera",
      studentNumber: "2024-00015",
      section: "22002", yearLevel: 2,
      roleId: roleMap["Member"],
    },
    {
      email: "member2@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Jessa", middleName: "Mae", lastName: "Lim",
      fullName: "Jessa Mae Lim",
      studentNumber: "2025-00005",
      section: "11003", yearLevel: 1,
      roleId: roleMap["Member"],
    },
  ];

  const users = [];
  for (const data of usersData) {
    const user = new User(data);
    await user.save(); // triggers password hashing + digitalIDHash
    users.push(user);
  }

  const userMap = {};
  users.forEach((u) => (userMap[u.fullName] = u._id));

  // ─── Announcements ──────────────────────────────────
  await Announcement.insertMany([
    {
      authorId: userMap["Juan Dela Cruz"],
      title: "Engineering Week 2026 — Mandatory Attendance",
      content:
        "All ACES members are required to attend the Engineering Week activities from **April 14-18, 2026**. Please bring your Digital ID for attendance scanning. Failure to attend will affect your membership standing.\n\n## Schedule\n- Mon: Opening Ceremony\n- Tue: Tech Talks\n- Wed: Hackathon\n- Thu: Sports Fest\n- Fri: Closing & Awards",
      isMustRead: true,
      acknowledgedBy: [userMap["Maria Santos"], userMap["Ana Reyes"]],
      createdAt: new Date("2026-03-30T08:00:00Z"),
    },
    {
      authorId: userMap["Maria Santos"],
      title: "General Assembly — April 5",
      content:
        "Reminder: General Assembly this Saturday, April 5 at 10:00 AM in the CPE Lab. Agenda includes election of new committee heads and budget review for Q2.",
      isMustRead: false,
      acknowledgedBy: [
        userMap["Juan Dela Cruz"],
        userMap["Ana Reyes"],
        userMap["Carlos Garcia"],
        userMap["Paolo Rivera"],
      ],
      createdAt: new Date("2026-03-28T14:30:00Z"),
    },
    {
      authorId: userMap["Ana Reyes"],
      title: "Updated Organization Bylaws",
      content:
        "The revised ACES bylaws have been uploaded to the Document Vault. Please review the changes regarding membership eligibility and officer responsibilities.",
      isMustRead: false,
      acknowledgedBy: [userMap["Juan Dela Cruz"]],
      createdAt: new Date("2026-03-25T10:00:00Z"),
    },
  ]);

  // ─── Tasks ──────────────────────────────────────────
  await Task.insertMany([
    {
      title: "Design Event Tarpaulin",
      description: "Create the 4x8ft tarpaulin design for Engineering Week main stage.",
      status: "done",
      deadline: new Date("2026-04-01"),
      assignees: [userMap["Rica Mendoza"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Dela Cruz"],
    },
    {
      title: "Secure Venue Reservation",
      description: "Coordinate with admin for CPE Lab and auditorium booking on April 14-18.",
      status: "done",
      deadline: new Date("2026-03-28"),
      assignees: [userMap["Carlos Garcia"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Dela Cruz"],
    },
    {
      title: "Prepare Hackathon Mechanics",
      description: "Draft the rules, judging criteria, and prizes for the Hackathon event.",
      status: "in-progress",
      deadline: new Date("2026-04-07"),
      assignees: [userMap["Maria Santos"], userMap["Ana Reyes"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Dela Cruz"],
    },
    {
      title: "Collect Sponsorship Letters",
      description: "Follow up with local tech companies for sponsorship confirmations.",
      status: "in-progress",
      deadline: new Date("2026-04-05"),
      assignees: [userMap["Carlos Garcia"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Maria Santos"],
    },
    {
      title: "Print Member Certificates",
      description: "Prepare and print certificates of membership for all active members.",
      status: "todo",
      deadline: new Date("2026-04-10"),
      assignees: [userMap["Ana Reyes"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Maria Santos"],
    },
    {
      title: "Setup Registration Booth",
      description: "Prepare materials and manpower for the event registration booth.",
      status: "todo",
      deadline: new Date("2026-04-13"),
      assignees: [userMap["Paolo Rivera"], userMap["Jessa Lim"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Dela Cruz"],
    },
    {
      title: "Social Media Campaign",
      description: "Create and schedule posts for Engineering Week promotion across all platforms.",
      status: "review",
      deadline: new Date("2026-04-03"),
      assignees: [userMap["Rica Mendoza"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Maria Santos"],
    },
  ]);

  console.log("Database seeded successfully!");
  console.log("─────────────────────────────────────────");
  console.log("Admin login:  chairman@aces.bcp.edu.ph / password123");
  console.log("Member login:  member1@aces.bcp.edu.ph / password123");
  console.log("─────────────────────────────────────────");
}

module.exports = seedAll;
