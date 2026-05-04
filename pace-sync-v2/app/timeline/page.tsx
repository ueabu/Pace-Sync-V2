import Link from "next/link";

import { TimelineEditor } from "@/components/timeline/timeline-editor";
import { SyncPlaylistModal } from "@/components/sync-playlist-modal";
import { Button } from "@/components/ui/button";
import { createDefaultRacePlan, createTimelineSlotInstanceId } from "@/lib/timeline/defaultRacePlan";
import type { RacePlan } from "@/lib/types";
import {
  getPlaylistTracks,
  normalizeTrackUri,
  SpotifyAuthRequiredError,
  SpotifyRateLimitWaitingError,
} from "@/lib/spotify";

type TimelinePageProps = {
  searchParams: Promise<{ playlistId?: string; playlistName?: string }>;
};

export default async function TimelinePage({ searchParams }: TimelinePageProps) {
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
  let initialRacePlan: RacePlan | undefined;
  let loadError: string | null = null;

  try {
    const { tracks } = await getPlaylistTracks(playlistId, {
      collectAllPages: true,
    });
    trackUris = tracks.map((t) => normalizeTrackUri(t));
    initialRacePlan = {
      ...createDefaultRacePlan(),
      slots: tracks.map((track) => ({
        instanceId: createTimelineSlotInstanceId(),
        track,
        anchorSeconds: null,
      })),
    };
  } catch (err) {
    if (err instanceof SpotifyAuthRequiredError) {
      loadError =
        "Your Spotify session expired. Connect again from the home page.";
    } else if (err instanceof SpotifyRateLimitWaitingError) {
      loadError = "Spotify rate limited this request. Wait a moment and try again.";
    } else {
      loadError = "Something went wrong loading tracks.";
    }
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

      {loadError ? (
        <p className="text-sm text-amber-800 dark:text-amber-300">{loadError}</p>
      ) : initialRacePlan ? (
        <div className="flex min-h-[min(100dvh,48rem)] min-w-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-background dark:border-stone-800">
          <TimelineEditor initialRacePlan={initialRacePlan} />
        </div>
      ) : null}
    </div>
  );
}
