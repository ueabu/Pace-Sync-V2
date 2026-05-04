'use client';

import { useMemo } from 'react';

import type { RacePlan, Track } from '@/lib/types';

import { computeArrangement } from '@/lib/arrangement';

import { CourseProfileProvider } from '@/components/course/course-profile-context';
import { CourseToolsPanel } from '@/components/course/course-tools-panel';
import { DemoTimelineStrip } from '@/components/course/demo-timeline-strip';
import { EditorCourseShell } from '@/components/course/editor-course-shell';

const DEMO_TRACKS: Track[] = [
  {
    id: 't1',
    name: 'Start steady',
    artists: ['Demo'],
    durationMs: 1_900_000,
  },
  {
    id: 't2',
    name: 'Climb push',
    artists: ['Demo'],
    durationMs: 1_850_000,
  },
  {
    id: 't3',
    name: 'Flat groove',
    artists: ['Demo'],
    durationMs: 1_800_000,
  },
  {
    id: 't4',
    name: 'Kick',
    artists: ['Demo'],
    durationMs: 1_650_000,
  },
];

const DEMO_PLAN: RacePlan = {
  distanceMeters: 21_097,
  targetTimeSeconds: 7200,
  trackIds: ['t1', 't2', 't3', 't4'],
  anchors: [{ trackId: 't2', targetSecond: 2700 }],
};

export const PacelistCoursePlayground = () => {
  const tracksById = useMemo(() => {
    const m = new Map<string, Track>();
    for (const t of DEMO_TRACKS) {
      m.set(t.id, t);
    }
    return m;
  }, []);

  const arrangement = useMemo(
    () => computeArrangement(DEMO_PLAN, DEMO_TRACKS),
    [],
  );

  return (
    <CourseProfileProvider>
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Pacelist · course profile demo
          </h1>
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            Half-marathon plan with one anchored song. Upload a GPX (with elevation) or try
            OSM race search — the chart stays aligned with the timeline width without touching
            timeline internals.
          </p>
        </header>

        <CourseToolsPanel />

        <EditorCourseShell
          racePlan={DEMO_PLAN}
          arrangement={arrangement}
          tracksById={tracksById}
          timelineSlot={
            <DemoTimelineStrip arrangement={arrangement} tracksById={tracksById} />
          }
          chartPlacement="below"
        />
      </section>
    </CourseProfileProvider>
  );
};
