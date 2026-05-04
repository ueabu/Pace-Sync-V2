"use client";

import { useEffect, useState } from "react";
import { searchTracksAction } from "@/app/timeline/actions";
import type { Track } from "@/lib/types";
import { useTimelineEditor } from "@/hooks/useTimelineEditor";

export const TrackSearch = () => {
  const { addTrack } = useTimelineEditor();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const trimmed = q.trim();
  const showResults = trimmed.length >= 2;

  useEffect(() => {
    if (!showResults) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      void (async () => {
        setIsSearching(true);
        const res = await searchTracksAction(trimmed);
        if (cancelled) return;
        setIsSearching(false);
        if (!res.ok) {
          setResults([]);
          setError(res.message);
          return;
        }
        setError(null);
        setResults(res.tracks);
      })();
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [showResults, trimmed]);

  return (
    <section className="border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
      <h2 className="text-sm font-semibold text-foreground">Add a track</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Search Spotify (server action). Connect Spotify in a future step to load live results.
      </p>
      <input
        type="search"
        autoComplete="off"
        placeholder="Search songs…"
        className="mt-3 h-11 w-full rounded-lg border border-zinc-300 bg-background px-3 text-base dark:border-zinc-600"
        value={q}
        onChange={(e) => {
          const v = e.target.value;
          setQ(v);
          if (v.trim().length < 2) {
            setResults([]);
            setError(null);
            setIsSearching(false);
          }
        }}
      />
      {error && showResults ? (
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-300" role="status">
          {error}
        </p>
      ) : null}
      <ul className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
        {isSearching && showResults ? (
          <li className="text-sm text-zinc-500">Searching…</li>
        ) : null}
        {(showResults ? results : []).map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{t.name}</p>
              <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                {t.artists.join(", ")}
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 touch-manipulation rounded-full bg-foreground px-3 py-2 text-sm font-medium text-background"
              onClick={() => {
                addTrack(t);
              }}
            >
              Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
