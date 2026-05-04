'use client';

import { useState, useTransition, type FormEvent } from 'react';

import type { RaceCourseSearchActionResult } from '@/app/actions/race-course-search';
import { searchRaceCourseAction } from '@/app/actions/race-course-search';

import { useCourseProfileOptional } from '@/components/course/course-profile-context';

export const RaceNameSearch = () => {
  const { setCourseProfile } = useCourseProfileOptional();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const applyResult = (result: RaceCourseSearchActionResult) => {
    if (result.ok) {
      setMessage(null);
      setCourseProfile(result.profile);
      return;
    }
    setMessage(result.message);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 3) {
      setMessage('Enter at least three characters.');
      return;
    }
    startTransition(async () => {
      const result = await searchRaceCourseAction(q);
      applyResult(result);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Search race (OpenStreetMap)
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. city marathon"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-emerald-500/40 focus:border-emerald-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending ? 'Searching…' : 'Find course'}
        </button>
      </form>
      {message ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p>{message}</p>
          <p className="mt-1 font-medium">Upload a GPX for a precise elevation trace.</p>
        </div>
      ) : null}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Uses public OSM data only; many races are not mapped as routes. Results are
        approximate when found.
      </p>
    </div>
  );
};
