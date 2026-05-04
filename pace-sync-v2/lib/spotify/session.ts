import "server-only";
import { cookies } from "next/headers";
import { SpotifyAuthRequiredError } from "./errors";
import { refreshTokens } from "./oauth-token";
import {
  readStoredSession,
  SESSION_COOKIE,
  setStoredSessionCookies,
  shouldRefreshStoredSession,
  type SpotifyStoredSession,
  clearSessionCookie,
  clearOAuthCookie,
  type CookieJar,
} from "./session-cookies";
import type { SpotifyRawTokenPayload } from "./oauth-token";

function nowPlusExpiresMs(seconds: number) {
  return Date.now() + seconds * 1000;
}

function mergeStoredSession(
  prior: SpotifyStoredSession | null | undefined,
  raw: SpotifyRawTokenPayload,
): SpotifyStoredSession {
  const refresh =
    raw.refresh_token?.trim() || prior?.refreshToken?.trim();
  if (!refresh) {
    throw new Error("[spotify] Spotify did not provide a usable refresh_token");
  }
  return {
    accessToken: raw.access_token,
    refreshToken: refresh,
    expiresAtMs: nowPlusExpiresMs(raw.expires_in),
  };
}

export function storedSessionFromTokenPayload(
  raw: SpotifyRawTokenPayload,
  priorSession?: SpotifyStoredSession | null,
): SpotifyStoredSession {
  return mergeStoredSession(priorSession ?? undefined, raw);
}

/**
 * Loads Spotify session from httpOnly cookie, refreshes access token near expiry,
 * and persists rotations back onto the Next.js cookie store.
 */
export async function ensureFreshSpotifySession(): Promise<SpotifyStoredSession> {
  const jar = await cookies();
  const enc = jar.get(SESSION_COOKIE)?.value;
  let session = readStoredSession(enc);
  if (!session) throw new SpotifyAuthRequiredError();

  if (!shouldRefreshStoredSession(session)) {
    return session;
  }

  try {
    const raw = await refreshTokens(session.refreshToken);
    session = mergeStoredSession(session, raw);
    setStoredSessionCookies(jar, session);
    return session;
  } catch {
    clearSessionCookie(jar);
    throw new SpotifyAuthRequiredError(
      "Pacelist Spotify session expired; reconnect required",
    );
  }
}

export async function getSpotifyAccessToken(): Promise<string> {
  const s = await ensureFreshSpotifySession();
  return s.accessToken;
}

export function revokeSpotifySessionJar(cookieJar: CookieJar) {
  clearSessionCookie(cookieJar);
}

export function revokeAllSpotifyCookiesJar(cookieJar: CookieJar) {
  clearSessionCookie(cookieJar);
  clearOAuthCookie(cookieJar);
}

export async function hasSpotifySessionCookie(): Promise<boolean> {
  const jar = await cookies();
  const enc = jar.get(SESSION_COOKIE)?.value;
  const session = readStoredSession(enc);
  return !!session?.accessToken?.trim();
}
