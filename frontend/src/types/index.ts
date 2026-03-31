export interface User {
  _id: string;
  email: string;
  fullName: string;
  studentNumber: string;
  yearLevel: number;
  roleId: string;
  digitalIDHash: string;
  avatar: string;
}

export interface Role {
  _id: string;
  name: string;
  color: string;
  position: number;
  permissions: string[];
  isEditable: boolean;
  officialDuties?: string;
}

export interface Announcement {
  _id: string;
  authorId: string;
  author?: User;
  title: string;
  content: string;
  isMustRead: boolean;
  acknowledgedBy: string[];
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  deadline: string;
  assignees: string[];
  eventCluster?: string;
  createdAt: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string;
}
