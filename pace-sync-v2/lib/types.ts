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
