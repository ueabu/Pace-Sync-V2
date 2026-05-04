"use client";

import { useContext } from "react";
import {
  TimelineEditorContext,
  type TimelineEditorContextValue,
} from "@/components/timeline/timeline-context";

export const useTimelineEditor = (): TimelineEditorContextValue => {
  const ctx = useContext(TimelineEditorContext);
  if (!ctx) {
    throw new Error("useTimelineEditor must be used within TimelineEditorProvider");
  }
  return ctx;
};
