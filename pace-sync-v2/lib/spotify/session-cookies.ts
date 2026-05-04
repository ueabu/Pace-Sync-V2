import "server-only";
import { getSpotifyConfig } from "./config";
import { decryptPayload, encryptPayload } from "./crypto";

/** Cookie jar compatible with Next.js `cookies()` / `NextResponse`. */
export type CookieJar = {
  set(
    name: string,
    value: string,
    options?: {
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "strict" | "lax" | "none";
      path?: string;
      maxAge?: number;
      expires?: Date;
    },
  ): void;
};

/** Pending OAuth handshake (encrypted). */
export const OAUTH_COOKIE = "pacelist_sp_oauth";
/** Persisted Spotify session (encrypted). */
export const SESSION_COOKIE = "pacelist_sp_session";

const MS_SKEW = 60_000;

export type OAuthPendingCookie = {
  codeVerifier: string;
  state: string;
};

export type SpotifyStoredSession = {
  accessToken: string;
  refreshToken: string;
  /** Unix milliseconds when the access token is no longer valid. */
  expiresAtMs: number;
};

function secureCookieDefaults() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setOAuthCookie(cookieJar: CookieJar, pending: OAuthPendingCookie) {
  const { sessionSecret } = getSpotifyConfig();
  cookieJar.set(OAUTH_COOKIE, encryptPayload(sessionSecret, pending), {
    ...secureCookieDefaults(),
    maxAge: 60 * 10,
  });
}

export function readOAuthCookie(
  encrypted: string | undefined,
): OAuthPendingCookie | null {
  if (!encrypted) return null;
  try {
    const { sessionSecret } = getSpotifyConfig();
    return decryptPayload<OAuthPendingCookie>(sessionSecret, encrypted);
  } catch {
    return null;
  }
}

export function clearOAuthCookie(cookieJar: CookieJar) {
  cookieJar.set(OAUTH_COOKIE, "", {
    ...secureCookieDefaults(),
    maxAge: 0,
  });
}

export function setStoredSessionCookies(
  cookieJar: CookieJar,
  session: SpotifyStoredSession,
) {
  const { sessionSecret } = getSpotifyConfig();
  cookieJar.set(SESSION_COOKIE, encryptPayload(sessionSecret, session), {
    ...secureCookieDefaults(),
    maxAge: 60 * 60 * 24 * 400,
    // Spotify refresh tokens are long-lived; cookie rolls forward on refresh.
  });
}

export function readStoredSession(encrypted?: string): SpotifyStoredSession | null {
  if (!encrypted) return null;
  try {
    const { sessionSecret } = getSpotifyConfig();
    return decryptPayload<SpotifyStoredSession>(sessionSecret, encrypted);
  } catch {
    return null;
  }
}

export function clearSessionCookie(cookieJar: CookieJar) {
  cookieJar.set(SESSION_COOKIE, "", {
    ...secureCookieDefaults(),
    maxAge: 0,
  });
}

/** True when refresh is needed before outbound API calls. */
export function shouldRefreshStoredSession(session: SpotifyStoredSession): boolean {
  return Date.now() + MS_SKEW >= session.expiresAtMs;
}
