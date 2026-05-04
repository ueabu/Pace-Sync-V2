# Spec: Pace and arrangement engine

## Overview

Pure TypeScript routines that turn a **race plan** (distance, target time, track order, anchor pins) into a **pace** (seconds per kilometre) and an **arrangement** (each track’s start time on the race clock). No I/O: callers supply `Track` rows and plans; the module returns numbers and structured results only.

## User flow

1. Runner sets distance and target finish time, orders tracks, and pins some tracks to moments in the race.
2. The app loads track durations from Spotify and calls `validatePlan` for early errors.
3. The app calls `computePace` for display and `computeArrangement` to build the timeline used by the editor and Spotify sync.

## Technical approach

- **Units**: time in **seconds**, distance in **meters**. Track duration comes from Spotify in ms and is converted to seconds via `durationMs / 1000`.
- **`computePace`**: \(\text{sec/km} = \text{targetTimeSeconds} / (\text{distanceMeters} / 1000)\). Reject non‑positive distance or non‑positive target time.
- **`validatePlan`**: Ensure every `trackId` exists, anchors are unique per track, numeric inputs are finite and sensible where required, total music duration is **at least** the race length (so the race can be “covered”), and **anchor targets** do not imply overlapping playback windows if every anchored track were placed at its target (pairwise interval overlap on \([T, T + duration)\)).
- **`computeArrangement`**: Enumerate playlist orders to minimize anchor time error.
  - Require `plan.trackIds` to list each track **at most once** (duplicate entries throw in `computeArrangement`).
  - For **≤ 8** tracks, try **every permutation** of `plan.trackIds` and pick the order with the smallest \(\sum |\text{actualStart} - \text{target}|\) over anchors (ties broken by lexicographically smaller id order).
  - For **> 8** tracks, only the plan order is evaluated (keeps runtime bounded; anchors may deviate).
  - Walk the chosen order: keep `nextStart` (end of the previous placed track). For each track: if anchored with target \(T\), `start = max(nextStart, T)`; else `start = nextStart`. Record `startSecond`, then `nextStart = start + duration`. Deviations are `actualStart - target` (never negative with this rule).
- **Determinism**: Same inputs always yield the same outputs; no randomness, no clocks.

## Data model

Types live in `lib/types.ts`:

- **`Track`**: `id`, `name`, `artists`, `durationMs` (Spotify ms; engine converts to seconds internally).
- **`Anchor`**: `trackId`, `targetSecond` (race seconds from start when that track **starts**).
- **`RacePlan`**: `distanceMeters`, `targetTimeSeconds`, `trackIds` (play order baseline), `anchors`.
- **`ArrangedTrack`**: `trackId`, `startSecond`, `durationSeconds`.
- **`AnchorDeviation`**: `trackId`, `targetSecond`, `actualStartSecond`, `deviationSeconds` (`actual - target`).
- **`Arrangement`**: `orderedTrackIds`, `tracks` (aligned with `orderedTrackIds`), `anchorDeviations`, `raceDurationSeconds`, `totalMusicDurationSeconds`.

## Edge cases

- Missing tracks, duplicate anchors, overlapping anchor intervals at targets → validation errors.
- Total music shorter than race → validation error.
- Total music longer than race → valid; last track may end after `raceDurationSeconds` (callers may trim or warn in UI; out of scope here).
- More than **eight** tracks in `plan.trackIds` → only the plan order is scored (see `computeArrangement`), which may leave positive anchor deviations even when a better order exists.
- `computePace` / `computeArrangement` throw on invalid numeric input (distance, time) so callers fail fast without silent `Infinity`/`NaN`.

## Out of scope

- UI, Spotify, Supabase, persistence.
- BPM/cadence, elevation, GPX.
- Splitting tracks or crossfades.

## Acceptance criteria

- [ ] `lib/types.ts` defines `RacePlan`, `Anchor`, `ArrangedTrack`, `AnchorDeviation`, `Arrangement`, and `Track` per glossary.
- [ ] `lib/arrangement/` exports `computePace`, `computeArrangement`, `validatePlan` only (via `index.ts`), no side effects.
- [ ] `validatePlan` returns structured errors for too‑short playlist and anchor conflicts / bad references as specified.
- [ ] `computeArrangement` hits exact anchor targets when some order allows; otherwise returns smallest achievable sum of absolute deviations among permutations tried (`n ≤ 8` exhaustive; plan order only when `n > 8`).
- [ ] `bun test lib/arrangement/arrangement.test.ts` passes for: no anchors; one anchor; multiple anchors; anchor timing fixed by reorder; forced deviation when `n > 8` (plan order only); duration shorter than race (validation); duration longer than race (arrangement still computed).
