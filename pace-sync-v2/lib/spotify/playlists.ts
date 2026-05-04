import { spotifyFetchJson } from "./http";
import type { SpotifyPlaylistSummary, SpotifyPlaylistsPage } from "./types";

export async function listUserPlaylists(
  accessToken: string,
): Promise<SpotifyPlaylistSummary[]> {
  const out: SpotifyPlaylistSummary[] = [];
  let url: string | null = "/me/playlists?limit=50";

  while (url) {
    const page: SpotifyPlaylistsPage = await spotifyFetchJson(
      accessToken,
      url,
    );
    out.push(...page.items);
    url = page.next;
  }

  return out;
}

type PlaylistTracksPage = {
  next: string | null;
  items: Array<{
    track: { uri: string } | null;
  }>;
};

export async function getPlaylistTrackUris(
  accessToken: string,
  playlistId: string,
): Promise<string[]> {
  const uris: string[] = [];
  let url: string | null =
    `/playlists/${playlistId}/tracks?limit=100&fields=next,items(track(uri))`;

  while (url) {
    const page: PlaylistTracksPage = await spotifyFetchJson(accessToken, url);
    for (const row of page.items) {
      const uri = row.track?.uri;
      if (uri) {
        uris.push(uri);
      }
    }
    url = page.next;
  }

  return uris;
}
