import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/db";
import { inspections, defects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  if (!inspection) {
    return NextResponse.json({ error: "Inspection not found" }, { status: 404 });
  }

  const defectRows = await db
    .select()
    .from(defects)
    .where(eq(defects.inspectionId, id));

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // Letter size
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  let y = 720;

  const drawText = (text: string, x: number, yPos: number, f = font, size = 11, color = rgb(0, 0, 0)) => {
    page.drawText(text, { x, y: yPos, size, font: f, color });
  };

  const sectionTitle = (title: string) => {
    drawText(title, margin, y, bold, 14, rgb(0, 0, 0));
    y -= 18;
  };

  const kv = (label: string, value: string) => {
    drawText(`${label}:`, margin, y, bold, 11, rgb(0, 0, 0));
    drawText(value, margin + 140, y, font, 11, rgb(0.1, 0.1, 0.1));
    y -= 16;
  };

  // Header
  drawText("EdgeInspect AI — Inspection Report", margin, y, bold, 18, rgb(0.05, 0.2, 0.4));
  y -= 24;
  drawText("Generated: " + new Date().toISOString(), margin, y, font, 10, rgb(0.25, 0.25, 0.25));
  y -= 28;

  sectionTitle("Aircraft Details");
  kv("Inspection ID", inspection.id);
  kv("Component", inspection.component);
  kv("Aircraft Type", inspection.aircraftType);
  kv("Timestamp", new Date(inspection.createdAt).toISOString());
  kv("Model Version", inspection.modelVersion);
  kv("Processing Time", `${inspection.processingTimeMs}ms`);

  y -= 6;
  sectionTitle("Results");
  kv("Defects Found", String(defectRows.length));
  kv("Max Severity", inspection.maxSeverity);
  kv("Confidence Avg", `${Math.round((inspection.confidenceAvg || 0) * 100)}%`);
  kv("Summary", inspection.summary || "No summary available.");

  y -= 6;
  if (defectRows.length > 0) {
    sectionTitle("Detected Defects");
    for (const d of defectRows) {
      if (y < 100) break;
      const line = `• ${d.type} | ${(d.confidence * 100).toFixed(0)}% | Severity: ${d.severity} | Area: ${d.areaPx}px`;
      drawText(line, margin + 12, y, font, 10, rgb(0.1, 0.1, 0.1));
      y -= 14;
    }
  } else {
    sectionTitle("Defects");
    drawText("No defects detected.", margin + 12, y, font, 11, rgb(0.1, 0.1, 0.1));
    y -= 18;
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="inspection-${inspection.id}.pdf"`,
    },
  });
}