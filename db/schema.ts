import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const movements = sqliteTable("movements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  focus: text("focus").notNull(), // e.g., "Chest · arms"
  description: text("description").notNull(),
  cue: text("cue").notNull(), // coaching cue
  baseSeconds: integer("base_seconds").notNull(), // base duration in seconds
  difficulty: text("difficulty").notNull(), // "Beginner", "Intermediate", "Advanced"
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const movementPhases = sqliteTable("movement_phases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movementId: text("movement_id")
    .references(() => movements.id)
    .notNull(),
  phaseName: text("phase_name").notNull(), // e.g., "Starting position", "Mid-rep", "End position"
  imageUrl: text("image_url").notNull(), // path or URL to illustration
  order: integer("order").notNull(), // sequence order
});

export const movementVideos = sqliteTable("movement_videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  movementId: text("movement_id")
    .references(() => movements.id)
    .notNull(),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration"), // in seconds
  credit: text("credit"), // attribution if from open-access source
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: text("id").primaryKey(),
  goal: text("goal").notNull(), // e.g., "Full body", "Enhanced core"
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const workoutPlanMovements = sqliteTable("workout_plan_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  planId: text("plan_id")
    .references(() => workoutPlans.id)
    .notNull(),
  movementId: text("movement_id")
    .references(() => movements.id)
    .notNull(),
  order: integer("order").notNull(),
});
