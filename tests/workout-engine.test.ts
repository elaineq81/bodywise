import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDurationPrescription,
  computeLocalProgressMetrics,
  creditSessionWork,
  deriveNextAdjustment,
  isMeaningfulSession,
  isReplacementLocked,
  resolveMoveKey,
  type MoveLoadMap,
  type SafeReplacementMap,
} from "../app/workout-engine";

const loads: MoveLoadMap = {
  squat: { loads: { Knees: 3 }, quiet: true, smallSpace: true },
  bridge: { loads: { Knees: 0, Back: 1 }, quiet: true, smallSpace: true },
  jump: { loads: { Knees: 2 }, quiet: false, smallSpace: false },
};
const replacements: SafeReplacementMap = { squat: ["bridge"], jump: ["bridge"] };

test("hard avoid areas resolve to a zero-load movement", () => {
  const result = resolveMoveKey("squat", {
    loadByKey: loads,
    replacementsByKey: replacements,
    avoidAreas: ["Knees"],
  });
  assert.equal(result.safe, true);
  assert.equal(result.adjusted, true);
  assert.equal(result.key, "bridge");
});

test("an unresolved hard constraint is explicit and cannot be called safe", () => {
  const result = resolveMoveKey("squat", {
    loadByKey: loads,
    avoidAreas: ["Knees"],
  });
  assert.equal(result.safe, false);
  assert.equal(result.key, "squat");
});

test("recovery prescriptions cap rounds while remaining close to the selected duration", () => {
  const plan = buildDurationPrescription([20, 20, 20, 20, 20, 20], 20, {
    minimumRestSeconds: 15,
    maximumRestSeconds: 60,
    maximumRounds: 3,
    toleranceSeconds: 75,
  });
  assert.ok(plan.rounds <= 3);
  assert.equal(plan.withinTolerance, true);
  assert.ok(Math.abs(plan.estimatedSeconds - 1_200) <= 75);
});

test("skipped time never receives the full planned duration or load", () => {
  const credit = creditSessionWork(1_200, 600, 90);
  assert.equal(credit.durationMinutes, 1.5);
  assert.equal(credit.volume, 45);
  assert.equal(credit.completionRatio, 0.075);
});

test("a skipped workout cannot unlock the first-win subscription conversion", () => {
  assert.equal(isMeaningfulSession({ activeSeconds: 0, plannedMinutes: 20 }), false);
  assert.equal(isMeaningfulSession({ activeSeconds: 299, plannedMinutes: 20 }), false);
  assert.equal(isMeaningfulSession({ activeSeconds: 300, plannedMinutes: 20 }), true);
});

test("zero-work records do not inflate progress", () => {
  const metrics = computeLocalProgressMetrics(
    [{ at: "2026-08-06T08:00:00Z", durationMinutes: 0, volume: 0 }],
    { now: "2026-08-06T09:00:00Z", utcOffsetMinutes: 0 },
  );
  assert.equal(metrics.sessionCount, 0);
  assert.equal(metrics.sessionsThisWeek, 0);
});

test("one feedback response deterministically sets the next pace and rotation", () => {
  assert.deepEqual(deriveNextAdjustment("Pain", 2, 3), {
    readiness: "Recover",
    rotation: 2,
  });
  assert.deepEqual(deriveNextAdjustment("Too easy", 2, 3), {
    readiness: "Push",
    rotation: 0,
  });
});

test("gentler safety regressions remain free while extra challenge can be Premium", () => {
  assert.equal(isReplacementLocked(false, "gentler", 5), false);
  assert.equal(isReplacementLocked(false, "stronger", 2), true);
  assert.equal(isReplacementLocked(true, "stronger", 5), false);
});

test("progress counts this week separately from consecutive-day streaks", () => {
  const metrics = computeLocalProgressMetrics(
    [
      { at: "2026-08-03T10:00:00Z", durationMinutes: 10, volume: 100 },
      { at: "2026-08-05T10:00:00Z", durationMinutes: 12.5, volume: 120 },
      { at: "2026-07-31T10:00:00Z", durationMinutes: 8, volume: 80 },
    ],
    { now: "2026-08-06T12:00:00Z", utcOffsetMinutes: 0 },
  );
  assert.equal(metrics.sessionsThisWeek, 2);
  assert.equal(metrics.sessionCount, 3);
  assert.equal(metrics.totalMinutes, 30.5);
  assert.equal(metrics.loadBars.find((bar) => bar.date === "2026-08-04")?.volume, 0);
});
