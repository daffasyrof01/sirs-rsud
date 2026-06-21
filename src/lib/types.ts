export type Role = "staff" | "admin" | "superadmin";
export type AuditEntityType = "auth" | "report" | "user" | "notification" | "system";
export type AuditActorRole = Role | "system";

export type AccountStatus = "active" | "inactive";
export type ReportStatus = "pending" | "in_progress" | "resolved" | "rejected";
export type ReportPriority = "low" | "medium" | "high" | "emergency";
export type ReportCategory =
  | "listrik"
  | "plumbing"
  | "struktural"
  | "peralatan_medis"
  | "hvac"
  | "it_jaringan"
  | "lainnya";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  username: string;
  role: Role;
  department: string;
  lastLoginAt: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  department: string;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt: string;
  updatedAt: string;
}

export interface ReportAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  previewUrl: string;
}

export interface ReportComment {
  id: string;
  authorName: string;
  authorRole: Role;
  message: string;
  createdAt: string;
}

export interface ReportStatusLog {
  id: string;
  actorName: string;
  actorRole: Role;
  status: ReportStatus;
  note: string;
  createdAt: string;
}

export interface ReportAssignment {
  name: string;
  note: string;
  assignedAt?: string;
}

export interface Report {
  id: string;
  reportNumber: string;
  title: string;
  category: ReportCategory;
  building: string;
  roomDetail: string;
  locationLabel: string;
  priority: ReportPriority;
  status: ReportStatus;
  description: string;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  reporterId: string;
  reporterName: string;
  reporterDepartment: string;
  assignedTo?: ReportAssignment;
  sparePart: string;
  attachments: ReportAttachment[];
  comments: ReportComment[];
  statusLog: ReportStatusLog[];
  unreadUpdate: boolean;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success";
  createdAt: string;
  read: boolean;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: AuditEntityType;
  entityId?: string;
  actorId?: string;
  actorName: string;
  actorRole?: AuditActorRole;
  targetId?: string;
  targetLabel?: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface DraftReportForm {
  title: string;
  category: ReportCategory;
  location: string;
  priority: ReportPriority;
  description: string;
  occurredAt: string;
  attachments: ReportAttachment[];
}

export interface ReportFilterState {
  search: string;
  status: "all" | ReportStatus;
  priority: "all" | ReportPriority;
  category: "all" | ReportCategory;
  location: string;
  dateFrom: string;
  dateTo: string;
}
