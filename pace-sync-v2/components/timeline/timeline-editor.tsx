"use client";

import { RaceDetailsBar } from "@/components/timeline/race-details-bar";
import { TimelineCanvas } from "@/components/timeline/timeline-canvas";
import { TimelineEditorProvider } from "@/components/timeline/timeline-context";
import { TrackSearch } from "@/components/timeline/track-search";
import type { RacePlan } from "@/lib/types";

type Props = {
  initialRacePlan?: RacePlan;
};

export const TimelineEditor = ({ initialRacePlan }: Props) => {
  return (
    <TimelineEditorProvider initialRacePlan={initialRacePlan}>
      <div className="flex min-h-0 flex-1 flex-col bg-background">
        <RaceDetailsBar />
        <TimelineCanvas />
        <TrackSearch />
      </div>
    </TimelineEditorProvider>
  );
};
