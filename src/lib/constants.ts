export const MODEL_VERSION = "ei-edge-cnn-v2.4.1";
export const INFERENCE_TARGET_MAX_DIM = 768;

export const DEFECT_TYPES = [
  "Crack",
  "Corrosion",
  "Dent",
  "Scratch",
  "Rivet Defect",
  "Surface Discoloration",
  "Delamination",
] as const;

export type DefectType = (typeof DEFECT_TYPES)[number];

export const DEFECT_COLORS: Record<string, string> = {
  Crack: "#FF3B5C",
  Corrosion: "#FF8A3D",
  Dent: "#FFD23D",
  Scratch: "#00E5FF",
  "Rivet Defect": "#A78BFA",
  "Surface Discoloration": "#00AEEF",
  Delamination: "#FF6BCB",
};

export const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "#FF3B5C",
  WARNING: "#FF8A3D",
  INFO: "#00AEEF",
  CLEAN: "#22E58A",
};

export const DEFECT_DESCRIPTIONS: Record<string, string> = {
  Crack:
    "Linear fracture detected along the surface. Recommend non-destructive testing and structural review.",
  Corrosion:
    "Oxidation or pitting identified. Schedule surface treatment and protective coating renewal.",
  Dent:
    "Localized deformation observed. Verify tolerances against structural limits.",
  Scratch:
    "Surface abrasion found. Assess depth to determine if rework is required.",
  "Rivet Defect":
    "Irregularity detected around a fastener. Inspect rivet integrity and torque.",
  "Surface Discoloration":
    "Anomalous color variance detected. Verify for heat damage or fluid residue.",
  Delamination:
    "Potential layer separation identified. Recommend ultrasonic inspection.",
};

export function severityFromConfidence(confidence: number): {
  CRITICAL: boolean;
  WARNING: boolean;
  INFO: boolean;
} {
  return {
    CRITICAL: confidence >= 0.8,
    WARNING: confidence >= 0.55 && confidence < 0.8,
    INFO: confidence < 0.55,
  };
}

export const AIRCRAFT_TYPES = [
  "Boeing 737 MAX",
  "Boeing 787 Dreamliner",
  "Airbus A320neo",
  "Airbus A350",
  "Embraer E-Jet",
  "Bombardier Q400",
  "General Aviation",
];

export const COMPONENTS = [
  "Fuselage",
  "Wing - Upper",
  "Wing - Lower",
  "Tail / Empennage",
  "Engine Cowling",
  "Landing Gear",
  "Fuselage Panel",
  "Control Surface",
  "Riveted Section",
];
