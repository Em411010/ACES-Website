import type { User, Role, Announcement, Task } from "@/types";

export const mockRoles: Role[] = [
  {
    _id: "r1",
    name: "Chairman",
    color: "#D4A017",
    position: 0,
    permissions: [
      "MANAGE_ROLES", "MANAGE_MEMBERS", "VIEW_AUDIT_LOGS",
      "POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS", "BYPASS_MUST_READ",
      "CREATE_TASK", "APPROVE_SUBMISSIONS", "SCAN_ATTENDANCE",
    ],
    isEditable: false,
    officialDuties: "Overall management of ACES organization activities and operations.",
  },
  {
    _id: "r2",
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
    _id: "r3",
    name: "Secretary",
    color: "#8B5CF6",
    position: 2,
    permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
    isEditable: true,
    officialDuties: "Handles documentation and official communications.",
  },
  {
    _id: "r4",
    name: "Treasurer",
    color: "#10B981",
    position: 3,
    permissions: ["POST_ANNOUNCEMENT", "MANAGE_DOCUMENTS"],
    isEditable: true,
    officialDuties: "Manages financial records and organization funds.",
  },
  {
    _id: "r5",
    name: "Auditor",
    color: "#F59E0B",
    position: 4,
    permissions: ["VIEW_AUDIT_LOGS"],
    isEditable: true,
    officialDuties: "Reviews financial records and ensures transparency.",
  },
  {
    _id: "r6",
    name: "P.R.O.",
    color: "#EC4899",
    position: 5,
    permissions: ["POST_ANNOUNCEMENT"],
    isEditable: true,
    officialDuties: "Public relations and social media management.",
  },
  {
    _id: "r7",
    name: "Member",
    color: "#64748B",
    position: 999,
    permissions: [],
    isEditable: false,
    officialDuties: "",
  },
];

export const mockUsers: User[] = [
  {
    _id: "u1",
    email: "chairman@bcp.edu.ph",
    fullName: "Juan Dela Cruz",
    studentNumber: "2023-00001",
    yearLevel: 4,
    roleId: "r1",
    digitalIDHash: "hash_u1_abc123",
    avatar: "",
  },
  {
    _id: "u2",
    email: "vice@bcp.edu.ph",
    fullName: "Maria Santos",
    studentNumber: "2023-00002",
    yearLevel: 4,
    roleId: "r2",
    digitalIDHash: "hash_u2_def456",
    avatar: "",
  },
  {
    _id: "u3",
    email: "secretary@bcp.edu.ph",
    fullName: "Ana Reyes",
    studentNumber: "2023-00003",
    yearLevel: 3,
    roleId: "r3",
    digitalIDHash: "hash_u3_ghi789",
    avatar: "",
  },
  {
    _id: "u4",
    email: "treasurer@bcp.edu.ph",
    fullName: "Carlos Garcia",
    studentNumber: "2024-00010",
    yearLevel: 3,
    roleId: "r4",
    digitalIDHash: "hash_u4_jkl012",
    avatar: "",
  },
  {
    _id: "u5",
    email: "member1@bcp.edu.ph",
    fullName: "Paolo Rivera",
    studentNumber: "2024-00015",
    yearLevel: 2,
    roleId: "r7",
    digitalIDHash: "hash_u5_mno345",
    avatar: "",
  },
  {
    _id: "u6",
    email: "member2@bcp.edu.ph",
    fullName: "Rica Mendoza",
    studentNumber: "2024-00020",
    yearLevel: 2,
    roleId: "r7",
    digitalIDHash: "hash_u6_pqr678",
    avatar: "",
  },
];

export const mockAnnouncements: Announcement[] = [
  {
    _id: "a1",
    authorId: "u1",
    title: "Engineering Week 2026 — Mandatory Attendance",
    content:
      "All ACES members are required to attend the Engineering Week activities from **April 14-18, 2026**. Please bring your Digital ID for attendance scanning. Failure to attend will affect your membership standing.\n\n## Schedule\n- Mon: Opening Ceremony\n- Tue: Tech Talks\n- Wed: Hackathon\n- Thu: Sports Fest\n- Fri: Closing & Awards",
    isMustRead: true,
    acknowledgedBy: ["u2", "u3"],
    createdAt: "2026-03-30T08:00:00Z",
  },
  {
    _id: "a2",
    authorId: "u2",
    title: "General Assembly — April 5",
    content:
      "Reminder: General Assembly this Saturday, April 5 at 10:00 AM in the CPE Lab. Agenda includes election of new committee heads and budget review for Q2.",
    isMustRead: false,
    acknowledgedBy: ["u1", "u3", "u4", "u5"],
    createdAt: "2026-03-28T14:30:00Z",
  },
  {
    _id: "a3",
    authorId: "u3",
    title: "Updated Organization Bylaws",
    content:
      "The revised ACES bylaws have been uploaded to the Document Vault. Please review the changes regarding membership eligibility and officer responsibilities.",
    isMustRead: false,
    acknowledgedBy: ["u1"],
    createdAt: "2026-03-25T10:00:00Z",
  },
];

export const mockTasks: Task[] = [
  {
    _id: "t1",
    title: "Design Event Tarpaulin",
    description: "Create the 4x8ft tarpaulin design for Engineering Week main stage.",
    status: "done",
    deadline: "2026-04-01T00:00:00Z",
    assignees: ["u6"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-20T00:00:00Z",
  },
  {
    _id: "t2",
    title: "Secure Venue Reservation",
    description: "Coordinate with admin for CPE Lab and auditorium booking on April 14-18.",
    status: "done",
    deadline: "2026-03-28T00:00:00Z",
    assignees: ["u4"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-18T00:00:00Z",
  },
  {
    _id: "t3",
    title: "Prepare Hackathon Mechanics",
    description: "Draft the rules, judging criteria, and prizes for the Hackathon event.",
    status: "in-progress",
    deadline: "2026-04-07T00:00:00Z",
    assignees: ["u2", "u3"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-22T00:00:00Z",
  },
  {
    _id: "t4",
    title: "Collect Sponsorship Letters",
    description: "Follow up with local tech companies for sponsorship confirmations.",
    status: "in-progress",
    deadline: "2026-04-05T00:00:00Z",
    assignees: ["u4"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-15T00:00:00Z",
  },
  {
    _id: "t5",
    title: "Print Member Certificates",
    description: "Prepare and print certificates of membership for all active members.",
    status: "todo",
    deadline: "2026-04-10T00:00:00Z",
    assignees: ["u3"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-25T00:00:00Z",
  },
  {
    _id: "t6",
    title: "Setup Registration Booth",
    description: "Prepare materials and manpower for the event registration booth.",
    status: "todo",
    deadline: "2026-04-13T00:00:00Z",
    assignees: ["u5", "u6"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-26T00:00:00Z",
  },
  {
    _id: "t7",
    title: "Social Media Campaign",
    description: "Create and schedule posts for Engineering Week promotion across all platforms.",
    status: "review",
    deadline: "2026-04-03T00:00:00Z",
    assignees: ["u6"],
    eventCluster: "Engineering Week 2026",
    createdAt: "2026-03-21T00:00:00Z",
  },
];

// Current logged-in user (Chairman for testing all permissions)
export const currentUser: User = mockUsers[0];
export const currentRole: Role = mockRoles[0];

export function getRoleById(roleId: string): Role | undefined {
  return mockRoles.find((r) => r._id === roleId);
}

export function getUserById(userId: string): User | undefined {
  return mockUsers.find((u) => u._id === userId);
}
