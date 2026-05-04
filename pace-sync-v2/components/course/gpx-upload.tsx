'use client';

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';

import { parseGpx } from '@/lib/course/parse-gpx';

import { useCourseProfileOptional } from '@/components/course/course-profile-context';

export const GpxUpload = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setCourseProfile } = useCourseProfileOptional();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = useCallback(
    async (file: File | undefined) => {
      setError(null);
      if (!file) {
        return;
      }

      if (!file.name.toLowerCase().endsWith('.gpx')) {
        setError('Choose a file ending in .gpx');
        return;
      }

      setBusy(true);
      try {
        const text = await file.text();
        const parsed = parseGpx(text, {
          name: file.name.replace(/\.gpx$/i, ''),
        });
        if (!parsed.ok) {
          setError(parsed.error);
          return;
        }
        setCourseProfile(parsed.profile);
      } finally {
        setBusy(false);
      }
    },
    [setCourseProfile],
  );

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    void onFile(f);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".gpx,application/gpx+xml"
        className="sr-only"
        onChange={onChange}
      />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
        >
          {busy ? 'Reading…' : 'Upload GPX'}
        </button>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Track points need elevation tags.
        </span>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};
