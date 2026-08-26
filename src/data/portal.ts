import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import { localDateString, weekStartString } from "@/lib/dates";
import { db } from "@/lib/db";
import {
  activities,
  auditLogs,
  semesterMemberships,
  semesters,
  users,
} from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/auth/dal";

const numberSql = (expression: SQL) => sql<number>`${expression}::float`;

export async function getActiveSemester() {
  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.status, "ACTIVE"))
    .limit(1);
  return semester ?? null;
}

export async function getAllSemesters() {
  return db
    .select({
      id: semesters.id,
      name: semesters.name,
      startDate: semesters.startDate,
      endDate: semesters.endDate,
      targetHours: semesters.targetHours,
      status: semesters.status,
      memberCount: count(semesterMemberships.id),
      createdAt: semesters.createdAt,
    })
    .from(semesters)
    .leftJoin(
      semesterMemberships,
      eq(semesterMemberships.semesterId, semesters.id),
    )
    .groupBy(semesters.id)
    .orderBy(desc(semesters.startDate));
}

export async function getMembership(userId: string, semesterId: string) {
  const [membership] = await db
    .select()
    .from(semesterMemberships)
    .where(
      and(
        eq(semesterMemberships.userId, userId),
        eq(semesterMemberships.semesterId, semesterId),
      ),
    )
    .limit(1);
  return membership ?? null;
}

export async function getUserMetrics(userId: string, semesterId: string) {
  const today = localDateString();
  const weekStart = weekStartString(today);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [row] = await db
    .select({
      totalHours: numberSql(sql`coalesce(sum(${activities.hours}), 0)`),
      activityCount: count(activities.id),
      averageHours: numberSql(sql`coalesce(avg(${activities.hours}), 0)`),
      weekHours: numberSql(
        sql`coalesce(sum(${activities.hours}) filter (where ${activities.workDate} >= ${weekStart}), 0)`,
      ),
      monthHours: numberSql(
        sql`coalesce(sum(${activities.hours}) filter (where ${activities.workDate} >= ${monthStart}), 0)`,
      ),
    })
    .from(activities)
    .where(
      and(eq(activities.userId, userId), eq(activities.semesterId, semesterId)),
    );

  return {
    totalHours: Number(row?.totalHours ?? 0),
    activityCount: Number(row?.activityCount ?? 0),
    averageHours: Number(row?.averageHours ?? 0),
    weekHours: Number(row?.weekHours ?? 0),
    monthHours: Number(row?.monthHours ?? 0),
  };
}

export async function getHoursSeries(userId: string, semesterId: string) {
  const rows = await db
    .select({
      date: activities.workDate,
      hours: numberSql(sql`sum(${activities.hours})`),
    })
    .from(activities)
    .where(
      and(eq(activities.userId, userId), eq(activities.semesterId, semesterId)),
    )
    .groupBy(activities.workDate)
    .orderBy(asc(activities.workDate));

  let cumulative = 0;
  return rows.map((row) => {
    const hours = Number(row.hours);
    cumulative += hours;
    return { date: row.date, hours, cumulative };
  });
}

export async function getInternProgress(semesterId: string) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      userActive: users.active,
      membershipActive: semesterMemberships.active,
      hours: numberSql(sql`coalesce(sum(${activities.hours}), 0)`),
      activityCount: count(activities.id),
      targetHours: semesters.targetHours,
    })
    .from(semesterMemberships)
    .innerJoin(users, eq(users.id, semesterMemberships.userId))
    .innerJoin(semesters, eq(semesters.id, semesterMemberships.semesterId))
    .leftJoin(
      activities,
      and(
        eq(activities.userId, users.id),
        eq(activities.semesterId, semesterMemberships.semesterId),
      ),
    )
    .where(eq(semesterMemberships.semesterId, semesterId))
    .groupBy(users.id, semesterMemberships.active, semesters.targetHours)
    .orderBy(desc(sql`coalesce(sum(${activities.hours}), 0)`));

  return rows.map((row) => ({
    ...row,
    hours: Number(row.hours),
    activityCount: Number(row.activityCount),
    progress:
      Math.round((Number(row.hours) / Number(row.targetHours)) * 1000) / 10,
  }));
}

export async function getInterns() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .orderBy(desc(users.active), asc(users.name));
}

export type ActivityFilters = {
  semesterId?: string;
  internId?: string;
  search?: string;
  from?: string;
  to?: string;
  sort?: "oldest" | "newest";
  page?: number;
};

export async function getActivitiesPage(
  viewer: CurrentUser,
  filters: ActivityFilters,
) {
  const conditions: SQL[] = [];

  if (viewer.role === "ADMIN") {
    if (filters.internId)
      conditions.push(eq(activities.userId, filters.internId));
  } else {
    conditions.push(eq(activities.userId, viewer.id));
  }

  if (filters.semesterId) {
    conditions.push(eq(activities.semesterId, filters.semesterId));
  }
  if (filters.from) conditions.push(gte(activities.workDate, filters.from));
  if (filters.to) conditions.push(lte(activities.workDate, filters.to));
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    conditions.push(
      or(
        ilike(activities.description, term),
        ilike(users.name, term),
        ilike(users.email, term),
      )!,
    );
  }

  const where = conditions.length ? and(...conditions) : undefined;
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: activities.id,
        userId: activities.userId,
        userName: users.name,
        userEmail: users.email,
        semesterId: activities.semesterId,
        semesterName: semesters.name,
        semesterStatus: semesters.status,
        workDate: activities.workDate,
        hours: activities.hours,
        description: activities.description,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
      })
      .from(activities)
      .innerJoin(users, eq(users.id, activities.userId))
      .innerJoin(semesters, eq(semesters.id, activities.semesterId))
      .where(where)
      .orderBy(
        filters.sort === "oldest"
          ? asc(activities.workDate)
          : desc(activities.workDate),
        desc(activities.createdAt),
      )
      .limit(DEFAULT_PAGE_SIZE)
      .offset(offset),
    db
      .select({ total: count() })
      .from(activities)
      .innerJoin(users, eq(users.id, activities.userId))
      .where(where),
  ]);

  const total = Number(totals[0]?.total ?? 0);
  return {
    rows,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE)),
  };
}

export async function getRecentActivities(semesterId: string, limit = 6) {
  return db
    .select({
      id: activities.id,
      userName: users.name,
      workDate: activities.workDate,
      hours: activities.hours,
      description: activities.description,
    })
    .from(activities)
    .innerJoin(users, eq(users.id, activities.userId))
    .where(eq(activities.semesterId, semesterId))
    .orderBy(desc(activities.workDate), desc(activities.createdAt))
    .limit(limit);
}

export async function getInternDetail(userId: string, semesterId: string) {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;
  const [metrics, series, activityPage] = await Promise.all([
    getUserMetrics(userId, semesterId),
    getHoursSeries(userId, semesterId),
    getActivitiesPage(
      { ...user, image: null },
      { semesterId, page: 1, sort: "newest" },
    ),
  ]);

  return { user, metrics, series, activities: activityPage.rows };
}

export async function getAuditHistory() {
  return db
    .select({
      id: auditLogs.id,
      actorName: users.name,
      actorEmail: users.email,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      metadata: auditLogs.metadata,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(100);
}

export async function getExportData(semesterId: string) {
  const [semester] = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, semesterId))
    .limit(1);
  if (!semester) return null;

  const [activityRows, summary] = await Promise.all([
    db
      .select({
        internName: users.name,
        email: users.email,
        semester: semesters.name,
        workDate: activities.workDate,
        hours: activities.hours,
        description: activities.description,
        submittedAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(users, eq(users.id, activities.userId))
      .innerJoin(semesters, eq(semesters.id, activities.semesterId))
      .where(eq(activities.semesterId, semesterId))
      .orderBy(asc(users.name), asc(activities.workDate)),
    getInternProgress(semesterId),
  ]);

  return { semester, activities: activityRows, summary };
}
