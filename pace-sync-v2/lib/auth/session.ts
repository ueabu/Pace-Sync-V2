import { hasSpotifySessionCookie } from "@/lib/spotify/session";

/**
 * Returns true when the httpOnly Spotify session cookie is present and readable.
 * Call sites that need an access token should use `getSpotifyAccessToken()` from
 * `@/lib/spotify/session` (or helpers in `@/lib/spotify/api`) so tokens refresh.
 */
export async function isLoggedIn(): Promise<boolean> {
  return hasSpotifySessionCookie();
}
