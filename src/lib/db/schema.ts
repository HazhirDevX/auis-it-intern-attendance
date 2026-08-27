import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["STUDENT", "ADMIN"]);
export const semesterStatus = pgEnum("semester_status", [
  "DRAFT",
  "ACTIVE",
  "ARCHIVED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    role: userRole("role").notNull().default("STUDENT"),
    active: boolean("active").notNull().default(true),
    image: text("image"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_role_active_idx").on(table.role, table.active),
    check("users_email_lowercase", sql`${table.email} = lower(${table.email})`),
    check(
      "users_allowed_email",
      sql`${table.email} like '%@auis.edu.krd' or ${table.email} = 'hazhir.a.2004@gmail.com'`,
    ),
  ],
);

export const semesters = pgTable(
  "semesters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    targetHours: numeric("target_hours", {
      precision: 7,
      scale: 2,
      mode: "number",
    }).notNull(),
    status: semesterStatus("status").notNull().default("DRAFT"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("semesters_name_unique").on(table.name),
    uniqueIndex("semesters_single_active_idx")
      .on(table.status)
      .where(sql`${table.status} = 'ACTIVE'`),
    index("semesters_dates_idx").on(table.startDate, table.endDate),
    check("semesters_valid_dates", sql`${table.endDate} >= ${table.startDate}`),
    check("semesters_positive_target", sql`${table.targetHours} > 0`),
  ],
);

export const semesterMemberships = pgTable(
  "semester_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    semesterId: uuid("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    active: boolean("active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("memberships_user_semester_unique").on(
      table.userId,
      table.semesterId,
    ),
    index("memberships_semester_active_idx").on(table.semesterId, table.active),
  ],
);

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    semesterId: uuid("semester_id")
      .notNull()
      .references(() => semesters.id, { onDelete: "restrict" }),
    workDate: date("work_date", { mode: "string" }).notNull(),
    hours: numeric("hours", {
      precision: 4,
      scale: 2,
      mode: "number",
    }).notNull(),
    description: varchar("description", { length: 1000 }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    lastEditedBy: uuid("last_edited_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("activities_user_semester_date_idx").on(
      table.userId,
      table.semesterId,
      table.workDate,
    ),
    index("activities_semester_date_idx").on(table.semesterId, table.workDate),
    check("activities_positive_hours", sql`${table.hours} > 0`),
    check("activities_daily_hours_limit", sql`${table.hours} <= 12`),
    check(
      "activities_description_not_blank",
      sql`length(trim(${table.description})) > 0`,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 80 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_actor_date_idx").on(table.actorUserId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export type User = typeof users.$inferSelect;
export type Semester = typeof semesters.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type UserRole = (typeof userRole.enumValues)[number];
