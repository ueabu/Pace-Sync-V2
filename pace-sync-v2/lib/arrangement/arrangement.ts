import type {
  AnchorDeviation,
  ArrangedTrack,
  Arrangement,
  PlanValidationError,
  RacePlan,
  Track,
} from '@/lib/types';

const DURATION_EPS = 1e-9;

const trackDurationSeconds = (track: Track): number => track.durationMs / 1000;

const assertFinitePositive = (
  label: 'distanceMeters' | 'targetTimeSeconds',
  value: number,
): void => {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be finite`);
  }
  if (value <= 0) {
    throw new RangeError(`${label} must be positive`);
  }
};

export const computePace = (plan: RacePlan): number => {
  assertFinitePositive('distanceMeters', plan.distanceMeters);
  assertFinitePositive('targetTimeSeconds', plan.targetTimeSeconds);
  return plan.targetTimeSeconds / (plan.distanceMeters / 1000);
};

const buildTrackMap = (tracks: Track[]): Map<string, Track> => {
  const map = new Map<string, Track>();
  for (const t of tracks) {
    map.set(t.id, t);
  }
  return map;
};

const anchorIntervalsOverlap = (
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean => !(aEnd <= bStart + DURATION_EPS || bEnd <= aStart + DURATION_EPS);

type SimulationResult = {
  orderedTrackIds: string[];
  tracks: ArrangedTrack[];
  anchorDeviations: AnchorDeviation[];
  totalMusicDurationSeconds: number;
  anchorScore: number;
};

const simulateOrder = (
  order: string[],
  plan: RacePlan,
  trackById: Map<string, Track>,
  anchorByTrackId: Map<string, number>,
): SimulationResult => {
  let nextStart = 0;
  const arranged: ArrangedTrack[] = [];
  let totalMusic = 0;

  for (const id of order) {
    const track = trackById.get(id);
    if (!track) {
      throw new Error(`Invariant: missing track ${id}`);
    }
    const durationSeconds = trackDurationSeconds(track);
    totalMusic += durationSeconds;
    const target = anchorByTrackId.get(id);
    const startSecond =
      target === undefined ? nextStart : Math.max(nextStart, target);
    arranged.push({ trackId: id, startSecond, durationSeconds });
    nextStart = startSecond + durationSeconds;
  }

  const anchorDeviations: AnchorDeviation[] = [];
  let anchorScore = 0;

  for (const a of plan.anchors) {
    const row = arranged.find((r) => r.trackId === a.trackId);
    if (!row) {
      throw new Error(`Invariant: anchor track missing from arrangement ${a.trackId}`);
    }
    const deviationSeconds = row.startSecond - a.targetSecond;
    anchorScore += Math.abs(deviationSeconds);
    anchorDeviations.push({
      trackId: a.trackId,
      targetSecond: a.targetSecond,
      actualStartSecond: row.startSecond,
      deviationSeconds,
    });
  }

  return {
    orderedTrackIds: order,
    tracks: arranged,
    anchorDeviations,
    totalMusicDurationSeconds: totalMusic,
    anchorScore,
  };
};

const lexCompare = (a: string[], b: string[]): number => {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i += 1) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  if (a.length < b.length) return -1;
  if (a.length > b.length) return 1;
  return 0;
};

const permutationsUpTo8 = (items: string[]): string[][] => {
  if (items.length === 0) return [[]];
  if (items.length > 8) {
    return [items];
  }
  const result: string[][] = [];
  const used = new Array(items.length).fill(false);
  const current: string[] = [];

  const dfs = (): void => {
    if (current.length === items.length) {
      result.push([...current]);
      return;
    }
    for (let i = 0; i < items.length; i += 1) {
      if (used[i]) continue;
      used[i] = true;
      current.push(items[i]);
      dfs();
      current.pop();
      used[i] = false;
    }
  };

  dfs();
  result.sort(lexCompare);
  return result;
};

export const validatePlan = (
  plan: RacePlan,
  tracks: Track[],
): PlanValidationError[] => {
  const errors: PlanValidationError[] = [];

  if (plan.trackIds.length === 0) {
    errors.push({
      code: 'EMPTY_TRACK_LIST',
      message: 'Race plan has no tracks',
    });
    return errors;
  }

  if (!Number.isFinite(plan.distanceMeters) || plan.distanceMeters <= 0) {
    errors.push({
      code: 'DISTANCE_NON_POSITIVE',
      message: 'distanceMeters must be finite and positive',
    });
  }

  if (!Number.isFinite(plan.targetTimeSeconds) || plan.targetTimeSeconds <= 0) {
    errors.push({
      code: 'TARGET_TIME_NON_POSITIVE',
      message: 'targetTimeSeconds must be finite and positive',
    });
  }

  const trackById = buildTrackMap(tracks);

  const seenAnchor = new Set<string>();
  for (const a of plan.anchors) {
    if (seenAnchor.has(a.trackId)) {
      errors.push({
        code: 'DUPLICATE_ANCHOR_TRACK',
        message: `Duplicate anchor for track ${a.trackId}`,
        details: { trackId: a.trackId },
      });
      break;
    }
    seenAnchor.add(a.trackId);
  }

  const planIdSet = new Set(plan.trackIds);
  for (const a of plan.anchors) {
    if (!planIdSet.has(a.trackId)) {
      errors.push({
        code: 'ANCHOR_NOT_IN_PLAN',
        message: `Anchor references track not listed in plan.trackIds: ${a.trackId}`,
        details: { trackId: a.trackId },
      });
    }
  }

  for (const id of plan.trackIds) {
    if (!trackById.has(id)) {
      errors.push({
        code: 'UNKNOWN_TRACK_ID',
        message: `Unknown track id in plan: ${id}`,
        details: { trackId: id },
      });
    }
  }

  for (const a of plan.anchors) {
    if (!trackById.has(a.trackId)) {
      errors.push({
        code: 'ANCHOR_UNKNOWN_TRACK',
        message: `Anchor references unknown track: ${a.trackId}`,
        details: { trackId: a.trackId },
      });
    }
  }

  const metas: { trackId: string; start: number; end: number }[] = [];
  for (const a of plan.anchors) {
    const t = trackById.get(a.trackId);
    if (!t) continue;
    const d = trackDurationSeconds(t);
    metas.push({ trackId: a.trackId, start: a.targetSecond, end: a.targetSecond + d });
  }

  let overlapPair: { a: string; b: string } | null = null;
  for (let i = 0; i < metas.length && overlapPair === null; i += 1) {
    for (let j = i + 1; j < metas.length; j += 1) {
      const A = metas[i];
      const B = metas[j];
      if (anchorIntervalsOverlap(A.start, A.end, B.start, B.end)) {
        overlapPair = { a: A.trackId, b: B.trackId };
        break;
      }
    }
  }
  if (overlapPair !== null) {
    errors.push({
      code: 'ANCHOR_INTERVAL_OVERLAP',
      message: `Anchor playback windows overlap for ${overlapPair.a} and ${overlapPair.b}`,
      details: { a: overlapPair.a, b: overlapPair.b },
    });
  }

  let totalMusic = 0;
  for (const id of plan.trackIds) {
    const t = trackById.get(id);
    if (t) totalMusic += trackDurationSeconds(t);
  }

  if (
    errors.length === 0 &&
    totalMusic + DURATION_EPS < plan.targetTimeSeconds
  ) {
    errors.push({
      code: 'TOTAL_MUSIC_SHORTER_THAN_RACE',
      message: 'Total track duration is shorter than the race target time',
      details: {
        totalMusicSeconds: totalMusic,
        raceSeconds: plan.targetTimeSeconds,
      },
    });
  }

  return errors;
};

export const computeArrangement = (
  plan: RacePlan,
  tracks: Track[],
): Arrangement => {
  assertFinitePositive('distanceMeters', plan.distanceMeters);
  assertFinitePositive('targetTimeSeconds', plan.targetTimeSeconds);

  if (plan.trackIds.length === 0) {
    throw new RangeError('Race plan has no tracks');
  }

  const trackById = buildTrackMap(tracks);
  for (const id of plan.trackIds) {
    if (!trackById.has(id)) {
      throw new RangeError(`Unknown track id in plan: ${id}`);
    }
  }
  for (const a of plan.anchors) {
    if (!trackById.has(a.trackId)) {
      throw new RangeError(`Unknown anchor track id: ${a.trackId}`);
    }
  }

  const anchorByTrackId = new Map(
    plan.anchors.map((a) => [a.trackId, a.targetSecond] as const),
  );

  if (new Set(plan.trackIds).size !== plan.trackIds.length) {
    throw new RangeError('trackIds must list each track at most once');
  }

  const perms = permutationsUpTo8([...plan.trackIds]);

  let best: SimulationResult | null = null;
  let bestPermLex: string[] | null = null;

  for (const perm of perms) {
    const sim = simulateOrder(perm, plan, trackById, anchorByTrackId);
    if (
      best === null ||
      sim.anchorScore < best.anchorScore ||
      (sim.anchorScore === best.anchorScore &&
        bestPermLex !== null &&
        lexCompare(perm, bestPermLex) < 0)
    ) {
      bestPermLex = perm;
      best = sim;
    }
  }

  if (!best || bestPermLex === null) {
    throw new Error('Invariant: no arrangement produced');
  }

  return {
    orderedTrackIds: best.orderedTrackIds,
    tracks: best.tracks,
    anchorDeviations: best.anchorDeviations,
    totalMusicDurationSeconds: best.totalMusicDurationSeconds,
    raceDurationSeconds: plan.targetTimeSeconds,
  };
};
