import { NextResponse } from "next/server";

import {
  createPlaylist,
  replacePlaylistTracks,
  normalizeTrackUri,
} from "@/lib/spotify/api";
import {
  SpotifyAuthRequiredError,
  SpotifyRateLimitWaitingError,
} from "@/lib/spotify/errors";

type SyncBody = {
  mode?: string;
  name?: string;
  playlistId?: string;
  trackUris?: unknown;
};

function normalizedUris(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || !raw.every((u) => typeof u === "string")) {
    return null;
  }
  return raw.map((u) => normalizeTrackUri(u));
}

export async function POST(request: Request) {
  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uris = normalizedUris(body.trackUris);
  if (!uris) {
    return NextResponse.json({ error: "Invalid track URIs" }, { status: 400 });
  }

  try {
    if (body.mode === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Name required" }, { status: 400 });
      }
      const created = await createPlaylist({
        name,
        isPublic: false,
        description: "Created by Pacelist",
      });
      await replacePlaylistTracks(created.id, uris);
      return NextResponse.json({
        playlistId: created.id,
        spotifyUrl: `https://open.spotify.com/playlist/${created.id}`,
      });
    }

    if (body.mode === "replace") {
      const playlistId =
        typeof body.playlistId === "string" ? body.playlistId.trim() : "";
      if (!playlistId) {
        return NextResponse.json({ error: "playlistId required" }, { status: 400 });
      }
      await replacePlaylistTracks(playlistId, uris);
      return NextResponse.json({
        playlistId,
        spotifyUrl: `https://open.spotify.com/playlist/${playlistId}`,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    if (err instanceof SpotifyAuthRequiredError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof SpotifyRateLimitWaitingError) {
      return NextResponse.json(
        { error: "Spotify rate limited this request. Try again shortly." },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { error: "Spotify rejected this request." },
      { status: 502 },
    );
  }
}
