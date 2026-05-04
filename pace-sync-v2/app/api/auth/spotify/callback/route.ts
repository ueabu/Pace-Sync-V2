import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { exchangeAuthorizationCode } from "@/lib/spotify/oauth-token";
import {
  clearOAuthCookie,
  OAUTH_COOKIE,
  readOAuthCookie,
  setStoredSessionCookies,
} from "@/lib/spotify/session-cookies";
import { storedSessionFromTokenPayload } from "@/lib/spotify/session";

function redirectWithSpotifyError(request: NextRequest, code: string) {
  const url = new URL("/", request.url);
  url.searchParams.set("spotify_error", code);
  const res = NextResponse.redirect(url);
  clearOAuthCookie(res.cookies);
  return res;
}

export async function GET(request: NextRequest) {
  const homeUrl = new URL("/", request.url);

  const spError = request.nextUrl.searchParams.get("error");
  if (spError) {
    return redirectWithSpotifyError(request, spError);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return redirectWithSpotifyError(request, "missing_params");
  }

  const jar = await cookies();
  const oauthEnc = jar.get(OAUTH_COOKIE)?.value;
  const pending = readOAuthCookie(oauthEnc);

  if (!pending || pending.state !== state) {
    return redirectWithSpotifyError(request, "invalid_state");
  }

  let tokens;
  try {
    tokens = await exchangeAuthorizationCode({
      code,
      codeVerifier: pending.codeVerifier,
    });
  } catch {
    return redirectWithSpotifyError(request, "token_exchange_failed");
  }

  const res = NextResponse.redirect(homeUrl);
  clearOAuthCookie(res.cookies);
  setStoredSessionCookies(res.cookies, storedSessionFromTokenPayload(tokens));
  return res;
}
