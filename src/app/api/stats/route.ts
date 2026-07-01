import { NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, defects } from "@/db/schema";
import { eq, sql, and, gte, desc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.sub;

  // KPI totals
  const totals = await db
    .select({
      inspections: sql<number>`count(*)::int`,
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

  // Defects by type (join inspections to scope by user)
  const byType = await db
    .select({
      type: defects.type,
      count: sql<number>`count(*)::int`,
    })
    .from(defects)
    .innerJoin(inspections, eq(defects.inspectionId, inspections.id))
    .where(eq(inspections.userId, userId))
    .groupBy(defects.type)
    .orderBy(desc(sql`count(*)`));

  const bySeverity = await db
    .select({
      severity: defects.severity,
      count: sql<number>`count(*)::int`,
    })
    .from(defects)
    .innerJoin(inspections, eq(defects.inspectionId, inspections.id))
    .where(eq(inspections.userId, userId))
    .groupBy(defects.severity);

  const byComponent = await db
    .select({
      component: inspections.component,
      count: sql<number>`count(*)::int`,
      defects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .groupBy(inspections.component)
    .orderBy(desc(sql`count(*)`));

  // Time series: inspections + defects per day for last 14 days
  const since = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);
  since.setHours(0, 0, 0, 0);
  const timeSeries = await db
    .select({
      day: sql<string>`to_char(date_trunc('day', ${inspections.createdAt}), 'YYYY-MM-DD')`,
      inspections: sql<number>`count(*)::int`,
      defects: sql<number>`coalesce(sum(${inspections.defectCount}),0)::int`,
    })
    .from(inspections)
    .where(and(eq(inspections.userId, userId), gte(inspections.createdAt, since)))
    .groupBy(sql`date_trunc('day', ${inspections.createdAt})`)
    .orderBy(sql`date_trunc('day', ${inspections.createdAt})`);

  const recent = await db
    .select({
      id: inspections.id,
      component: inspections.component,
      aircraftType: inspections.aircraftType,
      defectCount: inspections.defectCount,
      maxSeverity: inspections.maxSeverity,
      confidenceAvg: inspections.confidenceAvg,
      createdAt: inspections.createdAt,
    })
    .from(inspections)
    .where(eq(inspections.userId, userId))
    .orderBy(desc(inspections.createdAt))
    .limit(8);

  const t = totals[0] ?? {};
  const totalInspections = Number(t.inspections ?? 0);
  const passRate =
    totalInspections > 0
      ? Math.round((Number(t.clean ?? 0) / totalInspections) * 1000) / 10
      : 0;

  return NextResponse.json({
    kpis: {
      totalInspections,
      totalDefects: Number(t.totalDefects ?? 0),
      avgConfidence: Math.round(Number(t.avgConfidence ?? 0) * 1000) / 1000,
      avgProcessingMs: Math.round(Number(t.avgProcessingMs ?? 0) * 10) / 10,
      passRate,
      critical: Number(t.critical ?? 0),
      warning: Number(t.warning ?? 0),
      info: Number(t.info ?? 0),
      clean: Number(t.clean ?? 0),
    },
    byType,
    bySeverity,
    byComponent,
    timeSeries,
    recent,
  });
}
