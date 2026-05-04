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

export type DistanceUnit = "km" | "mi";

export type TimelineSlot = {
  instanceId: string;
  track: Track;
  anchorSeconds: number | null;
};

export type RacePlan = {
  distanceValue: number;
  distanceUnit: DistanceUnit;
  targetTimeSeconds: number;
  slots: TimelineSlot[];
};

export type ArrangedTrack = {
  trackId: string;
  instanceId: string;
  startSeconds: number;
  durationMs: number;
};

export type ArrangementResult = {
  raceDurationSeconds: number;
  tracks: ArrangedTrack[];
};

export type TimelineEditorSnapshot = {
  racePlan: RacePlan;
  arrangement: ArrangementResult;
};
