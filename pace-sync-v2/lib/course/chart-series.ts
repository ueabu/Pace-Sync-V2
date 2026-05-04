import type { Arrangement, CourseProfile, RacePlan } from '@/lib/types';

export type ElevationChartPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type ElevationChartSeries = {
  viewWidth: number;
  viewHeight: number;
  padding: ElevationChartPadding;
  innerWidth: number;
  innerHeight: number;
  linePath: string;
  areaPath: string;
  minElev: number;
  maxElev: number;
  trackStarts: { x: number; trackId: string }[];
};

const elevRange = (
  profile: CourseProfile,
): { min: number; max: number } => {
  let min = profile.points[0].elevationMeters;
  let max = min;
  for (const p of profile.points) {
    min = Math.min(min, p.elevationMeters);
    max = Math.max(max, p.elevationMeters);
  }
  const pad = Math.max(8, (max - min) * 0.08);
  return { min: min - pad, max: max + pad };
};

export const buildElevationChartSeries = (
  profile: CourseProfile,
  arrangement: Arrangement,
  width: number,
  height: number,
  padding: ElevationChartPadding,
): ElevationChartSeries => {
  const innerWidth = Math.max(1, width - padding.left - padding.right);
  const innerHeight = Math.max(1, height - padding.top - padding.bottom);
  const { min: minElev, max: maxElev } = elevRange(profile);
  const elevSpan = Math.max(maxElev - minElev, 1e-6);

  const total = profile.totalDistanceMeters;
  const xAtDistance = (d: number): number =>
    padding.left + (d / total) * innerWidth;

  const yAtElev = (e: number): number =>
    padding.top + innerHeight - ((e - minElev) / elevSpan) * innerHeight;

  const coords = profile.points.map((pt) => ({
    x: xAtDistance(pt.distanceMeters),
    y: yAtElev(pt.elevationMeters),
  }));

  const linePath = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');

  const bottomY = padding.top + innerHeight;
  const areaPath = `${linePath} L ${coords[coords.length - 1].x.toFixed(2)} ${bottomY.toFixed(2)} L ${coords[0].x.toFixed(2)} ${bottomY.toFixed(2)} Z`;

  const raceT = arrangement.raceDurationSeconds;
  const trackStarts = arrangement.tracks.map((t) => ({
    x: padding.left + (t.startSecond / raceT) * innerWidth,
    trackId: t.trackId,
  }));

  return {
    viewWidth: width,
    viewHeight: height,
    padding,
    innerWidth,
    innerHeight,
    linePath,
    areaPath,
    minElev,
    maxElev,
    trackStarts,
  };
};

/** Distance along the uploaded course that corresponds to a race-time fraction. */
export const distanceAtRaceFraction = (
  profile: CourseProfile,
  fraction: number,
): number => {
  const f = Math.min(1, Math.max(0, fraction));
  return f * profile.totalDistanceMeters;
};

/** Planned race distance at a race-time fraction (constant-pace model). */
export const plannedDistanceAtRaceFraction = (
  plan: RacePlan,
  fraction: number,
): number => {
  const f = Math.min(1, Math.max(0, fraction));
  return f * plan.distanceMeters;
};
