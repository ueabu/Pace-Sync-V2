'use server';

import type { CourseProfile } from '@/lib/types';

import { searchRaceCourseProfile } from '@/lib/course/race-search';

export type RaceCourseSearchActionResult =
  | { ok: true; profile: CourseProfile }
  | {
      ok: false;
      code: 'NOT_FOUND' | 'UNAVAILABLE';
      message: string;
    };

export const searchRaceCourseAction = async (
  query: string,
): Promise<RaceCourseSearchActionResult> => {
  const result = await searchRaceCourseProfile(query);
  if (result.ok) {
    return { ok: true, profile: result.profile };
  }
  if (result.reason === 'not_found') {
    return {
      ok: false,
      code: 'NOT_FOUND',
      message:
        'No public route geometry matched that search in OpenStreetMap. Upload a GPX for this race.',
    };
  }
  return {
    ok: false,
    code: 'UNAVAILABLE',
    message:
      'Course lookup is temporarily unavailable. Upload a GPX file instead.',
  };
};
