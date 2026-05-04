import { spotifyFetchJson } from "./http";
import type { SpotifyPlaylistCreated } from "./types";

const TRACKS_PER_REQUEST = 100;

async function postPlaylistTracks(
  accessToken: string,
  playlistId: string,
  uris: string[],
): Promise<void> {
  if (uris.length === 0) {
    return;
  }
  await spotifyFetchJson<unknown>(accessToken, `/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });
}

/**
 * Create an empty playlist, then append tracks in batches of 100.
 */
export async function createPlaylistWithTracks(
  accessToken: string,
  spotifyUserId: string,
  name: string,
  trackUris: string[],
): Promise<SpotifyPlaylistCreated> {
  const created = await spotifyFetchJson<SpotifyPlaylistCreated>(
    accessToken,
    `/users/${encodeURIComponent(spotifyUserId)}/playlists`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        public: false,
        description: "Created by Pacelist",
      }),
    },
  );

  for (let i = 0; i < trackUris.length; i += TRACKS_PER_REQUEST) {
    await postPlaylistTracks(
      accessToken,
      created.id,
      trackUris.slice(i, i + TRACKS_PER_REQUEST),
    );
  }

  return created;
}

/**
 * Replace a playlist's tracks: PUT first chunk (replaces entire list), POST remaining chunks.
 */
export async function replacePlaylistTracks(
  accessToken: string,
  playlistId: string,
  trackUris: string[],
): Promise<void> {
  if (trackUris.length === 0) {
    await spotifyFetchJson<unknown>(
      accessToken,
      `/playlists/${encodeURIComponent(playlistId)}/tracks`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uris: [] }),
      },
    );
    return;
  }

  const first = trackUris.slice(0, TRACKS_PER_REQUEST);
  await spotifyFetchJson<unknown>(
    accessToken,
    `/playlists/${encodeURIComponent(playlistId)}/tracks`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uris: first }),
    },
  );

  for (let i = TRACKS_PER_REQUEST; i < trackUris.length; i += TRACKS_PER_REQUEST) {
    await postPlaylistTracks(
      accessToken,
      playlistId,
      trackUris.slice(i, i + TRACKS_PER_REQUEST),
    );
  }
}
