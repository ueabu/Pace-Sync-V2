import type { Track } from "@/lib/types";
import type { SpotifyApiTrack, SpotifySearchTracksResponse } from "@/lib/spotify/types";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const mapApiTrackToDomain = (item: SpotifyApiTrack): Track => ({
  id: item.id,
  name: item.name,
  artists: item.artists.map((a) => a.name),
  durationMs: item.duration_ms,
  albumArtUrl: item.album.images[0]?.url,
});

export type SearchTracksResult =
  | { ok: true; tracks: Track[] }
  | { ok: false; error: "NO_TOKEN" | "HTTP_ERROR" | "INVALID_RESPONSE"; message: string };

export const searchTracks = async (
  query: string,
  accessToken: string,
  limit = 12,
): Promise<SearchTracksResult> => {
  const trimmed = query.trim();
  if (!trimmed) {
    return { ok: true, tracks: [] };
  }

  const params = new URLSearchParams({
    q: trimmed,
    type: "track",
    limit: String(Math.min(50, Math.max(1, limit))),
  });

  const res = await fetch(`${SPOTIFY_API_BASE}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get("Retry-After");
    const seconds = retryAfter ? Number.parseInt(retryAfter, 10) : undefined;
    const message = Number.isFinite(seconds)
      ? `Rate limited. Retry after ${seconds}s.`
      : "Rate limited.";
    return { ok: false, error: "HTTP_ERROR", message };
  }

  if (!res.ok) {
    return {
      ok: false,
      error: "HTTP_ERROR",
      message: `Search failed (${res.status})`,
    };
  }

  const json: unknown = await res.json();
  const parsed = json as SpotifySearchTracksResponse;
  const items = parsed.tracks?.items;
  if (!Array.isArray(items)) {
    return { ok: false, error: "INVALID_RESPONSE", message: "Unexpected search payload" };
  }

  return { ok: true, tracks: items.map(mapApiTrackToDomain) };
};
