export interface Song {
  id: string;
  name: string;
  duration: number;
  language?: string;
  album: {
    id: string;
    name: string;
    url?: string;
  };
  artists: {
    primary: Artist[];
    featured?: Artist[];
    all?: Artist[];
  };
  image: ImageQuality[];
  downloadUrl: DownloadUrl[];
  hasLyrics?: boolean;
  playCount?: string;
  year?: string;
}

export interface Artist {
  id: string;
  name: string;
  image?: ImageQuality[];
  url?: string;
}

export interface ImageQuality {
  quality: string;
  url?: string;
  link?: string;
}

export interface DownloadUrl {
  quality: string;
  url?: string;
  link?: string;
}

export interface Album {
  id: string;
  name: string;
  year?: string;
  songCount?: number;
  image: ImageQuality[];
  artists: { primary: Artist[] };
  songs?: Song[];
}

export interface SearchResult {
  songs?: { results: Song[]; total: number };
  albums?: { results: Album[]; total: number };
  artists?: { results: Artist[]; total: number };
}

export type RepeatMode = 'off' | 'track' | 'queue';
