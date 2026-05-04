# Spec: Course profile and elevation (optional)

## Overview

Runners can optionally attach a **course profile** — sampled points of cumulative distance and elevation — so an elevation chart can sit alongside the timeline and stay horizontally aligned with song blocks. The rest of Pacelist (playlist import, arrangement, sync) never depends on this data.

## User flow

1. From the editor shell, the runner expands optional course tools.
2. **Primary path**: upload a `.gpx` file. The app validates XML shape, extracts track points with elevations, and builds a cumulative-distance profile.
3. **Bonus path**: search by race name. The app tries one or two public APIs (OSM Nominatim for place context, Overpass for tagged route relations in the area). On any failure or empty match, show “course not found” and steer the user to GPX upload.
4. When a profile exists, an elevation chart appears above or below the timeline slot; horizontal position matches race fraction (time ÷ race duration equals distance ÷ planned distance under the constant-pace model).
5. Persistence saves/restores the profile in another workstream; this feature only exposes the profile through a typed registration hook.

## Technical approach

- **Types**: `CourseProfile` / `CourseProfilePoint` in `lib/types.ts` (`distanceMeters`, `elevationMeters` per sample; metadata optional).
- **Parsing**: `lib/course/parse-gpx.ts` — pure string parsing (no DOM required), validates presence of track points and elevations, Haversine increments for cumulative distance.
- **Chart**: `lib/course/chart-series.ts` builds normalized polyline points for SVG; `components/course/course-elevation-chart.tsx` renders SVG + gradient fill for readable hills, responsive height (`h-24` mobile, taller `sm+`).
- **Coordination**: `CourseProfileProvider` + `useCourseProfileOptional()` in `components/course/` so the timeline slot and chart share state without importing timeline source files. Chart receives `RacePlan` and `Arrangement` as typed props for axis alignment.
- **Persistence bridge**: `lib/course/course-profile-persistence.ts` exports `registerCourseProfilePersistenceSink` / `emitCourseProfileForPersistence`; no Supabase from this feature.
- **Race search**: Server action calls Nominatim then Overpass; merges geometry, simplifies vertices, batches OpenTopoData (`srtm90m`) for elevations. Any network/schema failure → structured “not found”.

## Data model

- **`CourseProfilePoint`**: `{ distanceMeters: number; elevationMeters: number }`
- **`CourseProfile`**: `{ points: CourseProfilePoint[]; totalDistanceMeters: number; source: 'gpx' | 'race_search'; name?: string }`

## Edge cases

- GPX missing `<ele>`, wrong extension, or fewer than two usable points → validation error message; no partial profile.
- GPX length differs from planned race distance → chart uses **race fraction** along the profile (`p * totalDistanceMeters`) so timeline alignment stays consistent with proportional pacing.
- Race search timeouts, rate limits, or no matching relation → not found + GPX CTA.
- No profile → chart hidden; arrangement engine and types unchanged.

## Out of scope

- Writing to Supabase or schema migrations.
- Editing timeline components owned by another workstream.
- BPM/cadence, turn-by-turn, or official certified course guarantees.

## Acceptance criteria

- [ ] Spec file present at `specs/005-course-profile.md`.
- [ ] `CourseProfile` types in `lib/types.ts`; arrangement module still imports only what it already did.
- [ ] GPX upload validates and produces a profile; failures are user-visible and non-blocking for the rest of the page.
- [ ] Elevation chart aligns horizontally with the same race-width container as the timeline slot (shared parent width / fraction mapping).
- [ ] Context (or equivalent) exposes optional profile without requiring consumers to import timeline internals.
- [ ] Persistence sink typed API exists; called when profile is set or cleared.
- [ ] Race search attempts public endpoints and degrades cleanly with GPX fallback messaging.
- [ ] `bun test` passes for GPX parsing unit tests.
