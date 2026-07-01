import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const inspectionStatus = pgEnum("inspection_status", [
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const severityLevel = pgEnum("severity_level", [
  "CRITICAL",
  "WARNING",
  "INFO",
  "CLEAN",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("INSPECTOR"),
  organization: text("organization").default("EdgeInspect Aerospace"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const inspections = pgTable("inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  component: text("component").notNull(),
  aircraftType: text("aircraft_type").notNull(),
  imageWidth: integer("image_width").notNull(),
  imageHeight: integer("image_height").notNull(),
  status: inspectionStatus("status").notNull().default("COMPLETED"),
  processingTimeMs: real("processing_time_ms").notNull(),
  modelVersion: text("model_version").notNull(),
  defectCount: integer("defect_count").notNull().default(0),
  maxSeverity: severityLevel("max_severity").notNull().default("CLEAN"),
  confidenceAvg: real("confidence_avg").notNull().default(0),
  summary: text("summary"),
  thumbnailPath: text("thumbnail_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const defects = pgTable("defects", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id")
    .notNull()
    .references(() => inspections.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  confidence: real("confidence").notNull(),
  // Normalized 0..1 coordinates relative to source image
  x: real("x").notNull(),
  y: real("y").notNull(),
  width: real("width").notNull(),
  height: real("height").notNull(),
  areaPx: integer("area_px").notNull(),
  severity: severityLevel("severity").notNull().default("INFO"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const maintenanceTasks = pgTable("maintenance_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  inspectionId: uuid("inspection_id").references(() => inspections.id, {
    onDelete: "cascade",
  }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  component: text("component").notNull(),
  aircraftType: text("aircraft_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  priority: severityLevel("priority").notNull().default("WARNING"),
  status: text("status").notNull().default("OPEN"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Inspection = typeof inspections.$inferSelect;
export type NewInspection = typeof inspections.$inferInsert;
export type Defect = typeof defects.$inferSelect;
export type NewDefect = typeof defects.$inferInsert;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type NewMaintenanceTask = typeof maintenanceTasks.$inferInsert;
