import { describe, expect, test } from 'bun:test';

import type { CourseProfile, RacePlan } from '@/lib/types';

import {
  distanceAtRaceFraction,
  plannedDistanceAtRaceFraction,
} from '@/lib/course/chart-series';

describe('course chart helpers', () => {
  test('plannedDistanceAtRaceFraction matches constant-pace proportion', () => {
    const plan: RacePlan = {
      distanceMeters: 12_000,
      targetTimeSeconds: 3600,
      trackIds: [],
      anchors: [],
    };
    expect(plannedDistanceAtRaceFraction(plan, 0.25)).toBe(3000);
  });

  test('distanceAtRaceFraction scales to GPX length', () => {
    const profile: CourseProfile = {
      source: 'gpx',
      totalDistanceMeters: 8000,
      points: [],
    };
    expect(distanceAtRaceFraction(profile, 0.5)).toBe(4000);
  });
});
