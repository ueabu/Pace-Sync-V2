export type SpotifySearchTracksResponse = {
  tracks?: {
    items: SpotifyApiTrack[];
  };
};

export type SpotifyApiTrack = {
  id: string;
  name: string;
  duration_ms: number;
  artists: { name: string }[];
  album: {
    images: { url: string }[];
  };
};
