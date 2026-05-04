import type { TimelineRacePlan, Track } from "@/lib/types";

const demoTrack = (
  partial: Partial<Track> & Pick<Track, "id" | "name" | "durationMs">,
): Track => ({
  artists: partial.artists ?? ["Demo Artist"],
  albumArtUrl: partial.albumArtUrl,
  ...partial,
});

const createInstanceId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `slot-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

export const createTimelineSlotInstanceId = createInstanceId;

/** Demo arrangement when no playlist is loaded (e.g. future direct /timeline entry). */
export const createDefaultRacePlan = (): TimelineRacePlan => ({
  distanceValue: 10,
  distanceUnit: 'km',
  targetTimeSeconds: 60 * 55,
  slots: [
    {
      instanceId: createInstanceId(),
      track: demoTrack({
        id: "demo-1",
        name: "Opening stride",
        durationMs: 180_000,
      }),
      anchorSeconds: null,
    },
    {
      instanceId: createInstanceId(),
      track: demoTrack({
        id: "demo-2",
        name: "Mid-race groove",
        durationMs: 240_000,
      }),
      anchorSeconds: null,
    },
    {
      instanceId: createInstanceId(),
      track: demoTrack({
        id: "demo-3",
        name: "Finish push",
        durationMs: 200_000,
      }),
      anchorSeconds: null,
    },
  ],
});
