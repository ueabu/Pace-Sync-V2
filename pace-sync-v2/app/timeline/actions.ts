"use server";

import { searchTracks } from "@/lib/spotify/searchTracks";
import { getSpotifyAccessToken } from "@/lib/spotify/session";
import type { SearchTracksResult } from "@/lib/spotify/searchTracks";

export const searchTracksAction = async (query: string): Promise<SearchTracksResult> => {
  const token = await getSpotifyAccessToken();
  if (!token) {
    return {
      ok: false,
      error: "NO_TOKEN",
      message: "Spotify is not connected yet. Search will work after sign-in.",
    };
  }
  return await searchTracks(query, token);
};
