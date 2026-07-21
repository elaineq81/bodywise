import { db } from "./index";
import {
  movements,
  movementPhases,
  workoutPlans,
  workoutPlanMovements,
  users,
  workoutSessions,
  sessionMovements,
  bodyMetrics,
  bodyMeasurements,
  planFavorites,
  scheduledWorkouts,
  goals,
} from "./schema";

/**
 * Seed script for the Bodywise database.
 *
 * Catalog data (movements + plans) is always seeded and is safe for production.
 * Demo user data (sessions, body metrics, goals, …) is seeded ONLY when the
 * SEED_DEMO environment variable is set, so it never pollutes a live database:
 *
 *   npm run db:seed              # catalog only
 *   SEED_DEMO=1 npm run db:seed  # catalog + demo user for local development
 *
 * NOTE ON RUNTIME: db/index.ts reads the Cloudflare D1 binding via
 * `cloudflare:workers`, which is not available under plain `node`. Run this
 * inside a Workers-aware context (e.g. via wrangler / a one-off seed route),
 * or switch to the SQL-file approach — see the message accompanying this file.
 */

/* ------------------------------------------------------------------ */
/* Catalog: movements + phases (unchanged, production-safe)            */
/* ------------------------------------------------------------------ */

export async function seedMovements() {
  console.log("🌱 Seeding movements...");

  const movementsData = [
    {
      id: "push",
      name: "Incline push-up",
      focus: "Chest · arms",
      description:
        "Hands just wider than shoulders. Lower with control, the chest approaches the surface. Keep your elbows at about 45 degrees from your body.",
      cue: "Body in one long line",
      baseSeconds: 35,
      difficulty: "Beginner" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/push-ups/starting-position.svg", order: 1 },
        { phaseName: "Mid-position", imageUrl: "/illustrations/movements/push-ups/mid-position.svg", order: 2 },
        { phaseName: "End position", imageUrl: "/illustrations/movements/push-ups/end-position.svg", order: 3 },
      ],
    },
    {
      id: "squat",
      name: "Bodyweight squat",
      focus: "Quads · glutes",
      description:
        "Sit hips back and down. Keep your whole foot grounded and maintain an upright torso. Depth should feel controlled and sustainable.",
      cue: "Knees track over toes",
      baseSeconds: 40,
      difficulty: "Beginner" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/squats/starting-position.svg", order: 1 },
        { phaseName: "Mid-position", imageUrl: "/illustrations/movements/squats/mid-position.svg", order: 2 },
        { phaseName: "End position", imageUrl: "/illustrations/movements/squats/end-position.svg", order: 3 },
      ],
    },
    {
      id: "plank",
      name: "Forearm plank",
      focus: "Deep core · shoulders",
      description:
        "Stack elbows under shoulders and keep your neck in a neutral position. Brace your core as if someone is about to punch your stomach.",
      cue: "Brace, breathe, stay long",
      baseSeconds: 30,
      difficulty: "Beginner" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/planks/starting-position.svg", order: 1 },
        { phaseName: "Hold position", imageUrl: "/illustrations/movements/planks/mid-position.svg", order: 2 },
      ],
    },
    {
      id: "bridge",
      name: "Glute bridge",
      focus: "Glutes · hamstrings",
      description:
        "Press through heels. Pause at the top with a strong glute squeeze. Keep your core engaged to prevent lower back extension.",
      cue: "Lift from the hips",
      baseSeconds: 40,
      difficulty: "Beginner" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/glute-bridges/starting-position.svg", order: 1 },
        { phaseName: "Mid-position", imageUrl: "/illustrations/movements/glute-bridges/mid-position.svg", order: 2 },
        { phaseName: "Top position", imageUrl: "/illustrations/movements/glute-bridges/end-position.svg", order: 3 },
      ],
    },
    {
      id: "calfRaise",
      name: "Standing calf raise",
      focus: "Calves · ankle support",
      description:
        "Rise onto the balls of your feet with control. Pause briefly at the top. Keep your core stable and avoid leaning.",
      cue: "Rise smoothly, pause at top",
      baseSeconds: 35,
      difficulty: "Beginner" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/calf-raises/starting-position.svg", order: 1 },
        { phaseName: "Mid-position", imageUrl: "/illustrations/movements/calf-raises/mid-position.svg", order: 2 },
        { phaseName: "Top position", imageUrl: "/illustrations/movements/calf-raises/end-position.svg", order: 3 },
      ],
    },
    {
      id: "deadbug",
      name: "Dead bug",
      focus: "Deep core control",
      description:
        "Move opposite arm and leg. Keep your lower back heavy on the floor. Move slowly and deliberately with full control.",
      cue: "Lower back stays heavy",
      baseSeconds: 35,
      difficulty: "Intermediate" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/dead-bugs/starting-position.svg", order: 1 },
        { phaseName: "Extended position", imageUrl: "/illustrations/movements/dead-bugs/mid-position.svg", order: 2 },
      ],
    },
    {
      id: "birdDog",
      name: "Bird dog",
      focus: "Core · back control",
      description:
        "Extend opposite arm and leg without rotating. Keep your hips level and core braced. Move with intention and control.",
      cue: "Reach without twisting",
      baseSeconds: 35,
      difficulty: "Intermediate" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/bird-dogs/starting-position.svg", order: 1 },
        { phaseName: "Extended position", imageUrl: "/illustrations/movements/bird-dogs/mid-position.svg", order: 2 },
      ],
    },
    {
      id: "sidePlank",
      name: "Side plank",
      focus: "Obliques · waist",
      description:
        "Stack shoulders over elbows. Lift the underside waist. Keep your body in one straight line from head to heels.",
      cue: "Lift the underside waist",
      baseSeconds: 25,
      difficulty: "Intermediate" as const,
      phases: [
        { phaseName: "Starting position", imageUrl: "/illustrations/movements/side-planks/starting-position.svg", order: 1 },
        { phaseName: "Hold position", imageUrl: "/illustrations/movements/side-planks/mid-position.svg", order: 2 },
      ],
    },
  ];

  for (const movement of movementsData) {
    const { phases, ...movementData } = movement;
    await db.insert(movements).values(movementData).onConflictDoNothing();
    for (const phase of phases) {
      await db
        .insert(movementPhases)
        .values({ movementId: movementData.id, ...phase })
        .onConflictDoNothing();
    }
    console.log(`✓ Added movement: ${movementData.name}`);
  }

  console.log("✅ Movements seeded!");
}

/* ------------------------------------------------------------------ */
/* Catalog: workout plans (unchanged, production-safe)                 */
/* ------------------------------------------------------------------ */

export async function seedWorkoutPlans() {
  console.log("🌱 Seeding workout plans...");

  const plansData = [
    { id: "full-body", goal: "Full body", title: "Full-body foundation", description: "Balanced strength from head to toe.", icon: "◎", movements: ["push", "squat", "plank", "bridge", "deadbug", "birdDog", "calfRaise"] },
    { id: "enhanced-core", goal: "Enhanced core", title: "Core control", description: "Build a stronger, steadier centre.", icon: "◉", movements: ["plank", "deadbug", "sidePlank", "birdDog", "bridge"] },
    { id: "knee-strength", goal: "Knee strength", title: "Knee support", description: "Low-impact strength around knees and ankles.", icon: "◇", movements: ["squat", "bridge", "calfRaise"] },
    { id: "upper-body", goal: "Upper body", title: "Upper-body builder", description: "Chest, shoulders, back and trunk stability.", icon: "↑", movements: ["push", "plank", "birdDog", "sidePlank"] },
    { id: "lower-body", goal: "Lower body", title: "Lower-body power", description: "Legs, glutes, hips and balance.", icon: "↓", movements: ["squat", "bridge", "calfRaise"] },
    { id: "arm-strength", goal: "Arm strength", title: "Arm strength", description: "Progressive pushing and shoulder stability.", icon: "↗", movements: ["push", "plank"] },
  ];

  for (const plan of plansData) {
    const { movements: planMovements, ...planData } = plan;
    await db.insert(workoutPlans).values(planData).onConflictDoNothing();
    for (let order = 0; order < planMovements.length; order++) {
      await db
        .insert(workoutPlanMovements)
        .values({ planId: planData.id, movementId: planMovements[order], order: order + 1 })
        .onConflictDoNothing();
    }
    console.log(`✓ Added workout plan: ${planData.title}`);
  }

  console.log("✅ Workout plans seeded!");
}

/* ------------------------------------------------------------------ */
/* Demo data: development only (gated behind SEED_DEMO)                */
/* Uses deterministic ids so re-running does not create duplicates.    */
/* ------------------------------------------------------------------ */

const DEMO_USER_ID = "demo-user";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}
function isoDateDaysAgo(days: number): string {
  return isoDaysAgo(days).slice(0, 10); // YYYY-MM-DD
}

export async function seedDemoData() {
  console.log("🌱 Seeding demo user data (SEED_DEMO)...");

  // 1. Demo user
  await db
    .insert(users)
    .values({
      id: DEMO_USER_ID,
      email: "demo@bodywise.app",
      fullName: "Demo Athlete",
      sex: "female",
      dateOfBirth: "1990-05-14",
      heightCm: 168,
      units: "metric",
      timezone: "Asia/Singapore",
    })
    .onConflictDoNothing();

  // 2. Body metrics — 8 weekly entries, a gentle downward trend
  for (let week = 8; week >= 0; week--) {
    const step = 8 - week; // 0..8
    await db
      .insert(bodyMetrics)
      .values({
        id: 900 + step, // deterministic → idempotent
        userId: DEMO_USER_ID,
        recordedAt: isoDateDaysAgo(week * 7),
        weightKg: Number((72.0 - step * 0.3).toFixed(1)),
        bodyFatPct: Number((26.0 - step * 0.25).toFixed(1)),
        restingHeartRate: 64 - Math.round(step / 3),
      })
      .onConflictDoNothing();
  }

  // 3. A couple of circumference snapshots
  const measurements = [
    { id: 950, site: "waist", valueCm: 74.0, days: 56 },
    { id: 951, site: "waist", valueCm: 71.5, days: 0 },
    { id: 952, site: "hips", valueCm: 96.0, days: 56 },
    { id: 953, site: "hips", valueCm: 94.5, days: 0 },
  ];
  for (const m of measurements) {
    await db
      .insert(bodyMeasurements)
      .values({ id: m.id, userId: DEMO_USER_ID, site: m.site, valueCm: m.valueCm, recordedAt: isoDateDaysAgo(m.days) })
      .onConflictDoNothing();
  }

  // 4. Three completed workout sessions with per-movement records
  const demoSessions = [
    { id: "demo-sess-1", planId: "full-body", days: 10, movements: ["push", "squat", "plank", "bridge", "deadbug", "birdDog", "calfRaise"] },
    { id: "demo-sess-2", planId: "enhanced-core", days: 6, movements: ["plank", "deadbug", "sidePlank", "birdDog", "bridge"] },
    { id: "demo-sess-3", planId: "lower-body", days: 2, movements: ["squat", "bridge", "calfRaise"] },
  ];
  for (const s of demoSessions) {
    const started = isoDaysAgo(s.days);
    const total = s.movements.length * 40;
    await db
      .insert(workoutSessions)
      .values({
        id: s.id,
        userId: DEMO_USER_ID,
        planId: s.planId,
        startedAt: started,
        completedAt: started,
        totalSeconds: total,
        status: "completed",
        perceivedEffort: 6,
      })
      .onConflictDoNothing();

    for (let i = 0; i < s.movements.length; i++) {
      await db
        .insert(sessionMovements)
        .values({
          id: Number(s.id.replace(/\D/g, "")) * 100 + i, // deterministic
          sessionId: s.id,
          movementId: s.movements[i],
          order: i + 1,
          actualSeconds: 38 + (i % 3),
          completed: true,
        })
        .onConflictDoNothing();
    }
  }

  // 5. A favorite, an upcoming scheduled session, and an active goal
  await db
    .insert(planFavorites)
    .values({ userId: DEMO_USER_ID, planId: "enhanced-core" })
    .onConflictDoNothing();

  await db
    .insert(scheduledWorkouts)
    .values({
      id: "demo-sched-1",
      userId: DEMO_USER_ID,
      planId: "full-body",
      scheduledFor: isoDateDaysAgo(-1), // tomorrow
    })
    .onConflictDoNothing();

  await db
    .insert(goals)
    .values({
      id: "demo-goal-1",
      userId: DEMO_USER_ID,
      type: "weight",
      startValue: 72.0,
      targetValue: 68.0,
      targetDate: isoDateDaysAgo(-42), // ~6 weeks out
      status: "active",
    })
    .onConflictDoNothing();

  console.log("✅ Demo user data seeded!");
}

/* ------------------------------------------------------------------ */
/* Orchestrator                                                        */
/* ------------------------------------------------------------------ */

export async function seed() {
  try {
    console.log("🌱 Starting database seed...\n");
    await seedMovements();
    await seedWorkoutPlans();

    if (process.env.SEED_DEMO) {
      await seedDemoData();
    } else {
      console.log("\nℹ️  Skipping demo data. Set SEED_DEMO=1 to include it.");
    }

    console.log("\n🎉 Database seed complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed();
}
