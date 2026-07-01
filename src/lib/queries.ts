import { db } from "@/db";
import { inspections, defects, users } from "@/db/schema";
import { eq, and, desc, asc, sql, gte, count } from "drizzle-orm";

export async function getDashboardStats(userId: string) {
  const totals = await db
    .select({
      inspections: count(),
      totalDefects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
      avgConfidence: sql<number>`coalesce(avg(${inspections.confidenceAvg}),0)::float`,
      avgProcessingMs: sql<number>`coalesce(avg(${inspections.processingTimeMs}),0)::float`,
      critical: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'CRITICAL')::int`,
      warning: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'WARNING')::int`,
      clean: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'CLEAN')::int`,
      info: sql<number>`count(*) filter (where ${inspections.maxSeverity} = 'INFO')::int`,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId));

  const t = totals[0] ?? {};
  const total = Number(t.inspections ?? 0);
  return {
    totalInspections: total,
    totalDefects: Number(t.totalDefects ?? 0),
    avgConfidence: Math.round(Number(t.avgConfidence ?? 0) * 1000) / 1000,
    avgProcessingMs: Math.round(Number(t.avgProcessingMs ?? 0) * 10) / 10,
    critical: Number(t.critical ?? 0),
    warning: Number(t.warning ?? 0),
    info: Number(t.info ?? 0),
    clean: Number(t.clean ?? 0),
    passRate: total > 0 ? Math.round((Number(t.clean ?? 0) / total) * 1000) / 10 : 0,
  };
}

export async function getRecentInspections(userId: string, limit = 6) {
  return db
    .select({
      id: inspections.id,
      fileName: inspections.fileName,
      component: inspections.component,
      aircraftType: inspections.aircraftType,
      status: inspections.status,
      processingTimeMs: inspections.processingTimeMs,
      defectCount: inspections.defectCount,
      maxSeverity: inspections.maxSeverity,
      confidenceAvg: inspections.confidenceAvg,
      thumbnailPath: inspections.thumbnailPath,
      createdAt: inspections.createdAt,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .orderBy(desc(inspections.createdAt))
    .limit(limit);
}

export async function getInspectionDetail(id: string, userId: string) {
  const [inspection] = await db
    .select()
    .from(inspections)
    .where(and(eq(inspections.id, id), eq(inspections.userId, userId)))
    .limit(1);
  if (!inspection) return null;

  const defectRows = await db
    .select()
    .from(defects)
    .where(eq(defects.inspectionId, id))
    .orderBy(asc(defects.confidence));

  return { inspection, defects: defectRows };
}

export async function getAllInspections(userId: string, limit = 50) {
  return db
    .select({
      id: inspections.id,
      fileName: inspections.fileName,
      component: inspections.component,
      aircraftType: inspections.aircraftType,
      status: inspections.status,
      processingTimeMs: inspections.processingTimeMs,
      modelVersion: inspections.modelVersion,
      defectCount: inspections.defectCount,
      maxSeverity: inspections.maxSeverity,
      confidenceAvg: inspections.confidenceAvg,
      summary: inspections.summary,
      thumbnailPath: inspections.thumbnailPath,
      imageWidth: inspections.imageWidth,
      imageHeight: inspections.imageHeight,
      createdAt: inspections.createdAt,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .orderBy(desc(inspections.createdAt))
    .limit(limit);
}

export async function getUserProfile(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      organization: users.organization,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

export async function getSeverityBreakdown(userId: string) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db
    .select({
      type: defects.type,
      total: count(),
      avgConf: sql<number>`coalesce(avg(${defects.confidence}),0)::float`,
    })
    .from(defects)
    .innerJoin(inspections, eq(defects.inspectionId, inspections.id))
    .where(and(eq(inspections.userId, userId), gte(inspections.createdAt, since)))
    .groupBy(defects.type)
    .orderBy(desc(count()));
}
