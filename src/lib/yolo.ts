import * as ort from "onnxruntime-node";
import sharp from "sharp";
import path from "path";
import fs from "fs";

/**
 * YOLOv8 ONNX inference engine for aircraft defect detection.
 *
 * Loads a trained YOLOv8 .onnx model from /models/aircraft_defect.onnx
 * and performs real object detection on aircraft panel images.
 */

// YOLOv8 defect class labels (COCO-based or custom)
export const YOLO_CLASSES = [
  "Crack",
  "Corrosion",
  "Dent",
  "Scratch",
  "Rivet Defect",
  "Surface Discoloration",
  "Delamination",
];

export const YOLO_INPUT_SIZE = 640;

export interface YoloDetection {
  classId: number;
  className: string;
  confidence: number;
  x: number; // normalized 0..1 (center)
  y: number; // normalized 0..1 (center)
  width: number; // normalized 0..1
  height: number; // normalized 0..1
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in pixels at 640x640
}

export interface YoloResult {
  detections: YoloDetection[];
  processingTimeMs: number;
  modelVersion: string;
}

let session: ort.InferenceSession | null = null;
let modelPath: string | null = null;
let modelLoadAttempted = false;
let modelLoadError: string | null = null;

/**
 * Returns the path to the YOLO model file.
 */
export function getModelPath(): string {
  const envPath = process.env.YOLO_MODEL_PATH;
  if (envPath && fs.existsSync(envPath)) return envPath;
  const defaultPath = path.join(process.cwd(), "models", "aircraft_defect.onnx");
  return defaultPath;
}

/**
 * Check if the YOLO model file exists on disk.
 */
export function yoloModelExists(): boolean {
  const mp = getModelPath();
  return fs.existsSync(mp);
}

/**
 * Get the model path that would be used, for error messages.
 */
export function getExpectedModelPath(): string {
  return getModelPath();
}

/**
 * Load the YOLOv8 ONNX model. Must be called before inference.
 * Returns true if loaded successfully, false otherwise.
 */
export async function loadYoloModel(): Promise<boolean> {
  if (session) return true;
  if (modelLoadAttempted) return false;

  modelLoadAttempted = true;
  modelPath = getModelPath();

  if (!fs.existsSync(modelPath)) {
    modelLoadError = `YOLO model not found at: ${modelPath}`;
    console.warn(modelLoadError);
    return false;
  }

  try {
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ["cpu"],
      graphOptimizationLevel: "all",
    });
    console.log(`YOLOv8 model loaded successfully from ${modelPath}`);
    return true;
  } catch (e) {
    modelLoadError = `Failed to load YOLO model: ${e instanceof Error ? e.message : String(e)}`;
    console.error(modelLoadError);
    session = null;
    return false;
  }
}

/**
 * Get the model load error message, if any.
 */
export function getModelLoadError(): string | null {
  return modelLoadError;
}

/**
 * Check if the YOLO model is loaded and ready.
 */
export function isYoloAvailable(): boolean {
  return session !== null;
}

/**
 * Preprocess an image buffer for YOLOv8 inference.
 * Resizes to 640x640, converts to RGB, normalizes to [0,1], and creates NCHW tensor.
 */
async function preprocess(
  imageBuffer: Buffer
): Promise<{ tensor: ort.Tensor; originalWidth: number; originalHeight: number }> {
  const meta = await sharp(imageBuffer).metadata();
  const originalWidth = meta.width ?? 640;
  const originalHeight = meta.height ?? 640;

  // Resize to model input size with letterbox padding (maintain aspect ratio)
  const resized = await sharp(imageBuffer)
    .resize(YOLO_INPUT_SIZE, YOLO_INPUT_SIZE, {
      fit: "contain",
      background: { r: 114, g: 114, b: 114 },
    })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data } = resized;

  // Build NCHW tensor: [1, 3, 640, 640], float32, normalized to [0, 1]
  const input = new Float32Array(1 * 3 * YOLO_INPUT_SIZE * YOLO_INPUT_SIZE);
  const pixels = YOLO_INPUT_SIZE * YOLO_INPUT_SIZE;

  for (let i = 0; i < pixels; i++) {
    input[i] = data[i * 3] / 255.0;           // R channel
    input[i + pixels] = data[i * 3 + 1] / 255.0; // G channel
    input[i + 2 * pixels] = data[i * 3 + 2] / 255.0; // B channel
  }

  const tensor = new ort.Tensor("float32", input, [1, 3, YOLO_INPUT_SIZE, YOLO_INPUT_SIZE]);
  return { tensor, originalWidth, originalHeight };
}

/**
 * Sigmoid activation function.
 */
function sigmoid(x: number): number {
  return 1.0 / (1.0 + Math.exp(-x));
}

/**
 * Decode YOLOv8 output tensor to bounding boxes.
 *
 * Supports multiple output formats:
 * - [1, 84, 8400] - standard YOLOv8 (3-scale detection)
 * - [1, 84, 400]  - single-scale (20x20 grid)
 * - [1, 84, N]    - any N detections
 *
 * Where 84 = 4 (bbox coords) + 80 (class probabilities)
 * For custom models with fewer classes, the remaining channels are zeros.
 */
function decodeOutput(
  output: ort.Tensor,
  confidenceThreshold: number
): YoloDetection[] {
  const data = output.data as Float32Array;
  const dims = output.dims;
  const numClasses = dims[1] - 4; // total channels minus 4 bbox coordinates
  const numDetections = dims[2]; // number of grid cells

  const detections: YoloDetection[] = [];

  for (let i = 0; i < numDetections; i++) {
    // Bbox coordinates (cx, cy, w, h) are at indices 0-3
    const cx = data[i];
    const cy = data[numDetections + i];
    const w = data[2 * numDetections + i];
    const h = data[3 * numDetections + i];

    // Skip invalid boxes
    if (w <= 0 || h <= 0) continue;

    // Find the class with highest probability
    let bestClass = 0;
    let bestScore = -Infinity;

    for (let c = 0; c < numClasses; c++) {
      const score = data[(4 + c) * numDetections + i];
      if (score > bestScore) {
        bestScore = score;
        bestClass = c;
      }
    }

    // Apply confidence threshold
    if (bestScore < confidenceThreshold) continue;

    // Map class ID to our defect classes
    const classId = bestClass < YOLO_CLASSES.length ? bestClass : bestClass % YOLO_CLASSES.length;

    // Convert from center format to corner format (in 640x640 space)
    const x1 = Math.max(0, cx - w / 2);
    const y1 = Math.max(0, cy - h / 2);
    const x2 = Math.min(YOLO_INPUT_SIZE, cx + w / 2);
    const y2 = Math.min(YOLO_INPUT_SIZE, cy + h / 2);

    // Normalize to 0..1
    const nx = x1 / YOLO_INPUT_SIZE;
    const ny = y1 / YOLO_INPUT_SIZE;
    const nw = (x2 - x1) / YOLO_INPUT_SIZE;
    const nh = (y2 - y1) / YOLO_INPUT_SIZE;

    detections.push({
      classId,
      className: YOLO_CLASSES[classId] ?? "Unknown",
      confidence: bestScore,
      x: nx,
      y: ny,
      width: nw,
      height: nh,
      bbox: [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)],
    });
  }

  return detections;
}

/**
 * Compute Intersection over Union between two bounding boxes.
 */
function computeIoU(a: YoloDetection, b: YoloDetection): number {
  const ax1 = a.bbox[0];
  const ay1 = a.bbox[1];
  const ax2 = a.bbox[2];
  const ay2 = a.bbox[3];
  const bx1 = b.bbox[0];
  const by1 = b.bbox[1];
  const bx2 = b.bbox[2];
  const by2 = b.bbox[3];

  const ix1 = Math.max(ax1, bx1);
  const iy1 = Math.max(ay1, by1);
  const ix2 = Math.min(ax2, bx2);
  const iy2 = Math.min(ay2, by2);

  const inter = Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
  const areaA = (ax2 - ax1) * (ay2 - ay1);
  const areaB = (bx2 - bx1) * (by2 - by1);
  const union = areaA + areaB - inter;

  return union > 0 ? inter / union : 0;
}

/**
 * Apply Non-Maximum Suppression to remove duplicate detections.
 */
function nonMaxSuppression(
  detections: YoloDetection[],
  iouThreshold: number,
  maxDetections: number
): YoloDetection[] {
  // Sort by confidence descending
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: YoloDetection[] = [];

  for (const det of sorted) {
    let overlaps = false;
    for (const k of kept) {
      if (computeIoU(det, k) > iouThreshold) {
        overlaps = true;
        break;
      }
    }
    if (!overlaps) {
      kept.push(det);
      if (kept.length >= maxDetections) break;
    }
  }

  return kept;
}

/**
 * Run YOLOv8 inference on an image buffer.
 *
 * @param imageBuffer - Raw image buffer (JPEG, PNG, etc.)
 * @param confidenceThreshold - Minimum confidence score (default 0.70)
 * @param iouThreshold - NMS IoU threshold (default 0.50)
 * @returns YOLO detection results
 */
export async function runYoloInference(
  imageBuffer: Buffer,
  confidenceThreshold = 0.70,
  iouThreshold = 0.50
): Promise<YoloResult> {
  const t0 = performance.now();

  if (!session) {
    const loaded = await loadYoloModel();
    if (!loaded) {
      throw new Error(
        modelLoadError ??
          `YOLO model not found. Please place the trained aircraft_defect.onnx model in the /models directory.`
      );
    }
  }

  // Preprocess
  const { tensor, originalWidth, originalHeight } = await preprocess(imageBuffer);

  // Run inference
  const feeds: Record<string, ort.Tensor> = {};
  // Try common input names
  const inputName = session!.inputNames[0] ?? "images";
  feeds[inputName] = tensor;

  const results = await session!.run(feeds);
  const outputName = session!.outputNames[0];
  const output = results[outputName];

  // Decode output
  const rawDetections = decodeOutput(output, confidenceThreshold);

  // Apply NMS
  const nmsDetections = nonMaxSuppression(rawDetections, iouThreshold, 100);

  // Scale bboxes back to original image dimensions
  const scaleX = originalWidth / YOLO_INPUT_SIZE;
  const scaleY = originalHeight / YOLO_INPUT_SIZE;

  const scaledDetections = nmsDetections.map((d) => ({
    ...d,
    bbox: [
      Math.round(d.bbox[0] * scaleX),
      Math.round(d.bbox[1] * scaleY),
      Math.round(d.bbox[2] * scaleX),
      Math.round(d.bbox[3] * scaleY),
    ] as [number, number, number, number],
  }));

  const t1 = performance.now();

  return {
    detections: scaledDetections,
    processingTimeMs: Math.round((t1 - t0) * 100) / 100,
    modelVersion: "yolov8-onnx-v1.0",
  };
}

/**
 * Map a YOLO detection to the structured defect format used by the application.
 */
export function mapYoloDetectionToDefect(detection: YoloDetection) {
  const severity =
    detection.confidence >= 0.85
      ? ("CRITICAL" as const)
      : detection.confidence >= 0.70
        ? ("WARNING" as const)
        : ("INFO" as const);

  return {
    type: detection.className,
    confidence: Math.round(detection.confidence * 1000) / 1000,
    x: detection.x,
    y: detection.y,
    width: detection.width,
    height: detection.height,
    areaPx: Math.round(
      (detection.bbox[2] - detection.bbox[0]) *
        (detection.bbox[3] - detection.bbox[1])
    ),
    severity,
    meta: {
      source: "yolov8",
      modelInputSize: YOLO_INPUT_SIZE,
      bbox: detection.bbox,
    },
  };
}

/**
 * Render annotated image with bounding boxes using sharp SVG overlay.
 */
export async function renderYoloAnnotated(
  imageBuffer: Buffer,
  detections: YoloDetection[]
): Promise<Buffer> {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width ?? 640;
  const h = meta.height ?? 640;

  const parts: string[] = [];

  const COLOR_BY_CLASS: Record<string, string> = {
    Crack: "#FF3B5C",
    Corrosion: "#FF8A3D",
    Dent: "#FFD23D",
    Scratch: "#00E5FF",
    "Rivet Defect": "#A78BFA",
    "Surface Discoloration": "#00AEEF",
    Delamination: "#FF6BCB",
  };

  for (const d of detections) {
    const [x1, y1, x2, y2] = d.bbox;
    const color = COLOR_BY_CLASS[d.className] ?? "#00E5FF";

    // Bounding box rectangle
    parts.push(
      `<rect x="${x1}" y="${y1}" width="${x2 - x1}" height="${y2 - y1}" fill="none" stroke="${color}" stroke-width="3" opacity="0.95"/>`
    );

    // Label background
    const label = `${d.className} ${(d.confidence * 100).toFixed(0)}%`;
    const labelW = label.length * 7 + 12;
    const ly = Math.max(0, y1 - 22);

    parts.push(
      `<rect x="${x1}" y="${ly}" width="${labelW}" height="20" fill="${color}" opacity="0.9" rx="2"/>`
    );

    // Label text
    parts.push(
      `<text x="${x1 + 6}" y="${ly + 14}" font-family="monospace" font-size="12" font-weight="bold" fill="#07111F">${label}</text>`
    );
  }

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  const svgBuffer = Buffer.from(svg);

  return sharp(imageBuffer)
    .resize({ width: w, height: h, fit: "inside" })
    .composite([{ input: svgBuffer, blend: "over" }])
    .jpeg({ quality: 90 })
    .toBuffer();
}