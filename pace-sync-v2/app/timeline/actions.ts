"use server";

import { searchTracks as apiSearchTracks } from "@/lib/spotify/api";
import { SpotifyAuthRequiredError, SpotifyRateLimitWaitingError } from "@/lib/spotify/errors";
import type { Track } from "@/lib/types";

export type SearchTracksActionResult =
  | { ok: true; tracks: Track[] }
  | { ok: false; error: "NO_SESSION" | "RATE_LIMIT" | "HTTP_ERROR"; message: string };

export const searchTracksAction = async (
  query: string,
): Promise<SearchTracksActionResult> => {
  try {
    const res = await apiSearchTracks(query, { limit: 12 });
    return { ok: true, tracks: res.tracks };
  } catch (err) {
    if (err instanceof SpotifyAuthRequiredError) {
      return {
        ok: false,
        error: "NO_SESSION",
        message: "Connect Spotify from the home page to search and load tracks.",
      };
    }
    if (err instanceof SpotifyRateLimitWaitingError) {
      return {
        ok: false,
        error: "RATE_LIMIT",
        message: `Spotify rate limited this request. Retry in ${Math.ceil(err.waitMs / 1000)}s.`,
      };
    }
    return {
      ok: false,
      error: "HTTP_ERROR",
      message: "Search failed. Try again.",
    };
  }
};
