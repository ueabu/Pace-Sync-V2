# Spec: App shell and Spotify sync flow (Pacelist)

## Overview

Pacelist’s authenticated shell connects the landing experience, playlist import, and the timeline editor entry point. This work defines routes, layout, server‑read auth, Spotify data access via `lib/spotify/` only, and a **sync** modal that writes the current track order back to Spotify (new playlist or replace imported playlist). The timeline **canvas** is out of scope and remains owned by another workstream.

## User flow

1. **Landing (`/`)** — Short headline, one sentence on value, **Connect Spotify** button that navigates to the OAuth **start** URL provided by the auth workstream (`NEXT_PUBLIC_SPOTIFY_OAUTH_START`, default `/api/auth/spotify/start`).
2. **Playlists (`/playlists`)** — After login, user sees their Spotify playlists: name, cover image, track count. Choosing one routes to **`/timeline`** with query params carrying the Spotify playlist id, display name, and track count for previews.
3. **App shell** — Global header: Pacelist wordmark, **Log out** when a server‑readable session exists. Consistent padding and max width, **mobile first** (readable type, stacked actions on small screens).
4. **Timeline (`/timeline`)** — No canvas implementation here; a minimal placeholder explains the editor is loading elsewhere. A **Sync to Spotify** control opens the sync modal.
5. **Sync modal** — Two modes:
   - **New playlist**: user enters a name; on confirm, create a playlist and populate it with the ordered track URIs for the current arrangement.
   - **Replace imported**: confirm replacing tracks in the playlist the user imported from; on confirm, replace items with the new arrangement.
6. **Preview / confirm** — Copy such as: “This will replace 23 tracks in ‘Marathon Mix’ with your new arrangement” (counts and names come from known playlist metadata and the current URI list length).
7. **Success** — Toast (or inline success) plus a link to open the target playlist in Spotify.

## Auth and redirects

- **Session** is read on the **server** (`getSession()` in `lib/auth/session.ts`) from an HTTP‑only cookie **`pacelist_session`** set by the OAuth workstream. Documented shape:

```json
{
  "accessToken": "<Spotify access token>",
  "user": { "id": "<Spotify user id>", "display_name": "Optional" }
}
```

- **Cookie size**: long‑lived tokens can exceed browser cookie limits; production should use a session id + server store. This spec assumes the auth workstream aligns on storage; the app only depends on `getSession()` returning `null` or a typed session.
- **Protected routes**: `/playlists` and `/timeline` use a **layout** that calls `getSession()` and **`redirect('/')`** if unauthenticated.

- **Server sync endpoint** — `POST /api/sync-playlist` reads the session, validates `trackUris`, and calls `createPlaylistWithTracks` or `replacePlaylistTracks` in `lib/spotify/`. The modal never handles access tokens directly.

## Spotify integration

- **All** Spotify HTTP calls go through **`lib/spotify/`** (typed helpers, centralized errors). App Router pages and route handlers pass **`session.accessToken`** into those helpers; components do not call `api.spotify.com` directly.
- **`createPlaylistWithTracks`** and **`replacePlaylistTracks`** (or equivalents) live here. If another workstream lands overlapping implementations, merge into a single module and re‑export.

## Visual and UI

- **Style**: Minimal, light background, near‑black type, **one accent** for primary actions (CTAs, links). Typography hierarchy over decoration. Landing tone: **runner’s tool** — direct, functional.
- **Components**: shadcn/ui‑style primitives (**Button**, **Dialog**, **Input**, **Label**) plus **Sonner** for toasts. Tailwind v4, **mobile first**.

## Out of scope

- Timeline canvas, drag‑drop, anchors, race inputs, persistence.
- OAuth implementation (except documenting contract and a **logout** route that clears `pacelist_session` if present).
- GPX, search, arrangement engine UI.

## Acceptance criteria

- [ ] `/` matches landing copy and Connect Spotify behaviour.
- [ ] `/playlists` lists playlists with image, name, count; links into `/timeline` with needed query params; unauthenticated users redirect to `/`.
- [ ] `/timeline` is protected, shows placeholder workspace, exposes sync; unauthenticated users redirect to `/`.
- [ ] Global shell: logo + conditional logout; responsive at phone widths.
- [ ] Sync modal: new vs replace, preview, confirm, success with Spotify link + toast.
- [ ] No direct Spotify fetches outside `lib/spotify/`.
- [ ] `specs/004-app-shell-and-sync.md` documents behaviour and auth contract.
