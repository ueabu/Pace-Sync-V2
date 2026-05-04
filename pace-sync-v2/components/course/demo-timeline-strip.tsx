'use client';

import type { Arrangement, Track } from '@/lib/types';

export type DemoTimelineStripProps = {
  arrangement: Arrangement;
  tracksById: Map<string, Track>;
};

const COLORS = [
  'bg-emerald-500/85',
  'bg-sky-500/85',
  'bg-violet-500/85',
  'bg-amber-500/85',
  'bg-rose-500/85',
];

export const DemoTimelineStrip = ({
  arrangement,
  tracksById,
}: DemoTimelineStripProps) => {
  const total = arrangement.raceDurationSeconds;

  return (
    <div className="w-full min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Playlist timeline (demo){' '}
        <span className="font-normal normal-case text-zinc-600 dark:text-zinc-400">
          — share this width with the elevation chart
        </span>
      </p>
      <div className="flex h-14 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-inner dark:border-zinc-800 dark:bg-zinc-950">
        {arrangement.tracks.map((t, idx) => {
          const wPct = (t.durationSeconds / total) * 100;
          const meta = tracksById.get(t.trackId);
          const title = meta?.name ?? t.trackId;
          const color = COLORS[idx % COLORS.length];
          return (
            <div
              key={`${t.trackId}-${idx}`}
              className={`relative flex min-w-0 items-center justify-center border-r border-white/20 px-1 text-center text-[10px] font-semibold leading-tight text-white last:border-r-0 sm:text-xs ${color}`}
              style={{ width: `${wPct}%` }}
              title={`${title} · ${t.durationSeconds.toFixed(0)}s`}
            >
              <span className="line-clamp-2">{title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
