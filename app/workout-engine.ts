/**
 * Pure, deterministic workout planning helpers.
 *
 * This module intentionally knows nothing about React, storage, or Bodywise's
 * move catalog. Callers provide movement safety metadata and replacement maps.
 */

export const BODY_AREAS = ["Knees", "Back", "Wrists", "Shoulders"] as const;

export type BodyArea = (typeof BODY_AREAS)[number];
export type LoadLevel = 0 | 1 | 2 | 3;

/** 0 = none, 1 = low, 2 = moderate, 3 = high. */
export interface MoveLoadProfile {
  loads: Partial<Record<BodyArea, LoadLevel>>;
  /** True when the move can be performed without jumping or noisy landings. */
  quiet: boolean;
  /** True when the move fits in a mat-sized training area. */
  smallSpace: boolean;
}

export type MoveLoadMap = Readonly<Record<string, MoveLoadProfile>>;
export type SafeReplacementMap = Readonly<Record<string, readonly string[]>>;

export interface ResolveMoveOptions {
  loadByKey: MoveLoadMap;
  replacementsByKey?: SafeReplacementMap;
  /** Hard constraints. A replacement must have zero mapped load here. */
  avoidAreas?: readonly BodyArea[];
  /** Soft constraints. Moderate/high loads prefer a gentler replacement. */
  limitationAreas?: readonly BodyArea[];
  quiet?: boolean;
  smallSpace?: boolean;
  /** Allows replacements to point to further replacements. Defaults to 3. */
  maxReplacementDepth?: number;
}

export interface ResolvedMoveKey {
  originalKey: string;
  key: string;
  adjusted: boolean;
  /** False means no configured replacement satisfied every hard constraint. */
  safe: boolean;
  reason: string;
}

interface MoveEvaluation {
  blockers: string[];
  limitationLoad: number;
  elevatedLimitations: BodyArea[];
}

interface Candidate {
  key: string;
  depth: number;
  order: number;
  evaluation: MoveEvaluation;
}

const DEFAULT_MAX_REPLACEMENT_DEPTH = 3;

function uniqueAreas(areas: readonly BodyArea[] | undefined): BodyArea[] {
  return BODY_AREAS.filter((area) => areas?.includes(area));
}

function areaLoad(profile: MoveLoadProfile, area: BodyArea): LoadLevel {
  return profile.loads[area] ?? 0;
}

function evaluateMove(
  key: string,
  options: ResolveMoveOptions,
  avoidAreas: readonly BodyArea[],
  limitationAreas: readonly BodyArea[],
): MoveEvaluation {
  const profile = options.loadByKey[key];
  const hasConstraints =
    avoidAreas.length > 0 ||
    limitationAreas.length > 0 ||
    options.quiet === true ||
    options.smallSpace === true;

  if (!profile) {
    return {
      blockers: hasConstraints ? ["missing safety profile"] : [],
      limitationLoad: 0,
      elevatedLimitations: [],
    };
  }

  const blockers: string[] = [];
  for (const area of avoidAreas) {
    if (areaLoad(profile, area) > 0) blockers.push(`${area.toLowerCase()} load`);
  }
  if (options.quiet && !profile.quiet) blockers.push("quiet mode");
  if (options.smallSpace && !profile.smallSpace) blockers.push("small-space mode");

  const limitationLoad = limitationAreas.reduce(
    (total, area) => total + areaLoad(profile, area),
    0,
  );
  const elevatedLimitations = limitationAreas.filter(
    (area) => areaLoad(profile, area) >= 2,
  );

  return { blockers, limitationLoad, elevatedLimitations };
}

function collectCandidateKeys(
  originalKey: string,
  replacementsByKey: SafeReplacementMap,
  maxDepth: number,
): Array<{ key: string; depth: number; order: number }> {
  const queue = [{ key: originalKey, depth: 0, order: 0 }];
  const candidates: Array<{ key: string; depth: number; order: number }> = [];
  const visited = new Set<string>();
  let nextOrder = 1;

  while (queue.length > 0) {
    const candidate = queue.shift();
    if (!candidate || visited.has(candidate.key)) continue;
    visited.add(candidate.key);
    candidates.push(candidate);

    if (candidate.depth >= maxDepth) continue;
    for (const replacementKey of replacementsByKey[candidate.key] ?? []) {
      if (!visited.has(replacementKey)) {
        queue.push({
          key: replacementKey,
          depth: candidate.depth + 1,
          order: nextOrder++,
        });
      }
    }
  }

  return candidates;
}

function constraintSummary(
  avoidAreas: readonly BodyArea[],
  limitationAreas: readonly BodyArea[],
  options: ResolveMoveOptions,
): string {
  const parts: string[] = [];
  if (avoidAreas.length) parts.push(`avoid ${avoidAreas.join("/")}`);
  if (limitationAreas.length) parts.push(`reduce ${limitationAreas.join("/")} load`);
  if (options.quiet) parts.push("stay quiet");
  if (options.smallSpace) parts.push("fit a small space");
  return parts.join(", ");
}

/** Resolve one requested movement through its ordered replacement graph. */
export function resolveMoveKey(
  originalKey: string,
  options: ResolveMoveOptions,
): ResolvedMoveKey {
  const avoidAreas = uniqueAreas(options.avoidAreas);
  const limitationAreas = uniqueAreas(options.limitationAreas).filter(
    (area) => !avoidAreas.includes(area),
  );
  const replacementsByKey = options.replacementsByKey ?? {};
  const maxDepth = Math.max(
    0,
    Math.floor(options.maxReplacementDepth ?? DEFAULT_MAX_REPLACEMENT_DEPTH),
  );
  const evaluated: Candidate[] = collectCandidateKeys(
    originalKey,
    replacementsByKey,
    maxDepth,
  ).map((candidate) => ({
    ...candidate,
    evaluation: evaluateMove(
      candidate.key,
      options,
      avoidAreas,
      limitationAreas,
    ),
  }));

  const original = evaluated[0];
  if (!original) {
    return {
      originalKey,
      key: originalKey,
      adjusted: false,
      safe: false,
      reason: "No movement or replacement metadata was available.",
    };
  }

  const originalNeedsGentlerOption =
    original.evaluation.elevatedLimitations.length > 0;
  if (
    original.evaluation.blockers.length === 0 &&
    !originalNeedsGentlerOption
  ) {
    return {
      originalKey,
      key: originalKey,
      adjusted: false,
      safe: true,
      reason: "No adjustment needed for the selected settings.",
    };
  }

  const compatible = evaluated
    .filter((candidate) => candidate.evaluation.blockers.length === 0)
    .sort((a, b) => {
      const loadDifference =
        a.evaluation.limitationLoad - b.evaluation.limitationLoad;
      if (loadDifference !== 0) return loadDifference;
      if (a.depth !== b.depth) return a.depth - b.depth;
      return a.order - b.order;
    });
  const best = compatible[0];
  const replacementImprovesLimitations =
    best &&
    best.key !== originalKey &&
    best.evaluation.limitationLoad < original.evaluation.limitationLoad;
  const originalHasHardBlocker = original.evaluation.blockers.length > 0;

  if (
    best &&
    best.key !== originalKey &&
    (originalHasHardBlocker || replacementImprovesLimitations)
  ) {
    const summary = constraintSummary(
      avoidAreas,
      limitationAreas,
      options,
    );
    return {
      originalKey,
      key: best.key,
      adjusted: true,
      safe: true,
      reason: summary
        ? `Replaced to ${summary}.`
        : "Replaced with the closest compatible movement.",
    };
  }

  if (originalHasHardBlocker) {
    return {
      originalKey,
      key: originalKey,
      adjusted: false,
      safe: false,
      reason: `No configured replacement satisfies: ${original.evaluation.blockers.join(", ")}.`,
    };
  }

  return {
    originalKey,
    key: originalKey,
    adjusted: false,
    safe: true,
    reason: `No configured replacement reduces ${original.evaluation.elevatedLimitations.join("/")} load further.`,
  };
}

/** Resolve a complete requested movement list while preserving its order. */
export function resolveMoveKeys(
  requestedKeys: readonly string[],
  options: ResolveMoveOptions,
): ResolvedMoveKey[] {
  return requestedKeys.map((key) => resolveMoveKey(key, options));
}

export type TargetMinutes = 10 | 15 | 20;

export interface DurationPrescription {
  targetMinutes: TargetMinutes;
  targetSeconds: number;
  rounds: number;
  restSeconds: number;
  warmupSeconds: number;
  cooldownSeconds: number;
  workSeconds: number;
  estimatedSeconds: number;
  differenceSeconds: number;
  withinTolerance: boolean;
}

export interface DurationOptions {
  warmupSeconds?: number;
  cooldownSeconds?: number;
  minimumRestSeconds?: number;
  maximumRestSeconds?: number;
  maximumRounds?: number;
  toleranceSeconds?: number;
}

export type SessionFeedback = "Loved it" | "Good" | "Too easy" | "Too hard" | "Pain";
export type AdjustmentReadiness = "Recover" | "Ready" | "Push";

/** Convert one linked post-session response into the next workout adjustment. */
export function deriveNextAdjustment(
  feedback: SessionFeedback,
  baseRotation: number,
  rotationCount: number,
): { readiness: AdjustmentReadiness; rotation: number } {
  const safeRotationCount = Math.max(1, Math.floor(rotationCount));
  const normalizedBase = Math.max(0, Math.floor(baseRotation)) % safeRotationCount;
  if (feedback === "Pain" || feedback === "Too hard") {
    return { readiness: "Recover", rotation: normalizedBase };
  }
  return {
    readiness: feedback === "Too easy" ? "Push" : "Ready",
    rotation: (normalizedBase + 1) % safeRotationCount,
  };
}

/** Credit only elapsed active time and its proportional share of planned load. */
export function creditSessionWork(
  plannedSeconds: number,
  plannedVolume: number,
  activeSeconds: number,
): { activeSeconds: number; durationMinutes: number; volume: number; completionRatio: number } {
  const safePlan = Math.max(1, nonNegativeInteger(plannedSeconds, 1));
  const creditedSeconds = Math.max(0, Math.min(safePlan, Number.isFinite(activeSeconds) ? activeSeconds : 0));
  const completionRatio = Math.min(1, creditedSeconds / safePlan);
  return {
    activeSeconds: Math.round(creditedSeconds),
    durationMinutes: Math.round(creditedSeconds / 6) / 10,
    volume: Math.round(Math.max(0, plannedVolume) * completionRatio),
    completionRatio,
  };
}

export interface SessionCompletionSummary {
  activeSeconds?: number;
  durationMinutes?: number;
  plannedMinutes?: number;
}

/** Require enough real movement to make a first-win conversion feel earned. */
export function isMeaningfulSession(session: SessionCompletionSummary): boolean {
  const actualSeconds = Number.isFinite(session.activeSeconds)
    ? Math.max(0, session.activeSeconds ?? 0)
    : Math.max(0, session.durationMinutes ?? 0) * 60;
  const plannedSeconds = Math.max(60, (session.plannedMinutes ?? 10) * 60);
  const thresholdSeconds = Math.min(300, Math.max(120, plannedSeconds * 0.25));
  return actualSeconds >= thresholdSeconds;
}

/** Gentler safety regressions remain free; Premium gates only additional choices. */
export function isReplacementLocked(
  premiumActive: boolean,
  relation: "gentler" | "similar" | "stronger",
  availableIndex: number,
): boolean {
  return !premiumActive && relation !== "gentler" && availableIndex > 1;
}

const DEFAULT_WARMUP: Record<TargetMinutes, number> = {
  10: 60,
  15: 90,
  20: 120,
};

const DEFAULT_COOLDOWN: Record<TargetMinutes, number> = {
  10: 45,
  15: 60,
  20: 75,
};

function nonNegativeInteger(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : fallback;
}

/**
 * Find a practical rounds/rest prescription nearest to the requested duration.
 * Rest is inserted between movements, including between rounds, but not after
 * the final movement.
 */
export function buildDurationPrescription(
  moveSeconds: readonly number[],
  targetMinutes: TargetMinutes,
  options: DurationOptions = {},
): DurationPrescription {
  const normalizedMoves = moveSeconds.map((seconds) =>
    nonNegativeInteger(seconds, 0),
  );
  if (normalizedMoves.length === 0 || normalizedMoves.some((value) => value === 0)) {
    throw new Error("Every workout movement must have a positive duration.");
  }

  const targetSeconds = targetMinutes * 60;
  const warmupSeconds = nonNegativeInteger(
    options.warmupSeconds ?? DEFAULT_WARMUP[targetMinutes],
    DEFAULT_WARMUP[targetMinutes],
  );
  const cooldownSeconds = nonNegativeInteger(
    options.cooldownSeconds ?? DEFAULT_COOLDOWN[targetMinutes],
    DEFAULT_COOLDOWN[targetMinutes],
  );
  const minimumRestSeconds = nonNegativeInteger(
    options.minimumRestSeconds ?? 5,
    5,
  );
  const maximumRestSeconds = Math.max(
    minimumRestSeconds,
    nonNegativeInteger(options.maximumRestSeconds ?? 45, 45),
  );
  const maximumRounds = Math.max(
    1,
    nonNegativeInteger(options.maximumRounds ?? 12, 12),
  );
  const toleranceSeconds = nonNegativeInteger(options.toleranceSeconds ?? 60, 60);
  const workPerRound = normalizedMoves.reduce((sum, seconds) => sum + seconds, 0);
  const preferredRounds = targetMinutes / 5;

  let best:
    | {
        rounds: number;
        restSeconds: number;
        workSeconds: number;
        estimatedSeconds: number;
        differenceSeconds: number;
      }
    | undefined;

  for (let rounds = 1; rounds <= maximumRounds; rounds += 1) {
    const intervals = Math.max(0, rounds * normalizedMoves.length - 1);
    const firstRest = intervals === 0 ? 0 : minimumRestSeconds;
    const lastRest = intervals === 0 ? 0 : maximumRestSeconds;

    for (let restSeconds = firstRest; restSeconds <= lastRest; restSeconds += 1) {
      const workSeconds = workPerRound * rounds;
      const estimatedSeconds =
        warmupSeconds + cooldownSeconds + workSeconds + intervals * restSeconds;
      const candidate = {
        rounds,
        restSeconds,
        workSeconds,
        estimatedSeconds,
        differenceSeconds: estimatedSeconds - targetSeconds,
      };

      if (!best) {
        best = candidate;
        continue;
      }

      const candidateDelta = Math.abs(candidate.differenceSeconds);
      const bestDelta = Math.abs(best.differenceSeconds);
      const candidateRoundDistance = Math.abs(rounds - preferredRounds);
      const bestRoundDistance = Math.abs(best.rounds - preferredRounds);
      const candidateRestDistance = Math.abs(restSeconds - 15);
      const bestRestDistance = Math.abs(best.restSeconds - 15);

      if (
        candidateDelta < bestDelta ||
        (candidateDelta === bestDelta && candidateRoundDistance < bestRoundDistance) ||
        (candidateDelta === bestDelta &&
          candidateRoundDistance === bestRoundDistance &&
          candidateRestDistance < bestRestDistance)
      ) {
        best = candidate;
      }
    }
  }

  if (!best) throw new Error("Unable to build a duration prescription.");

  return {
    targetMinutes,
    targetSeconds,
    rounds: best.rounds,
    restSeconds: best.restSeconds,
    warmupSeconds,
    cooldownSeconds,
    workSeconds: best.workSeconds,
    estimatedSeconds: best.estimatedSeconds,
    differenceSeconds: best.differenceSeconds,
    withinTolerance: Math.abs(best.differenceSeconds) <= toleranceSeconds,
  };
}

export type SessionTimestamp = string | number | Date;

export interface LocalProgressSession {
  at: SessionTimestamp;
  durationMinutes: number;
  volume: number;
}

export interface DailyLoadBar {
  /** Local calendar date in YYYY-MM-DD form. */
  date: string;
  /** Stable three-letter weekday label. */
  label: string;
  volume: number;
  sessionCount: number;
  /** Relative height from 0 to 100 within the returned seven-day window. */
  normalized: number;
}

export interface LocalProgressMetrics {
  totalMinutes: number;
  totalVolume: number;
  sessionCount: number;
  streakDays: number;
  sessionsThisWeek: number;
  loadBars: DailyLoadBar[];
}

export interface ProgressOptions {
  now?: SessionTimestamp;
  /**
   * Use a fixed offset for reproducible local-day boundaries. When omitted,
   * the runtime's local timezone is used.
   */
  utcOffsetMinutes?: number;
}

const DAY_MS = 86_400_000;
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

function timestampMilliseconds(value: SessionTimestamp): number | null {
  const milliseconds = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(milliseconds) ? milliseconds : null;
}

function localDayIndex(milliseconds: number, utcOffsetMinutes?: number): number {
  if (utcOffsetMinutes !== undefined && Number.isFinite(utcOffsetMinutes)) {
    return Math.floor((milliseconds + utcOffsetMinutes * 60_000) / DAY_MS);
  }
  const local = new Date(milliseconds);
  return Math.floor(
    Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()) / DAY_MS,
  );
}

function dateFromDayIndex(dayIndex: number): string {
  return new Date(dayIndex * DAY_MS).toISOString().slice(0, 10);
}

function weekdayFromDayIndex(dayIndex: number): string {
  return WEEKDAYS[new Date(dayIndex * DAY_MS).getUTCDay()];
}

/** Compute honest progress totals and the most recent seven local calendar days. */
export function computeLocalProgressMetrics(
  sessions: readonly LocalProgressSession[],
  options: ProgressOptions = {},
): LocalProgressMetrics {
  const nowMilliseconds = timestampMilliseconds(options.now ?? new Date());
  if (nowMilliseconds === null) throw new Error("Progress 'now' timestamp is invalid.");

  const validSessions = sessions.flatMap((session) => {
    const milliseconds = timestampMilliseconds(session.at);
    if (milliseconds === null || milliseconds > nowMilliseconds) return [];
    const durationMinutes = Number.isFinite(session.durationMinutes)
      ? Math.max(0, session.durationMinutes)
      : 0;
    const volume = Number.isFinite(session.volume) ? Math.max(0, session.volume) : 0;
    if (durationMinutes === 0 && volume === 0) return [];
    return [
      {
        dayIndex: localDayIndex(milliseconds, options.utcOffsetMinutes),
        durationMinutes,
        volume,
      },
    ];
  });

  const totalMinutes = validSessions.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );
  const totalVolume = validSessions.reduce(
    (sum, session) => sum + session.volume,
    0,
  );
  const trainedDays = new Set(validSessions.map((session) => session.dayIndex));
  const todayIndex = localDayIndex(nowMilliseconds, options.utcOffsetMinutes);
  let streakCursor = trainedDays.has(todayIndex) ? todayIndex : todayIndex - 1;
  let streakDays = 0;
  while (trainedDays.has(streakCursor)) {
    streakDays += 1;
    streakCursor -= 1;
  }
  const weekday = new Date(todayIndex * DAY_MS).getUTCDay();
  const weekStartIndex = todayIndex - ((weekday + 6) % 7);
  const sessionsThisWeek = validSessions.filter(
    (session) => session.dayIndex >= weekStartIndex && session.dayIndex <= todayIndex,
  ).length;

  const daily = new Map<number, { volume: number; sessionCount: number }>();
  for (const session of validSessions) {
    if (session.dayIndex < todayIndex - 6 || session.dayIndex > todayIndex) continue;
    const current = daily.get(session.dayIndex) ?? { volume: 0, sessionCount: 0 };
    current.volume += session.volume;
    current.sessionCount += 1;
    daily.set(session.dayIndex, current);
  }
  const maximumDailyVolume = Math.max(
    0,
    ...Array.from(daily.values(), (entry) => entry.volume),
  );
  const loadBars = Array.from({ length: 7 }, (_, index): DailyLoadBar => {
    const dayIndex = todayIndex - 6 + index;
    const entry = daily.get(dayIndex) ?? { volume: 0, sessionCount: 0 };
    return {
      date: dateFromDayIndex(dayIndex),
      label: weekdayFromDayIndex(dayIndex),
      volume: Math.round(entry.volume * 10) / 10,
      sessionCount: entry.sessionCount,
      normalized:
        maximumDailyVolume > 0
          ? Math.round((entry.volume / maximumDailyVolume) * 100)
          : 0,
    };
  });

  return {
    totalMinutes: Math.round(totalMinutes * 10) / 10,
    totalVolume: Math.round(totalVolume * 10) / 10,
    sessionCount: validSessions.length,
    streakDays,
    sessionsThisWeek,
    loadBars,
  };
}
