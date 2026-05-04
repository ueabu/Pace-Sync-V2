export class SpotifyAuthRequiredError extends Error {
  readonly name = "SpotifyAuthRequiredError";
  readonly code = "SPOTIFY_AUTH_REQUIRED" as const;

  constructor(message = "Pacelist Spotify session missing or revoked") {
    super(message);
    Object.setPrototypeOf(this, SpotifyAuthRequiredError.prototype);
  }
}

export class SpotifyRateLimitWaitingError extends Error {
  readonly name = "SpotifyRateLimitWaitingError";

  constructor(
    readonly waitMs: number,
    readonly causeStatus: number,
  ) {
    super(`Spotify rate limited; retry after ${waitMs}ms`);
    Object.setPrototypeOf(this, SpotifyRateLimitWaitingError.prototype);
  }
}
