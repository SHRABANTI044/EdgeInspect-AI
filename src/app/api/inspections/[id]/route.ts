import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, defects } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { DEFECT_DESCRIPTIONS } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [inspection] = await db
    .select()
    .from(inspections)
    .where(eq(inspections.id, id))
    .limit(1);

  if (!inspection || inspection.userId !== session.sub) {
    return NextResponse.json(
      { error: "Inspection not found." },
      { status: 404 }
    );
  }

  const defectRows = await db
    .select()
    .from(defects)
    .where(eq(defects.inspectionId, id))
    .orderBy(asc(defects.confidence));

  const originalUrl = inspection.thumbnailPath
    ? inspection.thumbnailPath.replace("/anno-", "/orig-")
    : null;

  return NextResponse.json({
    inspection: {
      ...inspection,
      originalUrl,
      annotatedUrl: inspection.thumbnailPath,
    },
    defects: defectRows.map((d) => ({
      ...d,
      description:
        DEFECT_DESCRIPTIONS[d.type] ??
        "Anomalous region identified. Recommend further evaluation.",
    })),
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const [inspection] = await db
    .select({ id: inspections.id, userId: inspections.userId })
    .from(inspections)
    .where(eq(inspections.id, id))
    .limit(1);

  if (!inspection || inspection.userId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(inspections).where(eq(inspections.id, id));
  return NextResponse.json({ ok: true });
}
