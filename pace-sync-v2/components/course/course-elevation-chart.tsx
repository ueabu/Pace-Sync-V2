'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

import type { Arrangement, CourseProfile, RacePlan, Track } from '@/lib/types';

import { buildElevationChartSeries } from '@/lib/course/chart-series';

export type CourseElevationChartProps = {
  courseProfile: CourseProfile;
  racePlan: RacePlan;
  arrangement: Arrangement;
  tracksById: Map<string, Track>;
  className?: string;
};

const CHART_PADDING = { top: 10, right: 10, bottom: 22, left: 44 };

export const CourseElevationChart = ({
  courseProfile,
  racePlan,
  arrangement,
  tracksById,
  className = '',
}: CourseElevationChartProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 400, height: 112 });

  const gradId = useId().replace(/:/g, '');

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }

    const measure = (): void => {
      const width = Math.max(120, el.clientWidth);
      const height = Math.max(96, el.clientHeight);
      setSize({ width, height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(
    () =>
      buildElevationChartSeries(
        courseProfile,
        arrangement,
        size.width,
        size.height,
        CHART_PADDING,
      ),
    [courseProfile, arrangement, size.width, size.height],
  );

  const raceKm = (racePlan.distanceMeters / 1000).toFixed(2);
  const courseKm = (courseProfile.totalDistanceMeters / 1000).toFixed(2);

  return (
    <div className={`flex w-full flex-col gap-1 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-0.5 text-xs text-zinc-600 dark:text-zinc-400">
        <span className="font-semibold text-zinc-800 dark:text-zinc-100">
          Elevation
          {courseProfile.name ? (
            <span className="ml-1 font-normal text-zinc-600 dark:text-zinc-400">
              · {courseProfile.name}
            </span>
          ) : null}
        </span>
        <span>
          Plan {raceKm} km · GPX {courseKm} km · vertical guides = song starts
        </span>
      </div>
      <div
        ref={wrapRef}
        className="h-28 w-full shrink-0 sm:h-36 md:h-44 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/60"
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${series.viewWidth} ${series.viewHeight}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Elevation profile aligned to race timeline"
        >
          <defs>
            <linearGradient
              id={`fill-${gradId}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.35" />
              <stop offset="55%" stopColor="rgb(245 158 11)" stopOpacity="0.45" />
              <stop offset="100%" stopColor="rgb(239 68 68)" stopOpacity="0.35" />
            </linearGradient>
            <linearGradient
              id={`line-${gradId}`}
              x1="0%"
              y1="100%"
              x2="0%"
              y2="0%"
            >
              <stop offset="0%" stopColor="rgb(5 150 105)" />
              <stop offset="100%" stopColor="rgb(234 88 12)" />
            </linearGradient>
          </defs>

          <path
            d={series.areaPath}
            fill={`url(#fill-${gradId})`}
            stroke="none"
          />
          <path
            d={series.linePath}
            fill="none"
            stroke={`url(#line-${gradId})`}
            strokeWidth={2.25}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />

          {series.trackStarts.map((mark) => (
            <line
              key={mark.trackId}
              x1={mark.x}
              x2={mark.x}
              y1={series.padding.top}
              y2={series.padding.top + series.innerHeight}
              stroke="rgb(63 63 70 / 0.35)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              strokeDasharray="4 3"
            />
          ))}

          <text
            x={series.padding.left}
            y={series.padding.top + series.innerHeight + 16}
            fill="rgb(82 82 91)"
            fontSize={10}
          >
            Start
          </text>
          <text
            x={series.padding.left + series.innerWidth}
            y={series.padding.top + series.innerHeight + 16}
            fill="rgb(82 82 91)"
            fontSize={10}
            textAnchor="end"
          >
            Finish ({raceKm} km plan)
          </text>

          <text
            x={4}
            y={series.padding.top + 10}
            fill="rgb(82 82 91)"
            fontSize={9}
            textAnchor="start"
          >
            {Math.round(series.maxElev)} m
          </text>
          <text
            x={4}
            y={series.padding.top + series.innerHeight}
            fill="rgb(82 82 91)"
            fontSize={9}
            textAnchor="start"
          >
            {Math.round(series.minElev)} m
          </text>
        </svg>
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 px-0.5 text-[11px] text-zinc-600 dark:text-zinc-400">
        {arrangement.tracks.map((t) => {
          const meta = tracksById.get(t.trackId);
          const label = meta?.name ?? t.trackId;
          const startKm =
            (t.startSecond / arrangement.raceDurationSeconds) *
            (racePlan.distanceMeters / 1000);
          return (
            <li key={t.trackId}>
              <span className="font-medium text-zinc-800 dark:text-zinc-100">
                {label}
              </span>
              <span className="text-zinc-500 dark:text-zinc-500">
                {' '}
                @ {startKm.toFixed(2)} km
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
