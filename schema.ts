import { sql, relations } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  real,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/* ============================================================================
 * CONTENT (existing — kept verbatim so prior migrations stay valid)
 * The workout catalog: movements, their illustrations/videos, and the plans
 * that sequence them. This data is global/shared, not per-user.
 * ==========================================================================*/

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
  phaseName: text("phase_name").notNull(), // "Starting position", "Mid-rep", "End position"
  imageUrl: text("image_url").notNull(),
  order: integer("order").notNull(),
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
  goal: text("goal").notNull(), // "Full body", "Enhanced core"
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
  // --- Optional additive columns (safe to adopt later) --------------------
  // Let a plan override a movement's defaults and express circuit structure
  // without changing the shared movement definition.
  durationSeconds: integer("duration_seconds"), // overrides movements.baseSeconds
  restSeconds: integer("rest_seconds"), // rest after this movement
  rounds: integer("rounds").notNull().default(1), // repeat this movement N times
});

/* ============================================================================
 * IDENTITY
 * One row per authenticated user. Identity arrives via the ChatGPT SIWC
 * header (oai-authenticated-user-email); persist it here so records can be
 * owned. Only slow-changing profile facts live here — anything measured over
 * time belongs in body_metrics / body_measurements.
 * ==========================================================================*/

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(), // app-generated (uuid/cuid)
    email: text("email").notNull(), // from oai-authenticated-user-email
    fullName: text("full_name"), // from SIWC, optional
    sex: text("sex"), // "female" | "male" | "other" | null
    dateOfBirth: text("date_of_birth"), // ISO date; drives age-based calcs
    heightCm: real("height_cm"),
    units: text("units").notNull().default("metric"), // "metric" | "imperial"
    timezone: text("timezone"), // for streak / day-boundary logic
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

/* ============================================================================
 * ACTIVITY
 * workout_sessions  = one logged attempt at a plan (or an ad-hoc session).
 * session_movements = actual performance for each movement in that session.
 * ==========================================================================*/

export const workoutSessions = sqliteTable(
  "workout_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: text("plan_id").references(() => workoutPlans.id, {
      onDelete: "set null",
    }), // nullable: keeps history if a plan is deleted, allows ad-hoc sessions
    startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    completedAt: text("completed_at"), // null while in progress
    totalSeconds: integer("total_seconds"), // actual active time
    status: text("status").notNull().default("in_progress"), // "in_progress" | "completed" | "abandoned"
    perceivedEffort: integer("perceived_effort"), // RPE 1–10, optional
    notes: text("notes"),
  },
  (t) => ({
    userStartedIdx: index("sessions_user_started_idx").on(
      t.userId,
      t.startedAt,
    ),
  }),
);

export const sessionMovements = sqliteTable("session_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id")
    .references(() => workoutSessions.id, { onDelete: "cascade" })
    .notNull(),
  movementId: text("movement_id")
    .references(() => movements.id)
    .notNull(),
  order: integer("order").notNull(),
  actualSeconds: integer("actual_seconds"), // primary metric (time-based app)
  reps: integer("reps"), // optional, for rep-based movements
  weightKg: real("weight_kg"), // optional, for loaded movements
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
});

/* ============================================================================
 * BODY TRACKING  ("bodywise")
 * body_metrics       = scalar time series (weight, body-fat %, resting HR).
 * body_measurements  = normalised circumferences, one row per site per date.
 * Drop both tables if body tracking is out of scope.
 * ==========================================================================*/

export const bodyMetrics = sqliteTable(
  "body_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    weightKg: real("weight_kg"),
    bodyFatPct: real("body_fat_pct"),
    restingHeartRate: integer("resting_heart_rate"),
    note: text("note"),
  },
  (t) => ({
    userDateIdx: index("body_metrics_user_date_idx").on(t.userId, t.recordedAt),
  }),
);

export const bodyMeasurements = sqliteTable(
  "body_measurements",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    recordedAt: text("recorded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    site: text("site").notNull(), // "waist" | "chest" | "hips" | "arm_l" | "thigh_r" ...
    valueCm: real("value_cm").notNull(),
  },
  (t) => ({
    userSiteDateIdx: index("body_measurements_user_site_date_idx").on(
      t.userId,
      t.site,
      t.recordedAt,
    ),
  }),
);

/* ============================================================================
 * PERSONALIZATION
 * Favorites, scheduling, and goals. Streaks are intentionally NOT stored —
 * they are derived from workout_sessions to avoid drift.
 * ==========================================================================*/

export const planFavorites = sqliteTable(
  "plan_favorites",
  {
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: text("plan_id")
      .references(() => workoutPlans.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.planId] }),
  }),
);

export const scheduledWorkouts = sqliteTable(
  "scheduled_workouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    planId: text("plan_id")
      .references(() => workoutPlans.id, { onDelete: "cascade" })
      .notNull(),
    scheduledFor: text("scheduled_for").notNull(), // ISO date (the day)
    completedSessionId: text("completed_session_id").references(
      () => workoutSessions.id,
      { onDelete: "set null" },
    ),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    userDayIdx: index("scheduled_user_day_idx").on(t.userId, t.scheduledFor),
  }),
);

export const goals = sqliteTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // "weight" | "body_fat" | "sessions_per_week" | "streak"
  targetValue: real("target_value").notNull(),
  startValue: real("start_value"), // snapshot when goal was created
  targetDate: text("target_date"), // ISO date, optional
  status: text("status").notNull().default("active"), // "active" | "achieved" | "abandoned"
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

/* ============================================================================
 * RELATIONS
 * Optional but enables the ergonomic query API:
 *   db.query.users.findFirst({ with: { sessions: true, bodyMetrics: true } })
 * ==========================================================================*/

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(workoutSessions),
  bodyMetrics: many(bodyMetrics),
  bodyMeasurements: many(bodyMeasurements),
  favorites: many(planFavorites),
  scheduled: many(scheduledWorkouts),
  goals: many(goals),
}));

export const workoutPlansRelations = relations(workoutPlans, ({ many }) => ({
  planMovements: many(workoutPlanMovements),
  sessions: many(workoutSessions),
  favorites: many(planFavorites),
}));

export const movementsRelations = relations(movements, ({ many }) => ({
  phases: many(movementPhases),
  videos: many(movementVideos),
  planMovements: many(workoutPlanMovements),
}));

export const workoutPlanMovementsRelations = relations(
  workoutPlanMovements,
  ({ one }) => ({
    plan: one(workoutPlans, {
      fields: [workoutPlanMovements.planId],
      references: [workoutPlans.id],
    }),
    movement: one(movements, {
      fields: [workoutPlanMovements.movementId],
      references: [movements.id],
    }),
  }),
);

export const workoutSessionsRelations = relations(
  workoutSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [workoutSessions.userId],
      references: [users.id],
    }),
    plan: one(workoutPlans, {
      fields: [workoutSessions.planId],
      references: [workoutPlans.id],
    }),
    movements: many(sessionMovements),
  }),
);

export const sessionMovementsRelations = relations(
  sessionMovements,
  ({ one }) => ({
    session: one(workoutSessions, {
      fields: [sessionMovements.sessionId],
      references: [workoutSessions.id],
    }),
    movement: one(movements, {
      fields: [sessionMovements.movementId],
      references: [movements.id],
    }),
  }),
);
