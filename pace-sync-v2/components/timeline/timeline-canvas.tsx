"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { formatClock, parseFlexibleTimeToSeconds } from "@/lib/timeline/scale";
import { useTimelineEditor } from "@/hooks/useTimelineEditor";
import { TimelineAxis } from "@/components/timeline/timeline-axis";

const MIN_CANVAS_PX = 560;

const useScrollContainerWidth = () => {
  const observerRef = useRef<ResizeObserver | null>(null);
  const [widthPx, setWidthPx] = useState(MIN_CANVAS_PX);

  const scrollRef = useCallback((node: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    if (!node) return;

    const measure = () => {
      const w = node.getBoundingClientRect().width;
      setWidthPx((prev) => {
        const next = Math.max(MIN_CANVAS_PX, Math.round(w));
        return Math.abs(prev - next) > 1 ? next : prev;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    observerRef.current = ro;
  }, []);

  return { scrollRef, widthPx };
};

type SortableRowProps = {
  instanceId: string;
  raceSeconds: number;
  canvasWidthPx: number;
  title: string;
  subtitle: string;
  durationMs: number;
  startSeconds: number;
  anchorSeconds: number | null;
  onTogglePin: () => void;
  onClearPin: () => void;
  onAnchorEdit: (seconds: number | null) => void;
};

const SortableTrackRow = ({
  instanceId,
  raceSeconds,
  canvasWidthPx,
  title,
  subtitle,
  durationMs,
  startSeconds,
  anchorSeconds,
  onTogglePin,
  onClearPin,
  onAnchorEdit,
}: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: instanceId });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const durationSec = durationMs / 1000;
  const leftPct = raceSeconds > 0 ? (startSeconds / raceSeconds) * 100 : 0;
  const widthPct = raceSeconds > 0 ? (durationSec / raceSeconds) * 100 : 0;

  const isPinned = anchorSeconds !== null;

  const rowRing = isPinned
    ? "ring-2 ring-amber-500/70 dark:ring-amber-400/60"
    : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-2 border-b border-zinc-200 bg-background py-3 pl-3 pr-2 dark:border-zinc-800 sm:flex-row sm:items-stretch ${rowRing} rounded-lg`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="flex h-11 w-full shrink-0 touch-manipulation items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-zinc-50 text-zinc-700 active:bg-zinc-100 sm:h-auto sm:w-12 sm:flex-col dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <span className="text-lg leading-none text-zinc-400 select-none" aria-hidden>
          ⋮⋮
        </span>
        <span className="text-xs font-medium sm:hidden">Drag</span>
      </button>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onTogglePin}
          className="flex w-full flex-col items-start gap-0.5 rounded-lg px-1 py-1 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/80"
        >
          <span className="truncate font-medium text-foreground">{title}</span>
          <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</span>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            Starts at <span className="font-mono font-medium">{formatClock(startSeconds)}</span>
            {isPinned ? (
              <span className="ml-2 text-amber-700 dark:text-amber-400">Pinned</span>
            ) : null}
          </span>
        </button>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {isPinned ? (
            <>
              <label className="sr-only" htmlFor={`anchor-${instanceId}`}>
                Pin at race time
              </label>
              <input
                id={`anchor-${instanceId}`}
                key={`anchor-${instanceId}-${anchorSeconds}`}
                inputMode="numeric"
                className="h-9 w-[5.5rem] rounded-md border border-zinc-300 bg-background px-2 font-mono text-sm dark:border-zinc-600"
                defaultValue={formatClock(anchorSeconds ?? startSeconds)}
                onBlur={(e) => {
                  const parsed = parseFlexibleTimeToSeconds(e.currentTarget.value);
                  if (parsed !== null) {
                    onAnchorEdit(Math.min(raceSeconds, Math.max(0, parsed)));
                  } else {
                    e.currentTarget.value = formatClock(anchorSeconds ?? startSeconds);
                  }
                }}
              />
              <button
                type="button"
                onClick={onClearPin}
                className="text-xs text-zinc-500 underline dark:text-zinc-400"
              >
                Clear pin
              </button>
            </>
          ) : (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tap title to pin at this start time
            </p>
          )}
        </div>
      </div>

      <div
        className="min-w-0 shrink-0 overflow-x-auto sm:overflow-visible"
        style={{ maxWidth: "100%" }}
      >
        <div
          className="relative h-12 rounded-md bg-zinc-100 dark:bg-zinc-900"
          style={{ width: canvasWidthPx, minWidth: "100%" }}
        >
          <div
            className={`absolute top-1 bottom-1 rounded-md ${
              isPinned
                ? "bg-amber-400/90 dark:bg-amber-500/70"
                : "bg-zinc-400/80 dark:bg-zinc-500/70"
            }`}
            style={{
              left: `${leftPct}%`,
              width: `${Math.max(widthPct, 0.5)}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const TimelineCanvas = () => {
  const { snapshot, reorderSlots, toggleAnchorForSlot, setAnchorSeconds, racePlan } =
    useTimelineEditor();
  const { arrangement } = snapshot;

  const { scrollRef, widthPx: canvasWidthPx } = useScrollContainerWidth();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = useMemo(() => racePlan.slots.map((s) => s.instanceId), [racePlan.slots]);

  const startByInstance = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of arrangement.tracks) {
      m.set(t.instanceId, t.startSeconds);
    }
    return m;
  }, [arrangement.tracks]);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderSlots(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]"
      >
        <div className="inline-block min-w-full align-top">
          <TimelineAxis canvasWidthPx={canvasWidthPx} />
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {racePlan.slots.length === 0 ? (
                <p className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  No tracks yet. Search below to add songs.
                </p>
              ) : (
                racePlan.slots.map((slot) => {
                  const start = startByInstance.get(slot.instanceId) ?? 0;
                  return (
                    <SortableTrackRow
                      key={slot.instanceId}
                      instanceId={slot.instanceId}
                      raceSeconds={arrangement.raceDurationSeconds}
                      canvasWidthPx={canvasWidthPx}
                      title={slot.track.name}
                      subtitle={slot.track.artists.join(", ")}
                      durationMs={slot.track.durationMs}
                      startSeconds={start}
                      anchorSeconds={slot.anchorSeconds}
                      onTogglePin={() => {
                        toggleAnchorForSlot(slot.instanceId);
                      }}
                      onClearPin={() => {
                        setAnchorSeconds(slot.instanceId, null);
                      }}
                      onAnchorEdit={(sec) => {
                        setAnchorSeconds(slot.instanceId, sec);
                      }}
                    />
                  );
                })
              )}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
};
