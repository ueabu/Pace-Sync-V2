import type { ArrangementResult, TimelineRacePlan } from "@/lib/types";

/**
 * Computes each track's start time within the race from the current plan.
 *
 * TODO: Replace this stub with the full pacelist arrangement engine (anchoring,
 * pacing, overlaps). This placeholder spaces starts evenly across the race and
 * honors explicit anchor seconds when set.
 */
export const computeArrangement = (plan: TimelineRacePlan): ArrangementResult => {
  const { targetTimeSeconds, slots } = plan;
  const raceDurationSeconds = Math.max(1, Math.floor(targetTimeSeconds));
  const n = slots.length;

  const tracks = slots.map((slot, index) => {
    const evenStart =
      n === 0 ? 0 : ((index + 1) / (n + 1)) * raceDurationSeconds;

    const anchorStart =
      slot.anchorSeconds === null
        ? null
        : Math.max(0, Math.min(raceDurationSeconds, slot.anchorSeconds));

    const startSeconds = anchorStart ?? evenStart;

    return {
      trackId: slot.track.id,
      instanceId: slot.instanceId,
      startSeconds,
      durationMs: slot.track.durationMs,
    };
  });

  return {
    raceDurationSeconds,
    tracks,
  };
};
