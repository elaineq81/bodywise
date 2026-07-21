-- Migration: Create movements table
CREATE TABLE movements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  focus TEXT NOT NULL,
  description TEXT NOT NULL,
  cue TEXT NOT NULL,
  base_seconds INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Create movement_phases table
CREATE TABLE movement_phases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movement_id TEXT NOT NULL REFERENCES movements(id),
  phase_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Migration: Create movement_videos table
CREATE TABLE movement_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  movement_id TEXT NOT NULL REFERENCES movements(id),
  video_url TEXT NOT NULL,
  duration INTEGER,
  credit TEXT
);

-- Migration: Create workout_plans table
CREATE TABLE workout_plans (
  id TEXT PRIMARY KEY,
  goal TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Migration: Create workout_plan_movements table
CREATE TABLE workout_plan_movements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_id TEXT NOT NULL REFERENCES workout_plans(id),
  movement_id TEXT NOT NULL REFERENCES movements(id),
  "order" INTEGER NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_movement_phases_movement_id ON movement_phases(movement_id);
CREATE INDEX idx_movement_videos_movement_id ON movement_videos(movement_id);
CREATE INDEX idx_workout_plan_movements_plan_id ON workout_plan_movements(plan_id);
CREATE INDEX idx_workout_plan_movements_movement_id ON workout_plan_movements(movement_id);
