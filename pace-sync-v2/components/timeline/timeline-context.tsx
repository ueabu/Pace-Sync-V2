"use client";

import { createContext, useMemo, useState, type ReactNode } from "react";
import { computeArrangement } from "@/lib/arrangement/computeArrangement";
import { createDefaultRacePlan, createTimelineSlotInstanceId } from "@/lib/timeline/defaultRacePlan";
import type { RacePlan, TimelineEditorSnapshot, TimelineSlot, Track } from "@/lib/types";

export { createDefaultRacePlan, createTimelineSlotInstanceId };

export type TimelineEditorContextValue = {
  racePlan: RacePlan;
  snapshot: TimelineEditorSnapshot;
  setDistanceValue: (value: number) => void;
  setDistanceUnit: (unit: RacePlan["distanceUnit"]) => void;
  setTargetTimeSeconds: (seconds: number) => void;
  reorderSlots: (slotIds: string[]) => void;
  toggleAnchorForSlot: (instanceId: string) => void;
  setAnchorSeconds: (instanceId: string, seconds: number | null) => void;
  addTrack: (track: Track) => void;
};

export const TimelineEditorContext = createContext<TimelineEditorContextValue | null>(null);

type ProviderProps = {
  children: ReactNode;
  initialRacePlan?: RacePlan;
};

export const TimelineEditorProvider = ({
  children,
  initialRacePlan = createDefaultRacePlan(),
}: ProviderProps) => {
  const [racePlan, setRacePlan] = useState<RacePlan>(initialRacePlan);

  const arrangement = useMemo(() => computeArrangement(racePlan), [racePlan]);

  const snapshot: TimelineEditorSnapshot = useMemo(
    () => ({ racePlan, arrangement }),
    [racePlan, arrangement],
  );

  const value: TimelineEditorContextValue = useMemo(
    () => ({
      racePlan,
      snapshot,
      setDistanceValue: (value) => {
        setRacePlan((prev) => ({ ...prev, distanceValue: value }));
      },
      setDistanceUnit: (unit) => {
        setRacePlan((prev) => ({ ...prev, distanceUnit: unit }));
      },
      setTargetTimeSeconds: (seconds) => {
        setRacePlan((prev) => ({
          ...prev,
          targetTimeSeconds: Math.max(1, Math.floor(seconds)),
        }));
      },
      reorderSlots: (slotIds) => {
        setRacePlan((prev) => {
          const byId = new Map(prev.slots.map((s) => [s.instanceId, s]));
          const next: TimelineSlot[] = [];
          for (const id of slotIds) {
            const slot = byId.get(id);
            if (slot) next.push(slot);
          }
          for (const s of prev.slots) {
            if (!slotIds.includes(s.instanceId)) next.push(s);
          }
          return { ...prev, slots: next };
        });
      },
      toggleAnchorForSlot: (instanceId) => {
        setRacePlan((prev) => {
          const byArranged = new Map(
            computeArrangement(prev).tracks.map((t) => [t.instanceId, t.startSeconds]),
          );
          return {
            ...prev,
            slots: prev.slots.map((s) => {
              if (s.instanceId !== instanceId) return s;
              if (s.anchorSeconds !== null) {
                return { ...s, anchorSeconds: null };
              }
              const at = byArranged.get(instanceId) ?? 0;
              return { ...s, anchorSeconds: Math.max(0, at) };
            }),
          };
        });
      },
      setAnchorSeconds: (instanceId, seconds) => {
        setRacePlan((prev) => ({
          ...prev,
          slots: prev.slots.map((s) =>
            s.instanceId === instanceId
              ? { ...s, anchorSeconds: seconds === null ? null : Math.max(0, seconds) }
              : s,
          ),
        }));
      },
      addTrack: (track) => {
        setRacePlan((prev) => ({
          ...prev,
          slots: [
            ...prev.slots,
            { instanceId: createTimelineSlotInstanceId(), track, anchorSeconds: null },
          ],
        }));
      },
    }),
    [racePlan, snapshot],
  );

  return (
    <TimelineEditorContext.Provider value={value}>{children}</TimelineEditorContext.Provider>
  );
};
