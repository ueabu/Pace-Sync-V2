# Timeline editor

## Overview

The timeline editor is Pacelist’s main canvas: users set race distance and goal time, see each Spotify track as a proportional block along the race, reorder with drag-and-drop, pin tracks to specific race moments, search Spotify to add songs, and read exact start times within the run. This spec covers the `/timeline` UI only; saving plans to Supabase is handled elsewhere.

## User flow

1. Open `/timeline` (or navigate from import later).
2. Edit distance, unit (km/mi), and target time in the top bar; the scale and axis update immediately.
3. Scan the horizontal timeline: each track is a block whose width is duration ÷ race length; the axis shows minutes and distance markers.
4. Drag the handle on a track row to reorder; on touch devices, the handle is large enough to drag comfortably.
5. Click a track to set or clear an anchor (pin) at a chosen second in the race; pinned rows look distinct and keep that start time when other tracks reorder (via the arrangement engine).
6. Type in search, review results, add a track to the list.
7. Read each row’s “starts at” time for the race.

## Technical approach

- **Route**: `app/timeline/page.tsx` (Server Component shell) renders a client `TimelineEditor` from `components/timeline/`.
- **State**: React state holds working `RacePlan` (distance, unit, target seconds, ordered slots with track + optional anchor). No Supabase in these components.
- **Exposure**: `TimelineEditorProvider` (client) exposes a typed `TimelineEditorSnapshot` via context for a future persistence layer (`useTimelineEditor()`).
- **Arrangement**: `lib/arrangement/computeArrangement()` returns each track’s `startSeconds` and duration. Until the full engine exists, a typed stub spaces starts evenly and applies anchor overrides, with a TODO to swap in the real engine.
- **Spotify search**: UI calls a **Server Action** that uses `lib/spotify/searchTracks()` (typed helper wrapping the Web API). Tokens remain server-side (placeholder session helper until auth exists).
- **DND**: `@dnd-kit/core` + `@dnd-kit/sortable` with `TouchSensor` / `PointerSensor` and activation constraints for touch-friendly handles.
- **Responsive**: Mobile-first Tailwind; timeline in a horizontally scrollable region (`overflow-x-auto`, `min-w-0`) so blocks stay readable; axis labels sized for small screens.

## Data model

- **`Track`** (`lib/types.ts`): `id`, `name`, `artists`, `durationMs`, optional `albumArtUrl`.
- **`TimelineSlot`**: `track: Track`, `anchorSeconds: number | null` (seconds from race start when pinned).
- **`RacePlan`**: `distanceValue`, `distanceUnit: 'km' | 'mi'`, `targetTimeSeconds`, `slots: TimelineSlot[]`.
- **`ArrangedTrack`**: `trackId`, `startSeconds`, `durationMs` (output of arrangement).
- **`TimelineEditorSnapshot`**: race plan + arranged tracks + derived race duration/distance for consumers.

No new database tables in this spec.

## Edge cases

- Empty track list: show empty state on the canvas; axis still reflects race length.
- Zero or invalid distance/time: clamp or validate inputs; avoid division by zero in scale helpers.
- Search with no token / API errors: return a typed error from the action; UI shows a short message, no raw Spotify payloads.
- Spotify rate limits: helper should respect `Retry-After` when implemented; action may return partial empty on failure.
- Very long playlists: horizontal scroll contains overflow; DnD works within the scroll container.
- Overlapping starts in stub engine: acceptable until the real engine resolves overlaps (TODO).

## Out of scope

- Persisting plans to Supabase, loading a saved plan, and auth UI.
- GPX, elevation, sync-to-Spotify.
- Replacing the stub arrangement with the full pacing engine (only integration hook + TODO here).

## Acceptance criteria

- [ ] `/timeline` renders the race bar, time/distance axis, proportional blocks, start-time readout, search/add, pin UI, and sortable list behavior.
- [ ] Race edits update the timeline and arrangement without a full page reload.
- [ ] Distance unit switches between km and mile markers on the axis.
- [ ] Arrangement start times come from `lib/arrangement` (stub or real), not duplicated timing math in components.
- [ ] Search uses `lib/spotify` only; no direct `fetch` to Spotify from components.
- [ ] No Supabase writes from the timeline feature.
- [ ] Layout works on narrow viewports with horizontal scroll and usable touch targets for drag handles.
- [ ] Current arrangement is available via typed context for later persistence wiring.
