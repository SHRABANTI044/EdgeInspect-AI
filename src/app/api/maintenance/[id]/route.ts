import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenanceTasks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = String(body.status).toUpperCase();
  if (body.priority) updates.priority = String(body.priority).toUpperCase();
  if (typeof body.title === "string") updates.title = body.title;
  if (typeof body.description === "string") updates.description = body.description;

  const [updated] = await db
    .update(maintenanceTasks)
    .set(updates)
    .where(
      and(eq(maintenanceTasks.id, id), eq(maintenanceTasks.userId, session.sub))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task: updated });
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
  await db
    .delete(maintenanceTasks)
    .where(
      and(eq(maintenanceTasks.id, id), eq(maintenanceTasks.userId, session.sub))
    );
  return NextResponse.json({ ok: true });
}
