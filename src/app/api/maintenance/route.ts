import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceTasks, inspections } from "@/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await db
    .select({
      id: maintenanceTasks.id,
      inspectionId: maintenanceTasks.inspectionId,
      component: maintenanceTasks.component,
      aircraftType: maintenanceTasks.aircraftType,
      title: maintenanceTasks.title,
      description: maintenanceTasks.description,
      priority: maintenanceTasks.priority,
      status: maintenanceTasks.status,
      dueDate: maintenanceTasks.dueDate,
      createdAt: maintenanceTasks.createdAt,
    })
    .from(maintenanceTasks)
    .where(eq(maintenanceTasks.userId, session.sub))
    .orderBy(asc(maintenanceTasks.status), desc(maintenanceTasks.createdAt));

  // summary counts
  const summary = await db
    .select({
      status: maintenanceTasks.status,
      count: sql<number>`count(*)::int`,
    })
    .from(maintenanceTasks)
    .where(eq(maintenanceTasks.userId, session.sub))
    .groupBy(maintenanceTasks.status);

  return NextResponse.json({ tasks, summary });
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    inspectionId,
    component,
    aircraftType,
    title,
    description,
    priority,
    dueDate,
    autoFromInspection,
  } = body ?? {};

  let finalComponent = component;
  let finalAircraft = aircraftType;
  let finalPriority = priority ?? "WARNING";

  if (autoFromInspection && inspectionId) {
    const [insp] = await db
      .select({
        component: inspections.component,
        aircraftType: inspections.aircraftType,
        maxSeverity: inspections.maxSeverity,
        defectCount: inspections.defectCount,
      })
      .from(inspections)
      .where(
        and(eq(inspections.id, inspectionId), eq(inspections.userId, session.sub))
      )
      .limit(1);
    if (!insp) {
      return NextResponse.json(
        { error: "Inspection not found." },
        { status: 404 }
      );
    }
    finalComponent = insp.component;
    finalAircraft = insp.aircraftType;
    finalPriority =
      insp.maxSeverity === "CRITICAL"
        ? "CRITICAL"
        : insp.maxSeverity === "WARNING"
          ? "WARNING"
          : "INFO";
  }

  const [task] = await db
    .insert(maintenanceTasks)
    .values({
      inspectionId: inspectionId ?? null,
      userId: session.sub,
      component: finalComponent ?? "General",
      aircraftType: finalAircraft ?? "General Aviation",
      title: title ?? "Maintenance action required",
      description: description ?? null,
      priority: finalPriority,
      status: "OPEN",
      dueDate: dueDate ? new Date(dueDate) : null,
    })
    .returning();

  return NextResponse.json({ task: task }, { status: 201 });
}
