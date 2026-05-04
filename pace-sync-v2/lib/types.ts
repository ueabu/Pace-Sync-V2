export type Track = {
  id: string;
  name: string;
  artists: string[];
  durationMs: number;
  albumArtUrl?: string;
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
