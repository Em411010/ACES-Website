export interface Role {
  _id: string;
  name: string;
  color: string;
  position: number;
  permissions: string[];
  isEditable: boolean;
  officialDuties?: string;
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  studentNumber: string;
  section?: string;
  yearLevel: number;
  roleId: Role | string; // populated or raw id
  digitalIDHash: string;
  avatar: string;
  isActive?: boolean;
  profileUpdatePending?: boolean;
}

export interface Announcement {
  _id: string;
  authorId: User | string; // populated or raw id
  author?: User;
  title: string;
  content: string;
  isMustRead: boolean;
  acknowledgedBy: Array<User | string>;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  deadline: string;
  assignees: Array<User | string>;
  eventCluster?: string;
  createdAt: string;
}

export interface EventItem {
  _id: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentItem {
  _id: string;
  title: string;
  // Legacy fields
  fileUrl: string;
  storageName: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  // Paired-file fields
  pdfUrl?: string;
  pdfStorageName?: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  docxUrl?: string;
  docxStorageName?: string;
  docxFileName?: string;
  docxFileSize?: string;
  uploadedBy?: User | string;
  createdAt: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}

export interface AttendanceRecord {
  userId: User | string;
  markedAt: string;
  markedBy: User | string;
  method: "qr-scan" | "self-mark";
}

export interface ActivityAuditLog {
  action: string;
  performedBy: User | string;
  targetUser?: User | string;
  timestamp: string;
  details: string;
}

export interface Activity {
  _id: string;
  name: string;
  venue: string;
  dateTime: string;
  description: string;
  image: string;
  createdBy: User | string;
  attendance: AttendanceRecord[];
  auditLogs: ActivityAuditLog[];
  createdAt: string;
  updatedAt: string;
}
