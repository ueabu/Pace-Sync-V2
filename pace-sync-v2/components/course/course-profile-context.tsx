'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { CourseProfile } from '@/lib/types';

import { emitCourseProfileForPersistence } from '@/lib/course/course-profile-persistence';

type CourseProfileContextValue = {
  courseProfile: CourseProfile | null;
  setCourseProfile: (next: CourseProfile | null) => void;
};

const CourseProfileContext = createContext<CourseProfileContextValue | null>(
  null,
);

export const CourseProfileProvider = ({ children }: { children: ReactNode }) => {
  const [courseProfile, setCourseProfileState] = useState<CourseProfile | null>(
    null,
  );

  const setCourseProfile = useCallback((next: CourseProfile | null) => {
    setCourseProfileState(next);
    emitCourseProfileForPersistence(next);
  }, []);

  const value = useMemo(
    () => ({ courseProfile, setCourseProfile }),
    [courseProfile, setCourseProfile],
  );

  return (
    <CourseProfileContext.Provider value={value}>
      {children}
    </CourseProfileContext.Provider>
  );
};

export const useCourseProfileOptional = (): CourseProfileContextValue => {
  const ctx = useContext(CourseProfileContext);
  if (!ctx) {
    throw new Error(
      'useCourseProfileOptional must be used within CourseProfileProvider',
    );
  }
  return ctx;
};
