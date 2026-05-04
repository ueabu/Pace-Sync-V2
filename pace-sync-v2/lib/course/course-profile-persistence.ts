import type { CourseProfile } from '@/lib/types';

export type CourseProfilePersistenceSink = (
  profile: CourseProfile | null,
) => void;

let sink: CourseProfilePersistenceSink | undefined;

export const registerCourseProfilePersistenceSink = (
  next: CourseProfilePersistenceSink | undefined,
): void => {
  sink = next;
};

export const emitCourseProfileForPersistence = (
  profile: CourseProfile | null,
): void => {
  sink?.(profile);
};
