import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SyncPlaylistModal } from "@/components/sync-playlist-modal";
import { getSession } from "@/lib/auth/session";
import { getPlaylistTrackUris, SpotifyApiError } from "@/lib/spotify";

type TimelinePageProps = {
  searchParams: Promise<{ playlistId?: string; playlistName?: string }>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const params = await searchParams;
  const playlistId = params.playlistId?.trim();
  const playlistName = params.playlistName?.trim() ?? "This playlist";

  if (!playlistId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="max-w-xl text-stone-700">
          Choose a playlist first so Pacelist knows what to load.
        </p>
        <Button asChild variant="secondary">
          <Link href="/playlists">Back to playlists</Link>
        </Button>
      </div>
    );
  }

  let trackUris: string[] = [];
  let loadError: string | null = null;

  try {
    trackUris = await getPlaylistTrackUris(session.accessToken, playlistId);
  } catch (err) {
    loadError =
      err instanceof SpotifyApiError
        ? "Could not read that playlist from Spotify."
        : "Something went wrong loading tracks.";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Timeline editor
          </p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {playlistName}
          </h1>
          <p className="text-sm text-stone-600">
            {loadError
              ? loadError
              : `${trackUris.length} track${trackUris.length === 1 ? "" : "s"} loaded`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/playlists">Change playlist</Link>
          </Button>
          {!loadError && trackUris.length > 0 ? (
            <SyncPlaylistModal
              importedPlaylistId={playlistId}
              importedPlaylistName={playlistName}
              trackUris={trackUris}
              trigger={<Button size="sm">Sync to Spotify</Button>}
            />
          ) : null}
        </div>
      </div>

      <section
        aria-label="Timeline canvas placeholder"
        className="flex min-h-[12rem] flex-col justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-4 py-10 text-center sm:min-h-[18rem]"
      >
        <p className="mx-auto max-w-md text-sm leading-relaxed text-stone-700">
          The timeline canvas lives here in a parallel workstream—blocks, drag and drop,
          and race clock will mount in this frame. Your tracks are ready below for when
          that lands.
        </p>
      </section>
    </div>
  );
}
