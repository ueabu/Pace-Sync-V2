import type { DistanceUnit } from "@/lib/types";

export const formatClock = (totalSeconds: number): string => {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
};

export const parseClockToSeconds = (input: string): number | null => {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d+):(\d{1,2})$/);
  if (!match) return null;
  const m = Number.parseInt(match[1], 10);
  const sec = Number.parseInt(match[2], 10);
  if (!Number.isFinite(m) || !Number.isFinite(sec) || sec > 59) return null;
  return m * 60 + sec;
};

/** Accepts m:ss, mm:ss, or h:mm:ss (same rules as race target time field). */
export const parseFlexibleTimeToSeconds = (raw: string): number | null => {
  const s = raw.trim();
  if (!s) return null;
  const parts = s.split(":").map((p) => p.trim());
  if (parts.some((p) => p === "")) return null;
  const nums = parts.map((p) => Number.parseInt(p, 10));
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return null;
  if (parts.length === 2) {
    const [m, sec] = nums;
    if (sec > 59) return null;
    return m * 60 + sec;
  }
  if (parts.length === 3) {
    const [h, m, sec] = nums;
    if (m > 59 || sec > 59) return null;
    return h * 3600 + m * 60 + sec;
  }
  return parseClockToSeconds(s);
};

export const parsePositiveNumber = (input: string): number | null => {
  const n = Number.parseFloat(input.replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
};

export type MinuteTick = {
  offsetFraction: number;
  label: string;
};

export type DistanceTick = {
  offsetFraction: number;
  label: string;
};

type AxisOptions = {
  raceSeconds: number;
  distanceValue: number;
  distanceUnit: DistanceUnit;
};

export const getMinuteAxisTicks = ({ raceSeconds }: Pick<AxisOptions, "raceSeconds">): MinuteTick[] => {
  const out: MinuteTick[] = [];
  if (raceSeconds <= 0) return out;
  const minuteStep =
    raceSeconds <= 90 ? 1 : raceSeconds <= 3600 ? 5 : raceSeconds <= 7200 ? 10 : 15;
  for (let s = 0; s <= raceSeconds; s += minuteStep * 60) {
    const frac = s / raceSeconds;
    out.push({
      offsetFraction: frac,
      label: formatClock(s),
    });
  }
  return out;
};

export const getDistanceAxisTicks = ({
  distanceValue,
  distanceUnit,
}: Pick<AxisOptions, "distanceValue" | "distanceUnit">): DistanceTick[] => {
  const out: DistanceTick[] = [];
  if (distanceValue <= 0) return out;

  const kilometers =
    distanceUnit === "km" ? distanceValue : distanceValue * 1.609344;
  const miles =
    distanceUnit === "mi" ? distanceValue : distanceValue / 1.609344;

  const useKmAxis = distanceUnit === "km";
  const totalForAxis = useKmAxis ? kilometers : miles;
  const unitLabel = useKmAxis ? "km" : "mi";
  const step =
    totalForAxis <= 5 ? 1 : totalForAxis <= 21 ? 2 : totalForAxis <= 42 ? 5 : 10;

  for (let d = 0; d <= totalForAxis + 1e-9; d += step) {
    const frac = totalForAxis === 0 ? 0 : Math.min(1, d / totalForAxis);
    const label =
      Math.abs(d - Math.round(d)) < 1e-6 ? `${Math.round(d)}${unitLabel}` : `${d.toFixed(1)}${unitLabel}`;
    out.push({ offsetFraction: frac, label });
  }
  return out;
};
