"use server";

import type { PlaylistSummary, Track } from "@/lib/types";
import {
  createPlaylist as apiCreatePlaylist,
  getPlaylistTracks as apiGetPlaylistTracks,
  getUserPlaylists as apiGetUserPlaylists,
  replacePlaylistTracks as apiReplacePlaylistTracks,
  searchTracks as apiSearchTracks,
  type CreatePlaylistArgs,
  type PlaylistTracksResult,
  type TrackSearchResult,
  type UserPlaylistsResult,
} from "@/lib/spotify/api";
import { hasSpotifySessionCookie } from "@/lib/spotify/session";
import { clearOAuthCookie, clearSessionCookie } from "@/lib/spotify/session-cookies";
import { cookies } from "next/headers";

/**
 * Thin server-action wrappers around `lib/spotify/api.ts` helpers.
 * The API module can also be imported directly from other Server Components.
 */
export async function getUserPlaylists(
  opts?: Partial<{ limit: number; offset: number }>,
): Promise<UserPlaylistsResult> {
  return apiGetUserPlaylists(opts);
}

export async function getPlaylistTracks(
  playlistId: string,
  opts?: Partial<{
    limit: number;
    offset: number;
    collectAllPages: boolean;
    maxTracks: number;
  }>,
): Promise<PlaylistTracksResult> {
  return apiGetPlaylistTracks(playlistId, opts);
}

export async function searchTracks(
  query: string,
  opts?: Partial<{ limit: number }>,
): Promise<TrackSearchResult> {
  return apiSearchTracks(query, opts);
}

export async function createPlaylist(
  args: CreatePlaylistArgs,
): Promise<PlaylistSummary> {
  return apiCreatePlaylist(args);
}

export async function replacePlaylistTracks(
  playlistId: string,
  uris: Iterable<string | Track>,
): Promise<{ snapshotId: string }> {
  return apiReplacePlaylistTracks(playlistId, uris);
}

export async function isSpotifyConnected(): Promise<boolean> {
  return hasSpotifySessionCookie();
}

/** Clears httpOnly Spotify session + pending OAuth cookies (same outcome as POST /api/auth/spotify/logout). */
export async function spotifyLogout(): Promise<void> {
  const jar = await cookies();
  clearSessionCookie(jar);
  clearOAuthCookie(jar);
}
