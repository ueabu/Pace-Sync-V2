import Link from 'next/link';

import { PacelistCoursePlayground } from '@/components/course/pacelist-course-playground';
import { ConnectSpotifyButton } from '@/components/connect-spotify-button';
import { Button } from '@/components/ui/button';
import { isLoggedIn } from '@/lib/auth/session';

export default async function HomePage() {
  const loggedIn = await isLoggedIn();

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-black">
      <div className="flex flex-col gap-10 px-4 pb-10 pt-6 sm:pt-12">
        <div className="max-w-xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Pacelist
          </p>
          <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Line up the songs you need, when you need them on the course.
          </h1>
          <p className="text-pretty text-lg leading-relaxed text-stone-700">
            Pacelist maps a Spotify playlist against your race so the right track hits at
            the right mile—no surprises when it hurts.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {loggedIn ? (
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/playlists">Open your playlists</Link>
            </Button>
          ) : (
            <ConnectSpotifyButton />
          )}
        </div>

        <p className="max-w-md text-sm leading-relaxed text-stone-600">
          Connect once with Spotify. You stay in control of what goes back to your library.
        </p>
      </div>

      <PacelistCoursePlayground />
    </div>
  );
}
