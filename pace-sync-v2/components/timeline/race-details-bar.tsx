"use client";

import {
  formatClock,
  parseFlexibleTimeToSeconds,
  parsePositiveNumber,
} from "@/lib/timeline/scale";
import { useTimelineEditor } from "@/hooks/useTimelineEditor";

export const RaceDetailsBar = () => {
  const { racePlan, setDistanceValue, setDistanceUnit, setTargetTimeSeconds } =
    useTimelineEditor();

  return (
    <header className="flex flex-wrap items-end gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex min-w-[9rem] flex-col gap-1">
        <label htmlFor="race-distance" className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
          Distance
        </label>
        <div className="flex gap-2">
          <input
            id="race-distance"
            key={`race-distance-${racePlan.distanceValue}`}
            inputMode="decimal"
            className="h-11 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-background px-3 text-base dark:border-zinc-600"
            defaultValue={String(racePlan.distanceValue)}
            onBlur={(e) => {
              const v = parsePositiveNumber(e.currentTarget.value);
              if (v !== null) setDistanceValue(v);
              else e.currentTarget.value = String(racePlan.distanceValue);
            }}
          />
          <select
            aria-label="Distance unit"
            className="h-11 shrink-0 rounded-lg border border-zinc-300 bg-background px-2 text-base dark:border-zinc-600"
            value={racePlan.distanceUnit}
            onChange={(e) => {
              const u = e.target.value;
              if (u === "km" || u === "mi") setDistanceUnit(u);
            }}
          >
            <option value="km">km</option>
            <option value="mi">mi</option>
          </select>
        </div>
      </div>
      <div className="flex min-w-[8rem] flex-col gap-1">
        <label htmlFor="race-time" className="text-xs font-medium text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
          Target time
        </label>
        <input
          id="race-time"
          key={`race-time-${racePlan.targetTimeSeconds}`}
          inputMode="numeric"
          placeholder="h:mm:ss or m:ss"
          className="h-11 w-full min-w-[7.5rem] rounded-lg border border-zinc-300 bg-background px-3 text-base dark:border-zinc-600"
          defaultValue={formatClock(racePlan.targetTimeSeconds)}
          onBlur={(e) => {
            const parsed = parseFlexibleTimeToSeconds(e.currentTarget.value);
            if (parsed !== null) setTargetTimeSeconds(parsed);
            else e.currentTarget.value = formatClock(racePlan.targetTimeSeconds);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
        />
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Race length:{" "}
        <span className="font-medium text-foreground">{formatClock(racePlan.targetTimeSeconds)}</span>
      </p>
    </header>
  );
};
