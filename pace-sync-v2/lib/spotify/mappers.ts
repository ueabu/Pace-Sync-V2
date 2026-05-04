import type { PlaylistSummary, Track } from "@/lib/types";

/** Minimal Spotify track shape acceptable from playlist/search endpoints. */
export type SpotifyArtistRef = {
  name?: string;
};

export type SpotifyTrackish = {
  id?: string;
  name?: string;
  duration_ms?: number;
  artists?: SpotifyArtistRef[];
};

export type SpotifyPaging<T> = {
  href?: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
};

export type SpotifyPlaylistListingItem = {
  id: string;
  name: string;
  collaborative: boolean;
  public?: boolean;
  snapshot_id: string;
  uri: string;
  href?: string;
  tracks?: { total: number } | null;
};

export type SpotifyPlaylistTrackRow = {
  track: SpotifyTrackish | null;
};

export function mapSpotifyTrackToTrack(
  raw: SpotifyTrackish | null | undefined,
): Track | null {
  if (!raw?.id || typeof raw.duration_ms !== "number") return null;
  const name = raw.name ?? "";
  const artists =
    raw.artists
      ?.map((a) => a?.name ?? "")
      .filter((namePart) => namePart.length > 0) ?? [];
  return {
    id: raw.id,
    name,
    artists,
    durationMs: raw.duration_ms,
  };
}

export function mapSpotifyPlaylistToSummary(
  p: SpotifyPlaylistListingItem | null | undefined,
): PlaylistSummary | null {
  if (
    !p?.id?.trim() ||
    !p.name?.trim?.() ||
    !p.snapshot_id?.trim?.() ||
    !p.uri?.trim?.()
  ) {
    return null;
  }

  const isPublic =
    typeof p.public === "boolean"
      ? p.public
      : !p.collaborative; // Fallback when Spotify omits deprecated `public`.

  const totalTracks =
    p.tracks && typeof p.tracks.total === "number" ? p.tracks.total : 0;

  return {
    id: p.id,
    name: p.name,
    uri: p.uri,
    snapshotId: p.snapshot_id,
    isPublic,
    collaborative: !!p.collaborative,
    totalTracks,
    href: p.href,
  };
}

export type SpotifyCreatePlaylistBody = {
  id: string;
  name: string;
  collaborative: boolean;
  public?: boolean;
  snapshot_id: string;
  uri: string;
  href?: string;
  tracks?: { total: number };
};

export function playlistFromCreatePayload(
  p: SpotifyCreatePlaylistBody | null | undefined,
): PlaylistSummary | null {
  if (!p) return null;
  return mapSpotifyPlaylistToSummary({
    ...p,
    tracks: p.tracks ?? { total: 0 },
    public: typeof p.public === "boolean" ? p.public : true,
    collaborative: p.collaborative,
  });
}
