import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(
    Number(searchParams.get("limit") ?? "50"),
    200
  );
  const componentFilter = searchParams.get("component");

  const conditions = [eq(inspections.userId, session.sub)];
  if (componentFilter) conditions.push(eq(inspections.component, componentFilter));

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(desc(inspections.createdAt))
    .limit(limit);

  return NextResponse.json({ inspections: rows });
}

export async function POST(request: NextRequest) {
  // Bulk-import style creation not used by UI; kept for completeness.
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
