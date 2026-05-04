export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  images: SpotifyImage[];
  tracks: {
    total: number;
  };
};

export type SpotifyPlaylistsPage = {
  items: SpotifyPlaylistSummary[];
  next: string | null;
};

export type SpotifyPlaylistCreated = {
  id: string;
  external_urls: {
    spotify: string;
  };
};
