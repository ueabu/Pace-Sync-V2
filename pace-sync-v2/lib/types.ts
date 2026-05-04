/**
 * Spotify-backed song used across Pacelist timelines and planners.
 */
export type Track = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
};

/** A user's playlist from Spotify listings (import / picker workstreams). */
export type PlaylistSummary = {
  id: string;
  name: string;
  uri: string;
  snapshotId: string;
  isPublic: boolean;
  collaborative: boolean;
  totalTracks: number;
  href?: string;
};

export type Anchor = {
  trackId: string;
  targetSecond: number;
};

export type RacePlan = {
  distanceMeters: number;
  targetTimeSeconds: number;
  trackIds: string[];
  anchors: Anchor[];
};

export type ArrangedTrack = {
  trackId: string;
  startSecond: number;
  durationSeconds: number;
};

export type AnchorDeviation = {
  trackId: string;
  targetSecond: number;
  actualStartSecond: number;
  deviationSeconds: number;
};

export type Arrangement = {
  orderedTrackIds: string[];
  tracks: ArrangedTrack[];
  anchorDeviations: AnchorDeviation[];
  raceDurationSeconds: number;
  totalMusicDurationSeconds: number;
};

export type PlanValidationError = {
  code:
    | 'DISTANCE_NON_POSITIVE'
    | 'TARGET_TIME_NON_POSITIVE'
    | 'UNKNOWN_TRACK_ID'
    | 'ANCHOR_UNKNOWN_TRACK'
    | 'DUPLICATE_ANCHOR_TRACK'
    | 'ANCHOR_INTERVAL_OVERLAP'
    | 'ANCHOR_NOT_IN_PLAN'
    | 'TOTAL_MUSIC_SHORTER_THAN_RACE'
    | 'EMPTY_TRACK_LIST';
  message: string;
  details?: Record<string, string | number>;
};

export type CourseProfileSource = 'gpx' | 'race_search';

export type CourseProfilePoint = {
  distanceMeters: number;
  elevationMeters: number;
};

export type CourseProfile = {
  points: CourseProfilePoint[];
  totalDistanceMeters: number;
  source: CourseProfileSource;
  name?: string;
};
