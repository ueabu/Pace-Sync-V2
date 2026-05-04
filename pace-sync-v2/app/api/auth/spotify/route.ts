import { NextResponse } from "next/server";
import { buildAuthorizeURL, getSpotifyConfig } from "@/lib/spotify/config";
import { createPkceChallengePair, randomOAuthState } from "@/lib/spotify/pkce";
import { setOAuthCookie } from "@/lib/spotify/session-cookies";

export async function GET() {
  try {
    getSpotifyConfig();
  } catch (e) {
    const message = e instanceof Error ? e.message : "Spotify env misconfigured";
    return new NextResponse(message, { status: 500 });
  }

  const state = randomOAuthState();
  const { codeChallenge, codeVerifier } = await createPkceChallengePair();
  const url = buildAuthorizeURL({ state, codeChallenge });

  const res = NextResponse.redirect(url);
  setOAuthCookie(res.cookies, { state, codeVerifier });
  return res;
}
