import "server-only";

const SPOTIFY_AUTH_BASE = "https://accounts.spotify.com";
export const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

export const SPOTIFY_SCOPES = [
  "playlist-read-private",
  "playlist-read-collaborative",
  "playlist-modify-public",
  "playlist-modify-private",
] as const;

export { SPOTIFY_LOGIN_PATH } from "./paths";

export type SpotifyBootstrapConfig = {
  clientId: string;
  redirectUri: string;
  sessionSecret: string;
};

let cachedConfig: SpotifyBootstrapConfig | undefined;

/** Lazily read env so imports do not explode in edge analysis without env. */
export function getSpotifyConfig(): SpotifyBootstrapConfig {
  if (cachedConfig) return cachedConfig;
  const clientId = process.env.SPOTIFY_CLIENT_ID?.trim();
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI?.trim();
  const sessionSecret = process.env.PACELIST_SESSION_SECRET?.trim();

  const missing: string[] = [];
  if (!clientId) missing.push("SPOTIFY_CLIENT_ID");
  if (!redirectUri) missing.push("SPOTIFY_REDIRECT_URI");
  if (!sessionSecret) missing.push("PACELIST_SESSION_SECRET");
  if (!(clientId && redirectUri && sessionSecret)) {
    throw new Error(
      `[spotify] Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  cachedConfig = { clientId, redirectUri, sessionSecret };
  return cachedConfig;
}

export function buildAuthorizeURL(params: {
  state: string;
  codeChallenge: string;
}) {
  const { clientId, redirectUri } = getSpotifyConfig();
  const search = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    state: params.state,
    code_challenge_method: "S256",
    code_challenge: params.codeChallenge,
  });

  return `${SPOTIFY_AUTH_BASE}/authorize?${search.toString()}`;
}

export function buildTokenURL() {
  return `${SPOTIFY_AUTH_BASE}/api/token`;
}
