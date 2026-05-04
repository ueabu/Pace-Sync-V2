'use client';

import type { ReactNode } from 'react';

import type { Arrangement, RacePlan, Track } from '@/lib/types';

import { CourseElevationChart } from '@/components/course/course-elevation-chart';
import { useCourseProfileOptional } from '@/components/course/course-profile-context';

export type EditorCourseShellProps = {
  racePlan: RacePlan;
  arrangement: Arrangement;
  tracksById: Map<string, Track>;
  timelineSlot: ReactNode;
  chartPlacement?: 'above' | 'below';
};

export const EditorCourseShell = ({
  racePlan,
  arrangement,
  tracksById,
  timelineSlot,
  chartPlacement = 'below',
}: EditorCourseShellProps) => {
  const { courseProfile } = useCourseProfileOptional();

  const chart =
    courseProfile !== null ? (
      <CourseElevationChart
        courseProfile={courseProfile}
        racePlan={racePlan}
        arrangement={arrangement}
        tracksById={tracksById}
      />
    ) : null;

  return (
    <div className="flex w-full flex-col gap-3">
      {chartPlacement === 'above' ? chart : null}
      <div className="w-full min-w-0">{timelineSlot}</div>
      {chartPlacement === 'below' ? chart : null}
    </div>
  );
};
