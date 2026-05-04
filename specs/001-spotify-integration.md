# Spec 001: Spotify integration (Pacelist)

## Goals

Pacelist integrates with Spotify for playlist import, search, and write-back without building UI in this workstream. The stack is Next.js App Router (Bun), server-only Spotify Web API usage, OAuth 2.0 Authorization Code with PKCE (public client semantics: no client secret).

## OAuth and session

### Flow

1. User hits `GET /api/auth/spotify` (exact path used as `redirect_uri` in Spotify Developer Dashboard).
2. Server generates `state` (CSRF), PKCE `code_verifier`, and `code_challenge` (S256). The pending payload `{ state, code_verifier }` is stored in a short-lived **httpOnly** cookie `pacelist_sp_oauth`, encrypted with `PACELIST_SESSION_SECRET`, `SameSite=Lax`, `Path=/`.
3. Browser redirects to `https://accounts.spotify.com/authorize` with query params including `response_type=code`, `client_id`, `redirect_uri`, `scope`, `state`, `code_challenge_method=S256`, `code_challenge`.
4. Spotify redirects to `GET /api/auth/spotify/callback?code=&state=` (or error).
5. Callback validates `state` against decrypted pending cookie; exchanges `code` for tokens via `POST /api/token` with `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`.
6. Tokens are persisted in **`pacelist_sp_session`**, **httpOnly**, encrypted payload: `{ accessToken, refreshToken, expiresAtUnixMs }`. Pending oauth cookie cleared.
7. User is redirected to `/` with `302`.

### Refresh

Before any Spotify Web API call, if `expiresAtUnixMs <= now + 60s` skew buffer, refresh using `grant_type=refresh_token`, `refresh_token`, `client_id`. Update encrypted session cookie. If refresh fails (revoked/expired tokens), session cookie cleared and callers receive a typed “not authenticated” error suitable for redirects to `GET /api/auth/spotify`.

### Sign out

`POST /api/auth/spotify/logout` clears `pacelist_sp_session` (and defensively clears pending oauth cookie).

## Scopes

Required for MVP backend:

- `playlist-read-private`
- `playlist-read-collaborative`
- `playlist-modify-public`
- `playlist-modify-private`

## Environment

| Variable | Purpose |
|---------|---------|
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_REDIRECT_URI` | Must equal callback URL configured in Spotify (e.g. `http://127.0.0.1:3000/api/auth/spotify/callback` for HTTP localhost, or HTTPS URL matching `next dev --experimental-https`) |
| `PACELIST_SESSION_SECRET` | Long random secret; used to derive key for AES-256-GCM encryption of oauth pending + token cookies |

Documented in `.env.local.example`.

## Rate limits (429)

Web API wrapped in a single HTTP helper that respects `Retry-After` when status is `429`: parse numeric seconds when present (otherwise small default backoff); retry capped (e.g. 3 retries) with jitter optional (simple fixed delay acceptable).

## Domain mapping

Responses map to **`Track`** in `lib/types.ts`:

- `id` ← Spotify track `id`
- `name` ← `name`
- `artists` ← `artists[].name`
- `durationMs` ← `duration_ms`

Optional **`PlaylistSummary`** (or equivalent) holds playlist ids and names returned by playlist listing for use by UI workstream.

## Public API surface (no UI here)

### Routes

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/auth/spotify` | Starts OAuth redirect |
| GET | `/api/auth/spotify/callback` | Finishes OAuth, sets cookies |
| POST | `/api/auth/spotify/logout` | Clears Spotify session |

### Server actions (`lib/spotify/actions.ts`)

Typed server actions callable from future client UI use `cookies()` internally:

- `getUserPlaylists(opts?)`
- `getPlaylistTracks(playlistId, opts?)`
- `searchTracks(query, opts?)`
- `createPlaylist(name, opts?)`
- `replacePlaylistTracks(playlistId, tracksOrUris)`  
- `spotifyLogout()` convenience (same as logout route)
- Helpers for auth state (`isSpotifyConnected`, redirect path constants as needed)

### Core modules (`lib/spotify/`)

- Config / env parsing (server-only)
- PKCE + encrypted cookie codecs
- Token refresh + authenticated fetch wrapper
- Playlist/track/search/create/replace implementations with **typed** outputs

## Spotify track limitations

- Playlist items may have `track: null` (removed/unavailable entries); omitted from `Track[]` results.
- `replacePlaylistTracks` batches URIs respecting Spotify limits (chunks of Spotify URI strings).

## Local development

Package script runs Next with Bun + `--experimental-https`. **`SPOTIFY_REDIRECT_URI` in Spotify Dashboard** must exactly match dev URL scheme/host/port/path (often `https://localhost:3000/...` or `https://127.0.0.1:3000/...` when using experimental HTTPS).

## Non-goals (this iteration)

- UI (login button, playlist picker).
- Spotify client secret confidential flow.
- Persisting playlists or plans in Postgres/Supabase (separate persistence workstream).
