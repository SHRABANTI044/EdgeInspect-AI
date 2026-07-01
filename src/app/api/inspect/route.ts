import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inspections, defects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import {
  runDetection,
  renderAnnotated,
  buildSummary,
  maxSeverityOf,
  initDetectionEngine,
  isDetectionReady,
  detectionModelExists,
  getModelPath,
  getEngineError,
  type DetectionResult,
} from "@/lib/detection";
import sharp from "sharp";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Lazy-init the YOLO detection engine on first request.
// This prevents concurrent navigation from repeatedly triggering heavy init work.
let detectionInitPromise: Promise<unknown> | null = null;
async function ensureDetectionReady() {
  if (!detectionInitPromise) {
    detectionInitPromise = initDetectionEngine().catch((e) => {
      detectionInitPromise = null;
      console.warn(
        "YOLO detection engine init:",
        e instanceof Error ? e.message : String(e)
      );
      throw e;
    });
  }
  return detectionInitPromise;
}



export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    // runDetection() internally handles YOLO vs CV fallback, so we allow it through.

    const form = await request.formData();
    const file = form.get("image");
    const component = String(form.get("component") || "Fuselage Panel");
    const aircraftType = String(form.get("aircraftType") || "General Aviation");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "An image file is required." }, { status: 400 });
    }

    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Image exceeds the 12MB size limit." }, { status: 413 });
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    const id = randomUUID();
    const originalName = file.name || `${id}.jpg`;

    // Ensure detection engine is ready before inference.
    await ensureDetectionReady();

    // Run YOLOv8 detection (no fallback to heuristics)
    let result: DetectionResult;
    try {
      result = await runDetection(rawBuffer);
    } catch (e) {

      const message = e instanceof Error ? e.message : "Unknown inference error";
      console.error("YOLO detection failed:", message);
      return NextResponse.json(
        { error: `Inference engine failed: ${message}` },
        { status: 422 }
      );
    }

    let originalBytes: Buffer | null = null;
    let annotatedBytes: Buffer | null = null;

    try {
      originalBytes = await sharp(rawBuffer).rotate().jpeg({ quality: 90 }).toBuffer();
      annotatedBytes = await renderAnnotated(rawBuffer, result, result.width, result.height);
    } catch {
      // continue without images
    }

    const processingTimeMs = result.processingTimeMs || Math.round(performance.now() - startedAt);
    result.processingTimeMs = processingTimeMs;

    const summary = buildSummary(result);
    const maxSeverity = maxSeverityOf(result);
    const criticalCount = result.defects.filter((d) => d.severity === "CRITICAL").length;
    const confidenceAvg =
      result.defects.length > 0
        ? result.defects.reduce((s, d) => s + d.confidence, 0) / result.defects.length
        : 0;

    // 1) Insert inspection without aggregates first
    const [inspection] = await db
      .insert(inspections)
      .values({
        id,
        userId: session.sub,
        fileName: originalName,
        component,
        aircraftType,
        imageWidth: result.width,
        imageHeight: result.height,
        status: "COMPLETED",
        processingTimeMs,
        modelVersion: result.modelVersion,
        defectCount: result.defects.length,
        maxSeverity,
        confidenceAvg: Math.round(confidenceAvg * 1000) / 1000,
        summary,
        thumbnailPath: null,
      })
      // Drizzle typings for `returning()` depend on the dialect/version.
      // Here we return the full inserted row to avoid type issues.
      .returning();

    // Store images inline as base64
    const imageUrl = originalBytes ? `data:image/jpeg;base64,${originalBytes.toString("base64")}` : null;
    const annotatedUrl = annotatedBytes ? `data:image/jpeg;base64,${annotatedBytes.toString("base64")}` : null;

    // 2) Store individual defects
    if (result.defects.length > 0) {
      await db.insert(defects).values(
        result.defects.map((d) => ({
          inspectionId: id,
          type: d.type,
          confidence: d.confidence,
          x: d.x,
          y: d.y,
          width: d.width,
          height: d.height,
          areaPx: d.areaPx,
          severity: d.severity,
          meta: d.meta,
        }))
      );
    }

    // 3) Re-read the stored defects and recompute aggregates from them.
    //    This guarantees the inspection record matches exactly what is in the defects table.
    const storedDefects = await db
      .select()
      .from(defects)
      .where(eq(defects.inspectionId, id));

    const storedDefectCount = storedDefects.length;
    const storedConfidenceAvg =
      storedDefectCount > 0
        ? storedDefects.reduce((s, d) => s + d.confidence, 0) / storedDefectCount
        : 0;
    const storedMaxSeverity = storedDefectCount === 0
      ? ("CLEAN" as const)
      : storedDefects.some((d) => d.severity === "CRITICAL")
        ? ("CRITICAL" as const)
        : storedDefects.some((d) => d.severity === "WARNING")
          ? ("WARNING" as const)
          : ("INFO" as const);
    const storedSummary = storedDefectCount === 0
      ? "No anomalies detected. Surface integrity within acceptable tolerance thresholds."
      : buildSummary({
          ...result,
          defects: storedDefects.map((d) => ({
            type: d.type,
            confidence: d.confidence,
            x: d.x,
            y: d.y,
            width: d.width,
            height: d.height,
            areaPx: d.areaPx,
            severity: d.severity as "CRITICAL" | "WARNING" | "INFO",
            meta: d.meta as Record<string, unknown>,
          })),
        });

    await db
      .update(inspections)
      .set({
        defectCount: storedDefectCount,
        confidenceAvg: Math.round(storedConfidenceAvg * 1000) / 1000,
        maxSeverity: storedMaxSeverity,
        summary: storedSummary,
      })
      .where(eq(inspections.id, id));

    const totalMs = Date.now() - startedAt;
    return NextResponse.json({
      inspectionId: inspection!.id,
      width: result.width,
      height: result.height,
      processingTimeMs,
      totalMs,
      modelVersion: result.modelVersion,
      imageUrl: imageUrl,
      annotatedUrl: annotatedUrl,
      maxSeverity,
      confidenceAvg: Math.round(confidenceAvg * 1000) / 1000,
      summary,
      stats: result.stats,
      defects: result.defects.map((d) => ({
        ...d,
        description: `Detected ${d.type} with ${Math.round(d.confidence * 100)}% confidence.`,
      })),
    });
  } catch (err) {
    console.error("inspect error", err);
    return NextResponse.json(
      { error: "Inspection pipeline encountered an unexpected error." },
      { status: 500 }
    );
  }
}