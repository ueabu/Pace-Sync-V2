import "server-only";
import { buildTokenURL, getSpotifyConfig } from "./config";

export type SpotifyRawTokenPayload = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type: string;
};

export async function postSpotifyTokenForm(
  body: Record<string, string>,
): Promise<SpotifyRawTokenPayload> {
  const encoded = new URLSearchParams(body);
  const authRes = await fetch(buildTokenURL(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: encoded.toString(),
  });

  const text = await authRes.text();
  if (!authRes.ok) {
    throw new Error(
      `[spotify] Token exchange failed HTTP ${authRes.status}: ${text.slice(0, 400)}`,
    );
  }
  return JSON.parse(text) as SpotifyRawTokenPayload;
}

export async function exchangeAuthorizationCode(payload: {
  code: string;
  codeVerifier: string;
}) {
  const { clientId, redirectUri } = getSpotifyConfig();
  return postSpotifyTokenForm({
    grant_type: "authorization_code",
    code: payload.code,
    redirect_uri: redirectUri,
    client_id: clientId,
    code_verifier: payload.codeVerifier,
  });
}

export async function refreshTokens(refreshToken: string) {
  const { clientId } = getSpotifyConfig();
  return postSpotifyTokenForm({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
  });
}
