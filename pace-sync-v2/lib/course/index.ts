export {
  buildElevationChartSeries,
  distanceAtRaceFraction,
  plannedDistanceAtRaceFraction,
} from '@/lib/course/chart-series';
export type {
  ElevationChartPadding,
  ElevationChartSeries,
} from '@/lib/course/chart-series';
export {
  emitCourseProfileForPersistence,
  registerCourseProfilePersistenceSink,
} from '@/lib/course/course-profile-persistence';
export type { CourseProfilePersistenceSink } from '@/lib/course/course-profile-persistence';
export { haversineMeters } from '@/lib/course/geo';
export { parseGpx } from '@/lib/course/parse-gpx';
export type { ParseGpxResult } from '@/lib/course/parse-gpx';
export { searchRaceCourseProfile } from '@/lib/course/race-search';
export type { RaceCourseSearchResult } from '@/lib/course/race-search';
