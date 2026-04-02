const Role = require("../models/Role");
const User = require("../models/User");
const Announcement = require("../models/Announcement");
const Task = require("../models/Task");

const ALL_PERMISSIONS = [
  "PUBLISH_ANNOUNCEMENT",
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

async function fixHierarchy() {
  // Ensure Event Coordinator (7) is higher than Technical Officer (8)
  const ec = await Role.findOne({ name: "Event Coordinator" });
  const to = await Role.findOne({ name: "Technical Officer" });
  if (ec && to && ec.position > to.position) {
    ec.position = to.position;
    to.position = ec.position + 1;
    await ec.save();
    await to.save();
    console.log("Fixed hierarchy: Event Coordinator now above Technical Officer");
  }
  // Ensure Alumni role exists
  const alumniExists = await Role.findOne({ name: "Alumni" });
  if (!alumniExists) {
    await Role.create({
      name: "Alumni",
      color: "#78716C",
      position: 998,
      permissions: [],
      isEditable: false,
      officialDuties: "Former ACES officer or member who has graduated.",
    });
    console.log("Created Alumni role");
  }
}

async function seedAll() {
  await fixHierarchy();

  // Skip if data already exists
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log("Database already seeded, skipping...");
    return;
  }

  console.log("Seeding database with initial data...");

  // ─── Roles (17 officer roles + Member) ───────────────
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
      name: "Internal Vice-Chairman",
      color: "#00BCD4",
      position: 1,
      permissions: [
        "MANAGE_MEMBERS", "POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS",
        "CREATE_TASK", "APPROVE_SUBMISSIONS", "SCAN_ATTENDANCE", "MANAGE_ACTIVITIES",
      ],
      isEditable: true,
      officialDuties: "Oversees internal committee operations and member welfare.",
    },
    {
      name: "External Vice-Chairman",
      color: "#00ACC1",
      position: 2,
      permissions: [
        "MANAGE_MEMBERS", "POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS",
        "CREATE_TASK", "APPROVE_SUBMISSIONS", "SCAN_ATTENDANCE", "MANAGE_ACTIVITIES",
      ],
      isEditable: true,
      officialDuties: "Manages external partnerships, affiliations, and inter-organizational relations.",
    },
    {
      name: "Secretary",
      color: "#8B5CF6",
      position: 3,
      permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
      isEditable: true,
      officialDuties: "Handles documentation, minutes, and official communications.",
    },
    {
      name: "Auditor",
      color: "#F59E0B",
      position: 4,
      permissions: ["VIEW_AUDIT_LOGS", "MANAGE_DOCUMENTS"],
      isEditable: true,
      officialDuties: "Reviews financial records and ensures organizational transparency.",
    },
    {
      name: "Treasurer",
      color: "#10B981",
      position: 5,
      permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
      isEditable: true,
      officialDuties: "Manages financial records, budgets, and organization funds.",
    },
    {
      name: "Public Information Officer",
      color: "#EC4899",
      position: 6,
      permissions: ["POST_ANNOUNCEMENT"],
      isEditable: true,
      officialDuties: "Manages public relations and official organizational communications.",
    },
    {
      name: "Event Coordinator",
      color: "#7C3AED",
      position: 7,
      permissions: ["CREATE_TASK", "SCAN_ATTENDANCE", "MANAGE_ACTIVITIES"],
      isEditable: true,
      officialDuties: "Coordinates and manages all organizational events and activities.",
    },
    {
      name: "Technical Officer",
      color: "#64748B",
      position: 8,
      permissions: ["CREATE_TASK"],
      isEditable: true,
      officialDuties: "Plans and executes technical projects and competitions.",
    },
    {
      name: "Social Media Officer",
      color: "#0EA5E9",
      position: 9,
      permissions: ["POST_ANNOUNCEMENT"],
      isEditable: true,
      officialDuties: "Manages the organization's social media platforms and online presence.",
    },
    {
      name: "Multimedia Officer",
      color: "#6366F1",
      position: 10,
      permissions: [],
      isEditable: true,
      officialDuties: "Handles photography, videography, and multimedia content production.",
    },
    {
      name: "1st Year Representative",
      color: "#94A3B8",
      position: 11,
      permissions: [],
      isEditable: true,
      officialDuties: "Represents the interests and concerns of 1st year BSCPE students.",
    },
    {
      name: "2nd Year Representative",
      color: "#94A3B8",
      position: 12,
      permissions: [],
      isEditable: true,
      officialDuties: "Represents the interests and concerns of 2nd year BSCPE students.",
    },
    {
      name: "3rd Year Representative",
      color: "#94A3B8",
      position: 13,
      permissions: [],
      isEditable: true,
      officialDuties: "Represents the interests and concerns of 3rd year BSCPE students.",
    },
    {
      name: "4th Year Representative",
      color: "#94A3B8",
      position: 14,
      permissions: [],
      isEditable: true,
      officialDuties: "Represents the interests and concerns of 4th year BSCPE students.",
    },
    {
      name: "Alumni",
      color: "#78716C",
      position: 998,
      permissions: [],
      isEditable: false,
      officialDuties: "Former ACES officer or member who has graduated.",
    },
    {
      name: "Member",
      color: "#475569",
      position: 999,
      permissions: [],
      isEditable: false,
      officialDuties: "",
    },
  ]);

  const roleMap = {};
  roles.forEach((r) => (roleMap[r.name] = r._id));

  // ─── Users (17 officers matching org chart + dummy members) ──
  const usersData = [
    // Chairman
    {
      email: "chairman@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Juan", middleName: "Santos", lastName: "Dela Cruz",
      fullName: "Juan Santos Dela Cruz",
      studentNumber: "2023-00001",
      section: "41001", yearLevel: 4,
      roleId: roleMap["Chairman"],
    },
    // Internal Vice-Chairman
    {
      email: "ivc@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Maria", middleName: "", lastName: "Santos",
      fullName: "Maria Santos",
      studentNumber: "2023-00002",
      section: "41002", yearLevel: 4,
      roleId: roleMap["Internal Vice-Chairman"],
    },
    // External Vice-Chairman
    {
      email: "evc@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Rafael", middleName: "", lastName: "Lim",
      fullName: "Rafael Lim",
      studentNumber: "2023-00003",
      section: "41003", yearLevel: 4,
      roleId: roleMap["External Vice-Chairman"],
    },
    // Secretary
    {
      email: "secretary@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Angela", middleName: "", lastName: "Lopez",
      fullName: "Angela Lopez",
      studentNumber: "2023-00004",
      section: "31001", yearLevel: 3,
      roleId: roleMap["Secretary"],
    },
    // Auditor
    {
      email: "auditor@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Bryan", middleName: "", lastName: "Mendoza",
      fullName: "Bryan Mendoza",
      studentNumber: "2023-00005",
      section: "31002", yearLevel: 3,
      roleId: roleMap["Auditor"],
    },
    // Treasurer
    {
      email: "treasurer@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Carla", middleName: "", lastName: "Reyes",
      fullName: "Carla Reyes",
      studentNumber: "2023-00006",
      section: "31003", yearLevel: 3,
      roleId: roleMap["Treasurer"],
    },
    // Public Information Officer
    {
      email: "pio@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Diego", middleName: "", lastName: "Torres",
      fullName: "Diego Torres",
      studentNumber: "2023-00007",
      section: "31004", yearLevel: 3,
      roleId: roleMap["Public Information Officer"],
    },
    // Technical Officer 1
    {
      email: "tech1@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Elaine", middleName: "", lastName: "Vergara",
      fullName: "Elaine Vergara",
      studentNumber: "2023-00008",
      section: "21001", yearLevel: 2,
      roleId: roleMap["Technical Officer"],
    },
    // Event Coordinator
    {
      email: "events@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Grace", middleName: "", lastName: "Ramos",
      fullName: "Grace Ramos",
      studentNumber: "2023-00009",
      section: "21002", yearLevel: 2,
      roleId: roleMap["Event Coordinator"],
    },
    // Technical Officer 2
    {
      email: "tech2@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Felix", middleName: "", lastName: "Pascual",
      fullName: "Felix Pascual",
      studentNumber: "2023-00010",
      section: "21003", yearLevel: 2,
      roleId: roleMap["Technical Officer"],
    },
    // Social Media Officer 1
    {
      email: "smo1@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Hannah", middleName: "", lastName: "Bautista",
      fullName: "Hannah Bautista",
      studentNumber: "2023-00011",
      section: "21004", yearLevel: 2,
      roleId: roleMap["Social Media Officer"],
    },
    // Multimedia Officer
    {
      email: "multimedia@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Jasmine", middleName: "", lastName: "Flores",
      fullName: "Jasmine Flores",
      studentNumber: "2023-00012",
      section: "21005", yearLevel: 2,
      roleId: roleMap["Multimedia Officer"],
    },
    // Social Media Officer 2
    {
      email: "smo2@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Ivan", middleName: "", lastName: "Cruz",
      fullName: "Ivan Cruz",
      studentNumber: "2023-00013",
      section: "21006", yearLevel: 2,
      roleId: roleMap["Social Media Officer"],
    },
    // 1st Year Representative
    {
      email: "rep1@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Liza", middleName: "", lastName: "Aguilar",
      fullName: "Liza Aguilar",
      studentNumber: "2025-00001",
      section: "11001", yearLevel: 1,
      roleId: roleMap["1st Year Representative"],
    },
    // 2nd Year Representative
    {
      email: "rep2@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Marco", middleName: "", lastName: "Villanueva",
      fullName: "Marco Villanueva",
      studentNumber: "2024-00001",
      section: "21007", yearLevel: 2,
      roleId: roleMap["2nd Year Representative"],
    },
    // 3rd Year Representative
    {
      email: "rep3@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Nina", middleName: "", lastName: "Castillo",
      fullName: "Nina Castillo",
      studentNumber: "2023-00014",
      section: "31005", yearLevel: 3,
      roleId: roleMap["3rd Year Representative"],
    },
    // 4th Year Representative
    {
      email: "rep4@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Oscar", middleName: "", lastName: "Bernardo",
      fullName: "Oscar Bernardo",
      studentNumber: "2022-00001",
      section: "41004", yearLevel: 4,
      roleId: roleMap["4th Year Representative"],
    },
    // Dummy members
    {
      email: "member1@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Paolo", middleName: "", lastName: "Rivera",
      fullName: "Paolo Rivera",
      studentNumber: "2024-00050",
      section: "22002", yearLevel: 2,
      roleId: roleMap["Member"],
    },
    {
      email: "member2@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Jessa", middleName: "Mae", lastName: "Lim",
      fullName: "Jessa Mae Lim",
      studentNumber: "2025-00010",
      section: "11003", yearLevel: 1,
      roleId: roleMap["Member"],
    },
    {
      email: "member3@aces.bcp.edu.ph",
      password: "password123",
      firstName: "Carlo", middleName: "", lastName: "Navarro",
      fullName: "Carlo Navarro",
      studentNumber: "2024-00051",
      section: "22003", yearLevel: 2,
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
      authorId: userMap["Juan Santos Dela Cruz"],
      title: "Engineering Week 2026 — Mandatory Attendance",
      content:
        "All ACES members are required to attend the Engineering Week activities from **April 14-18, 2026**. Please bring your Digital ID for attendance scanning. Failure to attend will affect your membership standing.\n\n## Schedule\n- Mon: Opening Ceremony\n- Tue: Tech Talks\n- Wed: Hackathon\n- Thu: Sports Fest\n- Fri: Closing & Awards",
      isMustRead: true,
      acknowledgedBy: [userMap["Maria Santos"], userMap["Angela Lopez"]],
      createdAt: new Date("2026-03-30T08:00:00Z"),
    },
    {
      authorId: userMap["Maria Santos"],
      title: "General Assembly — April 5",
      content:
        "Reminder: General Assembly this Saturday, April 5 at 10:00 AM in the CPE Lab. Agenda includes election of new committee heads and budget review for Q2.",
      isMustRead: false,
      acknowledgedBy: [
        userMap["Juan Santos Dela Cruz"],
        userMap["Angela Lopez"],
        userMap["Carla Reyes"],
        userMap["Paolo Rivera"],
      ],
      createdAt: new Date("2026-03-28T14:30:00Z"),
    },
    {
      authorId: userMap["Angela Lopez"],
      title: "Updated Organization Bylaws",
      content:
        "The revised ACES bylaws have been uploaded to the Document Vault. Please review the changes regarding membership eligibility and officer responsibilities.",
      isMustRead: false,
      acknowledgedBy: [userMap["Juan Santos Dela Cruz"]],
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
      assignees: [userMap["Jasmine Flores"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Santos Dela Cruz"],
    },
    {
      title: "Secure Venue Reservation",
      description: "Coordinate with admin for CPE Lab and auditorium booking on April 14-18.",
      status: "done",
      deadline: new Date("2026-03-28"),
      assignees: [userMap["Grace Ramos"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Santos Dela Cruz"],
    },
    {
      title: "Prepare Hackathon Mechanics",
      description: "Draft the rules, judging criteria, and prizes for the Hackathon event.",
      status: "in-progress",
      deadline: new Date("2026-04-07"),
      assignees: [userMap["Elaine Vergara"], userMap["Felix Pascual"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Santos Dela Cruz"],
    },
    {
      title: "Collect Sponsorship Letters",
      description: "Follow up with local tech companies for sponsorship confirmations.",
      status: "in-progress",
      deadline: new Date("2026-04-05"),
      assignees: [userMap["Diego Torres"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Maria Santos"],
    },
    {
      title: "Print Member Certificates",
      description: "Prepare and print certificates of membership for all active members.",
      status: "todo",
      deadline: new Date("2026-04-10"),
      assignees: [userMap["Angela Lopez"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Maria Santos"],
    },
    {
      title: "Setup Registration Booth",
      description: "Prepare materials and manpower for the event registration booth.",
      status: "todo",
      deadline: new Date("2026-04-13"),
      assignees: [userMap["Paolo Rivera"], userMap["Jessa Mae Lim"]],
      eventCluster: "Engineering Week 2026",
      createdBy: userMap["Juan Santos Dela Cruz"],
    },
    {
      title: "Social Media Campaign",
      description: "Create and schedule posts for Engineering Week promotion across all platforms.",
      status: "review",
      deadline: new Date("2026-04-03"),
      assignees: [userMap["Hannah Bautista"], userMap["Ivan Cruz"]],
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
