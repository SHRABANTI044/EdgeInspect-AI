/**
 * Aircraft Defect Detection Model Trainer
 *
 * Prerequisites:
 *   1. pip install ultralytics
 *   2. Prepare dataset in Roboflow or LabelImg
 *   3. Update DATASET_PATH below
 *
 * This script will:
 * 1. Train a YOLOv8n model on your defect dataset
 * 2. Export to ONNX format
 * 3. Replace the model in /models/aircraft_defect.onnx
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const DATASET_YAML = "aircraft_defects.yaml";
const MODEL_OUTPUT = path.join("models", "aircraft_defect.onnx");

function run(cmd, desc) {
  console.log(`\n${desc}...`);
  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`${desc} - Done`);
  } catch (e) {
    console.error(`${desc} - Failed:`, e);
    process.exit(1);
  }
}

function main() {
  // Check prerequisites
  if (!fs.existsSync(DATASET_YAML)) {
    console.error(`ERROR: ${DATASET_YAML} not found. Create it first.`);
    process.exit(1);
  }

  console.log("Starting aircraft defect detection model training...");

  // Train model
  run(
    `python -c "from ultralytics import YOLO; model = YOLO('yolov8n.pt'); model.train(data='${DATASET_YAML}', epochs=100, imgsz=640, batch=8, workers=2, name='aircraft_defect')"`,
    "Training YOLOv8 model"
  );

  // Export to ONNX
  run(
    `python -c "from ultralytics import YOLO; model = YOLO('runs/detect/aircraft_defect/weights/best.pt'); model.export(format='onnx', imgsz=640)"`,
    "Exporting to ONNX"
  );

  // Copy to models directory
  const exported = fs.existsSync("yolov8n.onnx")
    ? "yolov8n.onnx"
    : "runs/detect/aircraft_defect/weights/best.onnx";

  if (!fs.existsSync(exported)) {
    console.error("ERROR: Exported ONNX model not found");
    process.exit(1);
  }

  fs.mkdirSync("models", { recursive: true });
  fs.copyFileSync(exported, MODEL_OUTPUT);
  console.log(`\nModel saved to ${MODEL_OUTPUT}`);
  console.log("Restart the dev server to use the new model.");
}

main();