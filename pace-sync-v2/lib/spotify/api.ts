import "server-only";

import type { PlaylistSummary, Track } from "@/lib/types";
import { expectSpotifyJson, spotifyFetch } from "./http";
import {
  mapSpotifyPlaylistToSummary,
  mapSpotifyTrackToTrack,
  playlistFromCreatePayload,
  type SpotifyCreatePlaylistBody,
  type SpotifyPaging,
  type SpotifyPlaylistListingItem,
  type SpotifyPlaylistTrackRow,
  type SpotifyTrackish,
} from "./mappers";
import { getSpotifyAccessToken } from "./session";

type SpotifySearchTracksRoot = {
  tracks: SpotifyPaging<SpotifyTrackish> | null;
};
export type UserPlaylistsResult = {
  playlists: PlaylistSummary[];
  total: number;
  offset: number;
  limit: number;
  nextPageUrl: string | null;
};

export type PlaylistTracksResult = {
  tracks: Track[];
  total: number;
  returnedCount: number;
  /** Offset Spotify used for this request (pagination start). */
  offset: number;
  limitApplied: number;
};

export type TrackSearchResult = {
  tracks: Track[];
  total: number;
  returnedCount: number;
  limitApplied: number;
};

export type CreatePlaylistArgs = {
  name: string;
  description?: string;
  isPublic?: boolean;
  collaborative?: boolean;
};

const TRACK_URI_CHUNK = 100;

function normalizePlaylistId(id: string) {
  return id.replace(/^spotify:playlist:/, "");
}

export function normalizeTrackUri(entry: Track | string): string {
  if (typeof entry === "string") {
    const t = entry.trim();
    return t.includes(":") ? t : `spotify:track:${t}`;
  }
  return `spotify:track:${entry.id}`;
}

function chunk<U>(items: readonly U[], size: number): U[][] {
  const buckets: U[][] = [];
  for (let i = 0; i < items.length; i += size) {
    buckets.push(items.slice(i, i + size));
  }
  return buckets;
}

function playlistTracksRelativeFromNext(nextHref: string): string {
  const u = new URL(nextHref);
  const stripped = u.pathname.replace(/^\/v1/, "") || "";
  const qs = u.searchParams.toString();
  return qs ? `${stripped}?${qs}` : stripped;
}

type SpotifyPrivateUser = { id: string };

export async function getUserPlaylists(
  opts?: Partial<{ limit: number; offset: number }>,
): Promise<UserPlaylistsResult> {
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;
  const accessToken = await getSpotifyAccessToken();
  const path = `/me/playlists?limit=${limit}&offset=${offset}`;

  const page = await expectSpotifyJson<
    SpotifyPaging<SpotifyPlaylistListingItem>
  >(accessToken, path);

  const playlists = page.items
    .map(mapSpotifyPlaylistToSummary)
    .filter(Boolean) as PlaylistSummary[];

  return {
    playlists,
    total: page.total,
    offset: page.offset,
    limit: page.limit,
    nextPageUrl: page.next,
  };
}

export async function getPlaylistTracks(
  playlistId: string,
  opts?: Partial<{
    /** Spotify allows up to 100 (default single page unless collectAllPages). */
    limit: number;
    offset: number;
    /** Iterate `next` until all tracks fetched (respect optional maxTracks ceiling). */
    collectAllPages: boolean;
    maxTracks: number;
  }>,
): Promise<PlaylistTracksResult> {
  const id = normalizePlaylistId(playlistId);
  const accessToken = await getSpotifyAccessToken();
  const limitApplied = Math.min(opts?.limit ?? 100, 100);
  const offset = opts?.offset ?? 0;
  const ceiling =
    opts?.maxTracks !== undefined ? Math.max(0, opts.maxTracks) : undefined;

  const mapRows = (rows: SpotifyPlaylistTrackRow[]): Track[] =>
    rows
      .map((row) => mapSpotifyTrackToTrack(row.track))
      .filter(Boolean) as Track[];

  const path = `/playlists/${encodeURIComponent(id)}/tracks?limit=${limitApplied}&offset=${offset}`;
  let page = await expectSpotifyJson<
    SpotifyPaging<SpotifyPlaylistTrackRow>
  >(accessToken, path);

  const tracks: Track[] = [...mapRows(page.items)];
  const totalRecords = page.total;

  if (ceiling !== undefined && tracks.length > ceiling) {
    tracks.length = ceiling;
    return {
      tracks,
      total: totalRecords,
      returnedCount: tracks.length,
      offset,
      limitApplied,
    };
  }

  const desiredCap =
    ceiling !== undefined ? Math.min(totalRecords, ceiling) : totalRecords;

  let nextHref =
    opts?.collectAllPages && page.next ? page.next : null;

  while (opts?.collectAllPages && nextHref && tracks.length < desiredCap) {
    const nextRelative = playlistTracksRelativeFromNext(nextHref);
    page = await expectSpotifyJson<
      SpotifyPaging<SpotifyPlaylistTrackRow>
    >(accessToken, nextRelative);

    const batch = mapRows(page.items);
    if (!batch.length && !page.next) break;

    tracks.push(...batch);
    nextHref = page.next;

    if (tracks.length >= desiredCap) {
      tracks.length = desiredCap;
      break;
    }

    if (!batch.length && !page.next) break;
  }

  return {
    tracks,
    total: totalRecords,
    returnedCount: tracks.length,
    offset,
    limitApplied,
  };
}

export async function searchTracks(
  query: string,
  opts?: Partial<{ limit: number }>,
): Promise<TrackSearchResult> {
  const q = query.trim();
  if (!q) {
    return { tracks: [], total: 0, returnedCount: 0, limitApplied: 0 };
  }

  const limitApplied = Math.min(opts?.limit ?? 20, 50);
  const accessToken = await getSpotifyAccessToken();
  const path = `/search?q=${encodeURIComponent(q)}&type=track&limit=${limitApplied}`;

  const body = await expectSpotifyJson<SpotifySearchTracksRoot>(
    accessToken,
    path,
  );

  const page = body.tracks;
  if (!page) {
    return {
      tracks: [],
      total: 0,
      returnedCount: 0,
      limitApplied,
    };
  }

  const tracks = page.items
    .map((t) => mapSpotifyTrackToTrack(t))
    .filter(Boolean) as Track[];

  return {
    tracks,
    total: page.total,
    returnedCount: tracks.length,
    limitApplied,
  };
}

export async function createPlaylist(
  args: CreatePlaylistArgs,
): Promise<PlaylistSummary> {
  const accessToken = await getSpotifyAccessToken();
  const me = await expectSpotifyJson<SpotifyPrivateUser>(accessToken, `/me`);
  const userId = encodeURIComponent(me.id);

  const body = {
    name: args.name,
    description: args.description,
    public: args.isPublic ?? true,
    collaborative: args.collaborative ?? false,
  };

  const created = await expectSpotifyJson<SpotifyCreatePlaylistBody>(
    accessToken,
    `/users/${userId}/playlists`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const summary = playlistFromCreatePayload(created);
  if (!summary) {
    throw new Error("[spotify] createPlaylist returned an unexpected payload");
  }
  return summary;
}

/**
 * Replaces *all* tracks in a playlist. Spotify allows 100 Spotify URIs per request;
 * the first chunk overwrites playlist contents and remaining chunks POST-append.
 *
 * Passing an empty iterable clears playlist tracks.
 */
export async function replacePlaylistTracks(
  playlistId: string,
  uris: Iterable<string | Track>,
): Promise<{ snapshotId: string }> {
  const id = normalizePlaylistId(playlistId);
  const accessToken = await getSpotifyAccessToken();
  const list = [...uris].map((u) => normalizeTrackUri(u));

  if (list.length === 0) {
    const res = await spotifyFetch(
      accessToken,
      `/playlists/${encodeURIComponent(id)}/tracks`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [] }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Spotify clear playlist → HTTP ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    const body = await res.json().catch(() => ({}));
    const snapshotId = parseSnapshot(body) ?? "";
    return { snapshotId };
  }

  const parts = chunk(list, TRACK_URI_CHUNK);
  const primary = parts[0]!;
  let snapshotId =
    (await expectSnapshotFromReplace(accessToken, id, primary)) ?? "";

  for (let i = 1; i < parts.length; i++) {
    const batch = parts[i]!;
    const res = await spotifyFetch(
      accessToken,
      `/playlists/${encodeURIComponent(id)}/tracks`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: batch }),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(
        `Spotify append tracks → HTTP ${res.status}: ${text.slice(0, 400)}`,
      );
    }
    const json = (await res.json().catch(() => ({}))) as {
      snapshot_id?: string;
    };
    if (json.snapshot_id) snapshotId = json.snapshot_id;
  }

  return { snapshotId };
}

function parseSnapshot(body: unknown): string | undefined {
  if (
    typeof body === "object" &&
    body !== null &&
    "snapshot_id" in body &&
    typeof (body as { snapshot_id?: unknown }).snapshot_id === "string"
  ) {
    return (body as { snapshot_id: string }).snapshot_id;
  }
  return undefined;
}

async function expectSnapshotFromReplace(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<string | undefined> {
  const res = await spotifyFetch(
    accessToken,
    `/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Spotify replace tracks → HTTP ${res.status}: ${text.slice(0, 400)}`,
    );
  }
  const body = await res.json().catch(() => ({}));
  return parseSnapshot(body);
}
