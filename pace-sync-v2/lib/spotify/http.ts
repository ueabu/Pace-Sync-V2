import "server-only";
import { SpotifyRateLimitWaitingError } from "./errors";
import { SPOTIFY_API_BASE } from "./config";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(res: Response): number | null {
  const header = res.headers.get("retry-after");
  if (!header) return null;
  const asInt = Number.parseInt(header.trim(), 10);
  if (Number.isFinite(asInt)) return asInt * 1000;
  const parsed = Date.parse(header);
  if (!Number.isNaN(parsed)) return Math.max(0, parsed - Date.now());
  return null;
}

const RETRY_CEILING = 3;

export async function spotifyFetch(
  accessToken: string,
  pathLike: string,
  init?: RequestInit,
  retriesLeft = RETRY_CEILING,
): Promise<Response> {
  const normalized = pathLike.startsWith("http")
    ? pathLike
    : `${SPOTIFY_API_BASE}${pathLike}`;
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);

  const res = await fetch(normalized, { ...init, headers });

  if (res.status === 429 && retriesLeft > 0) {
    const wait = parseRetryAfterMs(res);
    const sleepMs =
      typeof wait === "number"
        ? Math.min(Math.max(wait, 500), 30_000)
        : 2_000;

    await sleep(sleepMs);
    return spotifyFetch(accessToken, pathLike, init, retriesLeft - 1);
  }

  return res;
}

export async function expectSpotifyJson<T>(
  accessToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await spotifyFetch(accessToken, path, init);
  if (res.status === 429) {
    const waitMs = parseRetryAfterMs(res) ?? 2_000;
    throw new SpotifyRateLimitWaitingError(waitMs, 429);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Spotify API ${path} → HTTP ${res.status}: ${text.slice(0, 400)}`,
    );
  }
  return res.json() as Promise<T>;
}
