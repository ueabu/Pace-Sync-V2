import Link from "next/link";

import { SPOTIFY_OAUTH_START } from "@/lib/auth/constants";

import { Button } from "@/components/ui/button";

export function ConnectSpotifyButton() {
  return (
    <Button asChild size="lg" className="w-full sm:w-auto">
      <Link href={SPOTIFY_OAUTH_START}>Connect Spotify</Link>
    </Button>
  );
}
