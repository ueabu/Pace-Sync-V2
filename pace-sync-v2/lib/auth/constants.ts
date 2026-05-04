import { SPOTIFY_LOGIN_PATH } from "@/lib/spotify/paths";

/** OAuth start URL; defaults to the App Router PKCE login route. */
export const SPOTIFY_OAUTH_START =
  process.env.NEXT_PUBLIC_SPOTIFY_OAUTH_START ?? SPOTIFY_LOGIN_PATH;
