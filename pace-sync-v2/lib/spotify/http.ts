import { SpotifyApiError } from "./error";

function resolveUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `https://api.spotify.com/v1${path}`;
}

export async function spotifyFetchJson<T>(
  accessToken: string,
  pathOrUrl: string,
  init?: RequestInit,
): Promise<T> {
  const url = resolveUrl(pathOrUrl);
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const res = await fetch(url, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!res.ok) {
    throw new SpotifyApiError(
      `Spotify API error (${res.status})`,
      res.status,
      text,
    );
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
