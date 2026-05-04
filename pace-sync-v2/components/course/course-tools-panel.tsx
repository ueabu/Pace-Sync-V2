'use client';

import { GpxUpload } from '@/components/course/gpx-upload';
import { RaceNameSearch } from '@/components/course/race-name-search';
import { useCourseProfileOptional } from '@/components/course/course-profile-context';

export const CourseToolsPanel = () => {
  const { courseProfile, setCourseProfile } = useCourseProfileOptional();

  return (
    <details className="group rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <summary className="cursor-pointer select-none list-none px-4 py-3 text-sm font-semibold text-zinc-900 outline-none ring-emerald-500/40 focus-visible:ring-2 dark:text-zinc-50 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-2">
          <span>Optional · course profile</span>
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            GPX or OSM search
          </span>
        </span>
      </summary>
      <div className="space-y-6 border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <GpxUpload />
        <div className="border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800">
          <RaceNameSearch />
        </div>
        {courseProfile ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setCourseProfile(null)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Clear course profile
            </button>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Loaded from {courseProfile.source === 'gpx' ? 'GPX' : 'search'} ·{' '}
              {(courseProfile.totalDistanceMeters / 1000).toFixed(2)} km trace
            </span>
          </div>
        ) : null}
      </div>
    </details>
  );
};
