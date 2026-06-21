import { boolean, index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reportNumber: text("report_number").notNull().unique(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  building: text("building").notNull(),
  roomDetail: text("room_detail").notNull().default(""),
  locationLabel: text("location_label").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull(),
  reporterId: text("reporter_id").notNull(),
  reporterName: text("reporter_name").notNull(),
  reporterDepartment: text("reporter_department").notNull(),
  assignedToName: text("assigned_to_name"),
  assignedToTeam: text("assigned_to_team"),
  assignedAt: timestamp("assigned_at", { withTimezone: true, mode: "date" }),
  sparePart: text("spare_part").notNull().default(""),
  unreadUpdate: boolean("unread_update").notNull().default(false),
});

export const reportAttachments = pgTable("report_attachments", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  name: text("name").notNull(),
  sizeLabel: text("size_label").notNull(),
  previewUrl: text("preview_url").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const reportComments = pgTable("report_comments", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  authorId: text("author_id"),
  authorName: text("author_name").notNull(),
  authorRole: text("author_role").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const reportStatusLogs = pgTable("report_status_logs", {
  id: text("id").primaryKey(),
  reportId: text("report_id").notNull(),
  actorId: text("actor_id"),
  actorName: text("actor_name").notNull(),
  actorRole: text("actor_role").notNull(),
  status: text("status").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull(),
});

export const pushDeviceTokens = pgTable(
  "push_device_tokens",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    token: text("token").notNull(),
    platform: text("platform").notNull().default("android"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_device_tokens_token_idx").on(table.token),
    index("push_device_tokens_user_id_idx").on(table.userId),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    actorId: text("actor_id"),
    actorName: text("actor_name"),
    actorRole: text("actor_role"),
    targetId: text("target_id"),
    targetLabel: text("target_label"),
    description: text("description").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_created_at_idx").on(table.createdAt),
    index("audit_logs_entity_type_idx").on(table.entityType),
    index("audit_logs_actor_id_idx").on(table.actorId),
  ],
);
