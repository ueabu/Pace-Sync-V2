"use client";

import type { CSSProperties } from "react";
import { getDistanceAxisTicks, getMinuteAxisTicks } from "@/lib/timeline/scale";
import { useTimelineEditor } from "@/hooks/useTimelineEditor";

type Props = {
  canvasWidthPx: number;
};

export const TimelineAxis = ({ canvasWidthPx }: Props) => {
  const { snapshot } = useTimelineEditor();
  const { racePlan, arrangement } = snapshot;
  const raceSeconds = arrangement.raceDurationSeconds;

  const minuteTicks = getMinuteAxisTicks({ raceSeconds });
  const distanceTicks = getDistanceAxisTicks({
    distanceValue: racePlan.distanceValue,
    distanceUnit: racePlan.distanceUnit,
  });

  const w = Math.max(1, canvasWidthPx);

  const barStyle: CSSProperties = {
    width: w,
    minWidth: "100%",
  };

  return (
    <div className="w-full min-w-0 shrink-0" style={barStyle}>
      <div className="relative h-14 w-full border-b border-zinc-200 text-xs dark:border-zinc-800">
        <div className="absolute inset-x-0 top-0 flex h-6 items-end">
          {minuteTicks.map((t, i) => (
            <span
              key={`m-${i}-${t.label}`}
              className="absolute -translate-x-1/2 whitespace-nowrap text-zinc-500 dark:text-zinc-400"
              style={{ left: `${t.offsetFraction * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-1 flex h-6 items-start">
          {distanceTicks.map((t, i) => (
            <span
              key={`d-${i}-${t.label}`}
              className="absolute -translate-x-1/2 whitespace-nowrap text-[0.65rem] text-zinc-400 dark:text-zinc-500"
              style={{ left: `${t.offsetFraction * 100}%` }}
            >
              {t.label}
            </span>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-6 h-px bg-zinc-200 dark:bg-zinc-700" />
      </div>
    </div>
  );
};
