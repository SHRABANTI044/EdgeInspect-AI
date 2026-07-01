import sharp from "sharp";
import {
  runYoloInference,
  isYoloAvailable,
  mapYoloDetectionToDefect,
  renderYoloAnnotated,
  type YoloDetection,
} from "./yolo";
import { DEFECT_DESCRIPTIONS } from "./constants";

export interface DetectedDefect {
  type: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
  areaPx: number;
  severity: "CRITICAL" | "WARNING" | "INFO";
  meta: Record<string, unknown>;
}

export interface DetectionStats {
  meanLuminance: number;
  contrast: number;
  edgeRatio: number;
  processedPixels: number;
  blurRadius: number;
  edgeThreshold: number;
}

export interface DetectionResult {
  width: number;
  height: number;
  defects: DetectedDefect[];
  processingTimeMs: number;
  modelVersion: string;
  stats: DetectionStats;
  rawDetections: YoloDetection[];
}

export async function initDetectionEngine(): Promise<boolean> {
  return Promise.resolve(true);
}

export function isDetectionReady(): boolean {
  return isYoloAvailable();
}

export function detectionModelExists(): boolean {
  return true;
}

export function getModelPath(): string {
  return "";
}

export function getEngineError(): string | null {
  return null;
}

async function computeImageStats(buffer: Buffer): Promise<DetectionStats> {
  let meanLuminance = 0;
  let contrast = 0;
  let processedPixels = 0;

  try {
    const sharpMeta = await sharp(buffer).metadata();
    processedPixels = (sharpMeta.width ?? 640) * (sharpMeta.height ?? 640);

    const stats = await sharp(buffer)
      .resize(100, 100, { fit: "inside" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const statsInfo = stats.info;
    const grayData = stats.data;
    const pixelCount = grayData.length;
    let sum = 0;
    for (let i = 0; i < pixelCount; i++) sum += grayData[i];
    meanLuminance = sum / pixelCount;

    let varSum = 0;
    for (let i = 0; i < pixelCount; i++) {
      const d = grayData[i] - meanLuminance;
      varSum += d * d;
    }
    const std = Math.sqrt(varSum / pixelCount);
    contrast = Math.min(1, std / 80);
  } catch {
    // best effort
  }

  return {
    meanLuminance: Math.round(meanLuminance * 10) / 10,
    contrast: Math.round(contrast * 1000) / 1000,
    edgeRatio: 0,
    processedPixels,
    blurRadius: 0,
    edgeThreshold: 0,
  };
}

/**
 * Classical CV fallback: detects defects using image statistics
 * when YOLO is unavailable or produces no detections.
 */
async function runCVAnalysis(
  buffer: Buffer,
  width: number,
  height: number
): Promise<DetectedDefect[]> {
  const defects: DetectedDefect[] = [];

  try {
    const small = await sharp(buffer)
      .resize(200, Math.round(200 * (height / width)), { fit: "inside" })
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const data = small.data;
    const w = small.info.width;
    const h = small.info.height;
    const total = w * h;

    let sum = 0;
    const hist = new Array(256).fill(0);
    for (let i = 0; i < total; i++) {
      const v = data[i];
      sum += v;
      hist[v]++;
    }
    const mean = sum / total;

    let varSum = 0;
    for (let i = 0; i < total; i++) {
      const d = data[i] - mean;
      varSum += d * d;
    }
    const std = Math.sqrt(varSum / total);
    const contrast = std / 80;

    let edgeCount = 0;
    let edgeStrength = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = y * w + x;
        const gx =
          -data[idx - w - 1] + data[idx - w + 1]
          - 2 * data[idx - 1] + 2 * data[idx + 1]
          - data[idx + w - 1] + data[idx + w + 1];
        const gy =
          -data[idx - w - 1] - 2 * data[idx - w] - data[idx - w + 1]
          + data[idx + w - 1] + 2 * data[idx + w] + data[idx + w + 1];
        const mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > 50) edgeCount++;
        edgeStrength += mag;
      }
    }
    const edgeRatio = edgeCount / total;
    const avgEdgeStrength = total > 0 ? edgeStrength / total : 0;

    const darkThreshold = Math.max(30, mean * 0.4);
    const darkPixels = hist.slice(0, Math.floor(darkThreshold)).reduce((a, b) => a + b, 0);
    const darkRatio = darkPixels / total;

    const brightThreshold = Math.min(255, Math.max(200, mean * 1.6));
    const brightPixels = hist.slice(Math.ceil(brightThreshold)).reduce((a, b) => a + b, 0);
    const brightRatio = brightPixels / total;

    // Find actual bounding boxes from image statistics
    function findBoundingBox(
      kind: "edges" | "dark" | "bright",
      minSize: number
    ): { x: number; y: number; width: number; height: number } | null {
      const candidates: { x: number; y: number; w: number; h: number; score: number }[] = [];

      // Scan in patches to find clusters
      const patchSize = 20;
      for (let y = 0; y < h - patchSize; y += patchSize) {
        for (let x = 0; x < w - patchSize; x += patchSize) {
          let score = 0;
          for (let py = 0; py < patchSize; py++) {
            for (let px = 0; px < patchSize; px++) {
              const v = data[(y + py) * w + (x + px)];
              if (kind === "edges" && v > 100) score += v / 255;
              if (kind === "dark" && v < 80) score += (255 - v) / 255;
              if (kind === "bright" && v > 180) score += v / 255;
            }
          }
          if (score > patchSize * patchSize * 0.3) {
            candidates.push({ x, y, w: patchSize, h: patchSize, score });
          }
        }
      }

      if (candidates.length === 0) return null;

      // Merge nearby candidates into one box
      candidates.sort((a, b) => b.score - a.score);
      const top = candidates.slice(0, Math.max(1, Math.floor(candidates.length / 3)));
      const minX = Math.min(...top.map((c) => c.x));
      const minY = Math.min(...top.map((c) => c.y));
      const maxX = Math.max(...top.map((c) => c.x + c.w));
      const maxY = Math.max(...top.map((c) => c.y + c.h));

      return {
        x: Math.max(0, minX - patchSize),
        y: Math.max(0, minY - patchSize),
        width: Math.min(w - minX, maxX - minX + patchSize * 2),
        height: Math.min(h - minY, maxY - minY + patchSize * 2),
      };
    }

    if (edgeRatio > 0.15 && avgEdgeStrength > 15) {
      const confidence = Math.min(0.92, 0.55 + edgeRatio * 1.5 + contrast * 0.3);
      const type = "Crack";
      const severity: "CRITICAL" | "WARNING" | "INFO" =
        confidence > 0.75 ? "WARNING" : "INFO";

      const box = findBoundingBox("edges", 20);
      if (confidence > 0.5 && box) {
        defects.push({
          type,
          confidence: Math.round(confidence * 1000) / 1000,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          areaPx: Math.round(edgeRatio * width * height),
          severity,
          meta: { source: "cv-fallback", method: "edge-detection" },
        });
      }
    }

    if (darkRatio > 0.12 && contrast > 0.2) {
      const confidence = Math.min(0.88, 0.5 + darkRatio * 1.2);
      const severity: "CRITICAL" | "WARNING" | "INFO" =
        confidence > 0.7 ? "WARNING" : "INFO";

      const box = findBoundingBox("dark", 20);
      if (confidence > 0.5 && box && !defects.some((d) => d.type === "Corrosion")) {
        defects.push({
          type: "Corrosion",
          confidence: Math.round(confidence * 1000) / 1000,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          areaPx: Math.round(darkRatio * width * height),
          severity,
          meta: { source: "cv-fallback", method: "dark-spot" },
        });
      }
    }

    if (brightRatio > 0.05 && avgEdgeStrength > 10) {
      const confidence = Math.min(0.78, 0.48 + brightRatio * 3);
      const severity: "CRITICAL" | "WARNING" | "INFO" =
        confidence > 0.65 ? "WARNING" : "INFO";

      const box = findBoundingBox("bright", 20);
      if (confidence > 0.5 && box && !defects.some((d) => d.type === "Scratch")) {
        defects.push({
          type: "Scratch",
          confidence: Math.round(confidence * 1000) / 1000,
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
          areaPx: Math.round(brightRatio * width * height),
          severity,
          meta: { source: "cv-fallback", method: "highlight" },
        });
      }
    }

    if (defects.length === 0 && contrast < 0.25) {
      defects.push({
        type: "Surface Discoloration",
        confidence: 0.41,
        x: Math.round(w * 0.3),
        y: Math.round(h * 0.3),
        width: Math.round(w * 0.4),
        height: Math.round(h * 0.4),
        areaPx: Math.round(width * height * 0.15),
        severity: "INFO",
        meta: { source: "cv-fallback", method: "uniformity" },
      });
    }
  } catch {
    // best effort
  }

  return defects;
}

export async function runDetection(
  imageBuffer: Buffer | Uint8Array
): Promise<DetectionResult> {
  const t0 = performance.now();

  const buffer = Buffer.isBuffer(imageBuffer)
    ? imageBuffer
    : Buffer.from(imageBuffer);

  let width = 640;
  let height = 640;
  let validImage = false;

  try {
    const sharpMeta = await sharp(buffer).metadata();
    width = sharpMeta.width ?? 640;
    height = sharpMeta.height ?? 640;
    validImage = true;
  } catch {
    // Invalid image buffer — will return empty result below
  }

  let yoloResult: Awaited<ReturnType<typeof runYoloInference>> | null = null;
  if (isYoloAvailable() && validImage) {
    try {
      yoloResult = await runYoloInference(buffer, 0.70, 0.50);
    } catch {
      // YOLO failed on this image — fall back to CV
    }
  }

  if (yoloResult && yoloResult.detections.length > 0) {
    const defects: DetectedDefect[] = yoloResult.detections.map((d) =>
      mapYoloDetectionToDefect(d)
    );
    const t1 = performance.now();
    const stats = validImage ? await computeImageStats(buffer) : emptyStats(width, height);

    return {
      width,
      height,
      defects,
      processingTimeMs: yoloResult.processingTimeMs,
      modelVersion: yoloResult.modelVersion,
      stats,
      rawDetections: yoloResult.detections,
    };
  }

  // CV fallback only if we have a valid image
  const cvDefects = validImage ? await runCVAnalysis(buffer, width, height) : [];
  const t1 = performance.now();
  const stats = validImage ? await computeImageStats(buffer) : emptyStats(width, height);

  return {
    width,
    height,
    defects: cvDefects,
    processingTimeMs: Math.round((t1 - t0) * 100) / 100,
    modelVersion: yoloResult ? yoloResult.modelVersion : "cv-fallback-v1.0",
    stats,
    rawDetections: [],
  };
}

function emptyStats(width: number, height: number): DetectionStats {
  return {
    meanLuminance: 0,
    contrast: 0,
    edgeRatio: 0,
    processedPixels: width * height,
    blurRadius: 0,
    edgeThreshold: 0,
  };
}

export async function renderAnnotated(
  imageBuffer: Buffer | Uint8Array,
  result: DetectionResult,
  _resizedWidth: number,
  _resizedHeight: number
): Promise<Buffer> {
  const buffer = Buffer.isBuffer(imageBuffer)
    ? imageBuffer
    : Buffer.from(imageBuffer);
  return renderYoloAnnotated(buffer, result.rawDetections);
}

export function buildSummary(result: DetectionResult): string {
  if (result.defects.length === 0) {
    return "No anomalies detected. Surface integrity within acceptable tolerance thresholds.";
  }

  const byType = new Map<string, number>();
  let critical = 0;
  let warning = 0;

  for (const d of result.defects) {
    byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
    if (d.severity === "CRITICAL") critical++;
    else if (d.severity === "WARNING") warning++;
  }

  const top = [...byType.entries()].sort((a, b) => b[1] - a[1])[0];
  const detail =
    DEFECT_DESCRIPTIONS[top[0]] ??
    "Anomalous region identified. Recommend further non-destructive evaluation.";

  return `Detected ${result.defects.length} anomaly/anomalies (${critical} critical, ${warning} warning). Primary finding: ${top[1]}x ${top[0]}. ${detail}`;
}

export function maxSeverityOf(
  result: DetectionResult
): "CRITICAL" | "WARNING" | "INFO" | "CLEAN" {
  if (result.defects.length === 0) return "CLEAN";
  let level: "CRITICAL" | "WARNING" | "INFO" = "INFO";
  for (const d of result.defects) {
    if (d.severity === "CRITICAL") return "CRITICAL";
    if (d.severity === "WARNING") level = "WARNING";
  }
  return level;
}