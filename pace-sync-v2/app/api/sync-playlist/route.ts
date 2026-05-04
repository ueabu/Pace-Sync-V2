import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { SpotifyApiError } from "@/lib/spotify";
import {
  createPlaylistWithTracks,
  replacePlaylistTracks,
} from "@/lib/spotify/sync";

type SyncBody = {
  mode?: string;
  name?: string;
  playlistId?: string;
  trackUris?: unknown;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const uris = body.trackUris;
  if (!Array.isArray(uris) || !uris.every((u) => typeof u === "string")) {
    return NextResponse.json({ error: "Invalid track URIs" }, { status: 400 });
  }

  try {
    if (body.mode === "create") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) {
        return NextResponse.json({ error: "Name required" }, { status: 400 });
      }
      const created = await createPlaylistWithTracks(
        session.accessToken,
        session.user.id,
        name,
        uris,
      );
      return NextResponse.json({
        playlistId: created.id,
        spotifyUrl: created.external_urls.spotify,
      });
    }

    if (body.mode === "replace") {
      const playlistId =
        typeof body.playlistId === "string" ? body.playlistId.trim() : "";
      if (!playlistId) {
        return NextResponse.json({ error: "playlistId required" }, { status: 400 });
      }
      await replacePlaylistTracks(session.accessToken, playlistId, uris);
      return NextResponse.json({
        playlistId,
        spotifyUrl: `https://open.spotify.com/playlist/${playlistId}`,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (err) {
    if (err instanceof SpotifyApiError) {
      return NextResponse.json(
        { error: "Spotify rejected this request." },
        { status: 502 },
      );
    }
    throw err;
  }
}
