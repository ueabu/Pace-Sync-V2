/**
 * Spotify-backed song used across Pacelist timelines and planners.
 */
export type Track = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  albumArtUrl?: string;
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
  /** First cover image from Spotify listing, when present. */
  coverUrl?: string;
};

export type DistanceUnit = 'km' | 'mi';

export type TimelineSlot = {
  instanceId: string;
  track: Track;
  anchorSeconds: number | null;
};

/** Timeline editor model: ordered slots with optional per-slot anchors. */
export type TimelineRacePlan = {
  distanceValue: number;
  distanceUnit: DistanceUnit;
  targetTimeSeconds: number;
  slots: TimelineSlot[];
};

/** Layout row for the timeline UI (playback order with instance identity). */
export type TimelineArrangedTrack = {
  trackId: string;
  instanceId: string;
  startSeconds: number;
  durationMs: number;
};

export type ArrangementResult = {
  raceDurationSeconds: number;
  tracks: TimelineArrangedTrack[];
};

export type TimelineEditorSnapshot = {
  racePlan: TimelineRacePlan;
  arrangement: ArrangementResult;
};

/** Pin for the pure arrangement engine ({@link computeArrangement} in `lib/arrangement`). */
export type Anchor = {
  trackId: string;
  targetSecond: number;
};

/** Engine race plan: metric distance, explicit track order, anchors. See PROJECT.md glossary. */
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
