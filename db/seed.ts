import { db } from "./index";
import { movements, movementPhases, workoutPlans, workoutPlanMovements } from "./schema";

/**
 * Seed script to populate the Bodywise database with movements and workout plans.
 * Run with: npm run db:seed
 */

export async function seedMovements() {
  console.log("🌱 Seeding movements...");

  // Define all movements with their phases
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/push-ups/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Mid-position",
          imageUrl: "/illustrations/movements/push-ups/mid-position.svg",
          order: 2,
        },
        {
          phaseName: "End position",
          imageUrl: "/illustrations/movements/push-ups/end-position.svg",
          order: 3,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/squats/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Mid-position",
          imageUrl: "/illustrations/movements/squats/mid-position.svg",
          order: 2,
        },
        {
          phaseName: "End position",
          imageUrl: "/illustrations/movements/squats/end-position.svg",
          order: 3,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/planks/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Hold position",
          imageUrl: "/illustrations/movements/planks/mid-position.svg",
          order: 2,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/glute-bridges/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Mid-position",
          imageUrl: "/illustrations/movements/glute-bridges/mid-position.svg",
          order: 2,
        },
        {
          phaseName: "Top position",
          imageUrl: "/illustrations/movements/glute-bridges/end-position.svg",
          order: 3,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/calf-raises/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Mid-position",
          imageUrl: "/illustrations/movements/calf-raises/mid-position.svg",
          order: 2,
        },
        {
          phaseName: "Top position",
          imageUrl: "/illustrations/movements/calf-raises/end-position.svg",
          order: 3,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/dead-bugs/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Extended position",
          imageUrl: "/illustrations/movements/dead-bugs/mid-position.svg",
          order: 2,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/bird-dogs/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Extended position",
          imageUrl: "/illustrations/movements/bird-dogs/mid-position.svg",
          order: 2,
        },
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
        {
          phaseName: "Starting position",
          imageUrl: "/illustrations/movements/side-planks/starting-position.svg",
          order: 1,
        },
        {
          phaseName: "Hold position",
          imageUrl: "/illustrations/movements/side-planks/mid-position.svg",
          order: 2,
        },
      ],
    },
  ];

  // Insert movements and their phases
  for (const movement of movementsData) {
    const { phases, ...movementData } = movement;

    // Insert movement
    await db.insert(movements).values(movementData).onConflictDoNothing();

    // Insert phases
    for (const phase of phases) {
      await db
        .insert(movementPhases)
        .values({
          movementId: movementData.id,
          ...phase,
        })
        .onConflictDoNothing();
    }

    console.log(`✓ Added movement: ${movementData.name}`);
  }

  console.log("✅ Movements seeded!");
}

export async function seedWorkoutPlans() {
  console.log("🌱 Seeding workout plans...");

  // Define workout plans
  const plansData = [
    {
      id: "full-body",
      goal: "Full body",
      title: "Full-body foundation",
      description: "Balanced strength from head to toe.",
      icon: "◎",
      movements: ["push", "squat", "plank", "bridge", "deadbug", "birdDog", "calfRaise"],
    },
    {
      id: "enhanced-core",
      goal: "Enhanced core",
      title: "Core control",
      description: "Build a stronger, steadier centre.",
      icon: "◉",
      movements: ["plank", "deadbug", "sidePlank", "birdDog", "bridge"],
    },
    {
      id: "knee-strength",
      goal: "Knee strength",
      title: "Knee support",
      description: "Low-impact strength around knees and ankles.",
      icon: "◇",
      movements: ["squat", "bridge", "calfRaise"],
    },
    {
      id: "upper-body",
      goal: "Upper body",
      title: "Upper-body builder",
      description: "Chest, shoulders, back and trunk stability.",
      icon: "↑",
      movements: ["push", "plank", "birdDog", "sidePlank"],
    },
    {
      id: "lower-body",
      goal: "Lower body",
      title: "Lower-body power",
      description: "Legs, glutes, hips and balance.",
      icon: "↓",
      movements: ["squat", "bridge", "calfRaise"],
    },
    {
      id: "arm-strength",
      goal: "Arm strength",
      title: "Arm strength",
      description: "Progressive pushing and shoulder stability.",
      icon: "↗",
      movements: ["push", "plank"],
    },
  ];

  // Insert plans and plan movements
  for (const plan of plansData) {
    const { movements: planMovements, ...planData } = plan;

    // Insert plan
    await db.insert(workoutPlans).values(planData).onConflictDoNothing();

    // Insert plan movements
    for (let order = 0; order < planMovements.length; order++) {
      await db
        .insert(workoutPlanMovements)
        .values({
          planId: planData.id,
          movementId: planMovements[order],
          order: order + 1,
        })
        .onConflictDoNothing();
    }

    console.log(`✓ Added workout plan: ${planData.title}`);
  }

  console.log("✅ Workout plans seeded!");
}

export async function seed() {
  try {
    console.log("🌱 Starting database seed...\n");
    await seedMovements();
    await seedWorkoutPlans();
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
