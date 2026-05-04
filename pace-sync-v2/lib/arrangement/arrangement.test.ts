import { describe, expect, test } from 'bun:test';

import { computeArrangement, computePace, validatePlan } from './arrangement';
import type { RacePlan, Track } from '@/lib/types';

const track = (
  id: string,
  durationMs: number,
  overrides: Partial<Pick<Track, 'name' | 'artists'>> = {},
): Track => ({
  id,
  name: overrides.name ?? id,
  artists: overrides.artists ?? [],
  durationMs,
});

describe('computePace', () => {
  test('seconds per kilometre from plan', () => {
    const plan: RacePlan = {
      distanceMeters: 10_000,
      targetTimeSeconds: 3_600,
      trackIds: ['a'],
      anchors: [],
    };
    expect(computePace(plan)).toBe(360);
  });
});

describe('computeArrangement', () => {
  test('no anchors: contiguous playback in plan order', () => {
    const tracks = [track('a', 60_000), track('b', 120_000), track('c', 30_000)];
    const plan: RacePlan = {
      distanceMeters: 10_000,
      targetTimeSeconds: 3_600,
      trackIds: ['a', 'b', 'c'],
      anchors: [],
    };
    const result = computeArrangement(plan, tracks);
    expect(result.orderedTrackIds).toEqual(['a', 'b', 'c']);
    expect(result.tracks[0].startSecond).toBe(0);
    expect(result.tracks[1].startSecond).toBe(60);
    expect(result.tracks[2].startSecond).toBe(180);
    expect(result.anchorDeviations).toEqual([]);
    expect(result.totalMusicDurationSeconds).toBe(210);
    expect(result.raceDurationSeconds).toBe(3_600);
  });

  test('one anchor: can reorder unanchored to land anchor on time', () => {
    const tracks = [track('u', 200_000), track('x', 10_000)];
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 1_800,
      trackIds: ['u', 'x'],
      anchors: [{ trackId: 'x', targetSecond: 0 }],
    };
    const result = computeArrangement(plan, tracks);
    expect(result.orderedTrackIds).toEqual(['x', 'u']);
    expect(result.tracks.find((t) => t.trackId === 'x')?.startSecond).toBe(0);
    expect(result.anchorDeviations).toEqual([
      {
        trackId: 'x',
        targetSecond: 0,
        actualStartSecond: 0,
        deviationSeconds: 0,
      },
    ]);
  });

  test('multiple anchors: respects targets when order allows', () => {
    const tracks = [
      track('a', 60_000),
      track('b', 60_000),
      track('c', 60_000),
    ];
    const plan: RacePlan = {
      distanceMeters: 10_000,
      targetTimeSeconds: 3_600,
      trackIds: ['a', 'b', 'c'],
      anchors: [
        { trackId: 'a', targetSecond: 0 },
        { trackId: 'c', targetSecond: 180 },
      ],
    };
    const result = computeArrangement(plan, tracks);
    const a = result.tracks.find((t) => t.trackId === 'a');
    const b = result.tracks.find((t) => t.trackId === 'b');
    const c = result.tracks.find((t) => t.trackId === 'c');
    expect(a?.startSecond).toBe(0);
    expect(c?.startSecond).toBe(180);
    expect(b?.startSecond).toBe(60);
    expect(result.anchorDeviations.every((d) => d.deviationSeconds === 0)).toBe(true);
  });

  test('reorders playlist when only a later permutation hits anchor targets', () => {
    const tracks = [track('a', 60_000), track('b', 60_000)];
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 1_000,
      trackIds: ['a', 'b'],
      anchors: [{ trackId: 'b', targetSecond: 30 }],
    };
    const result = computeArrangement(plan, tracks);
    expect(result.orderedTrackIds).toEqual(['b', 'a']);
    expect(result.tracks.find((t) => t.trackId === 'b')?.startSecond).toBe(30);
    expect(result.anchorDeviations).toEqual([
      {
        trackId: 'b',
        targetSecond: 30,
        actualStartSecond: 30,
        deviationSeconds: 0,
      },
    ]);
  });

  test('more than eight tracks keeps plan order, which can force anchor deviation', () => {
    const ids = Array.from({ length: 9 }, (_, i) => `t${i}`);
    const tracks = ids.map((id) => track(id, 60_000));
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 3_600,
      trackIds: ids,
      anchors: [{ trackId: 't8', targetSecond: 0 }],
    };
    const result = computeArrangement(plan, tracks);
    expect(result.orderedTrackIds).toEqual(ids);
    expect(result.tracks.find((t) => t.trackId === 't8')?.startSecond).toBe(480);
    expect(result.anchorDeviations[0].deviationSeconds).toBe(480);
  });
});

describe('validatePlan', () => {
  test('total track duration shorter than race time', () => {
    const tracks = [track('a', 60_000), track('b', 30_000)];
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 400,
      trackIds: ['a', 'b'],
      anchors: [],
    };
    const errors = validatePlan(plan, tracks);
    expect(errors.some((e) => e.code === 'TOTAL_MUSIC_SHORTER_THAN_RACE')).toBe(true);
  });

  test('total track duration longer than race time is still valid', () => {
    const tracks = [track('a', 120_000), track('b', 120_000)];
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 100,
      trackIds: ['a', 'b'],
      anchors: [],
    };
    expect(validatePlan(plan, tracks)).toEqual([]);
  });

  test('overlapping anchor targets', () => {
    const tracks = [track('a', 120_000), track('b', 120_000)];
    const plan: RacePlan = {
      distanceMeters: 5_000,
      targetTimeSeconds: 500,
      trackIds: ['a', 'b'],
      anchors: [
        { trackId: 'a', targetSecond: 0 },
        { trackId: 'b', targetSecond: 60 },
      ],
    };
    const errors = validatePlan(plan, tracks);
    expect(errors.some((e) => e.code === 'ANCHOR_INTERVAL_OVERLAP')).toBe(true);
  });
});
