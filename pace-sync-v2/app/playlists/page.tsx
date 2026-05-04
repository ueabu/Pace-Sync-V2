import Image from "next/image";
import Link from "next/link";

import { getSession } from "@/lib/auth/session";
import { listUserPlaylists, SpotifyApiError } from "@/lib/spotify";

export default async function PlaylistsPage() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  let playlists: Awaited<ReturnType<typeof listUserPlaylists>> = [];
  let loadError: string | null = null;

  try {
    playlists = await listUserPlaylists(session.accessToken);
  } catch (err) {
    loadError =
      err instanceof SpotifyApiError
        ? "Spotify returned an error. Try reconnecting your account."
        : "Could not load playlists.";
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Pick a playlist
        </h1>
        <p className="max-w-xl text-stone-700">
          Open one in the timeline editor. Reorder and anchor tracks there, then sync
          back to Spotify when the set list feels right.
        </p>
      </header>

      {loadError ? (
        <p className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-800">
          {loadError}
        </p>
      ) : playlists.length === 0 ? (
        <p className="text-sm text-stone-600">
          No playlists yet. Create one in Spotify and refresh this page.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {playlists.map((p) => {
            const cover = p.images[0]?.url;
            const href = `/timeline?playlistId=${encodeURIComponent(p.id)}&playlistName=${encodeURIComponent(p.name)}`;
            return (
              <li key={p.id}>
                <Link
                  href={href}
                  className="flex gap-4 rounded-lg border border-stone-200 bg-white p-3 transition-colors hover:border-stone-300 hover:bg-stone-50"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded bg-stone-200">
                    {cover ? (
                      <Image
                        src={cover}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-medium text-stone-500">
                        —
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <p className="truncate font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-stone-600">
                      {p.tracks.total} track{p.tracks.total === 1 ? "" : "s"}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
