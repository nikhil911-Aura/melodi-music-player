import { Song, Album, Artist, SearchResult } from '../types';

const BASE_URL = 'https://jiosaavn-api-privatecvc2.vercel.app';

async function fetchAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// New API returns primaryArtists as a comma-separated string — normalize to Song type
function normalizeSong(raw: any): Song {
  let primary: Artist[] = [];
  if (raw.artists?.primary && Array.isArray(raw.artists.primary)) {
    primary = raw.artists.primary;
  } else if (raw.primaryArtists) {
    if (typeof raw.primaryArtists === 'string' && raw.primaryArtists.trim()) {
      const ids = (raw.primaryArtistsId || '').split(',').map((s: string) => s.trim());
      primary = raw.primaryArtists.split(',').map((name: string, i: number) => ({
        id: ids[i] || String(i),
        name: name.trim(),
        url: '',
      }));
    } else if (Array.isArray(raw.primaryArtists)) {
      primary = raw.primaryArtists;
    }
  }

  return {
    ...raw,
    duration: typeof raw.duration === 'string' ? parseInt(raw.duration, 10) : (raw.duration || 0),
    artists: { primary, featured: raw.artists?.featured || [], all: raw.artists?.all || [] },
    downloadUrl: raw.downloadUrl || [],
    image: raw.image || [],
  };
}

export function getBestImage(images: { quality: string; url?: string; link?: string }[]): string {
  if (!images || images.length === 0) return '';
  const img500 = images.find(i => i.quality === '500x500');
  const img150 = images.find(i => i.quality === '150x150');
  const best = img500 || img150 || images[images.length - 1];
  return best?.url || best?.link || '';
}

export function getBestAudio(urls: { quality: string; url?: string; link?: string }[]): string {
  if (!urls || urls.length === 0) return '';
  const q320 = urls.find(u => u.quality === '320kbps');
  const q160 = urls.find(u => u.quality === '160kbps');
  const q96 = urls.find(u => u.quality === '96kbps');
  const best = q320 || q160 || q96 || urls[urls.length - 1];
  return best?.url || best?.link || '';
}

export function getArtistNames(song: Song): string {
  if (song.artists?.primary?.length) {
    return song.artists.primary.map(a => a.name).join(', ');
  }
  return 'Unknown Artist';
}

export async function searchSongs(query: string, page = 1): Promise<{ results: Song[]; total: number }> {
  const data = await fetchAPI<any>('/search/songs', { query, page: String(page), limit: '20' });
  const raw = data?.data || { results: [], total: 0 };
  return {
    results: (raw.results || []).map(normalizeSong),
    total: raw.total || 0,
  };
}

export async function searchAll(query: string): Promise<SearchResult> {
  try {
    const [songs, albums, artists] = await Promise.all([
      searchSongs(query),
      searchAlbums(query),
      searchArtists(query),
    ]);
    return { songs, albums, artists };
  } catch {
    return {};
  }
}

export async function getTrendingSongs(page = 1): Promise<{ results: Song[]; total: number }> {
  return searchSongs('trending hindi', page);
}

export async function getBollywoodHits(page = 1): Promise<{ results: Song[]; total: number }> {
  return searchSongs('bollywood hits 2024', page);
}

export async function searchArtists(query: string, page = 1): Promise<{ results: Artist[]; total: number }> {
  const data = await fetchAPI<any>('/search/artists', { query, page: String(page), limit: '20' });
  return { results: data?.data?.results || [], total: data?.data?.total || 0 };
}

export async function searchAlbums(query: string, page = 1): Promise<{ results: Album[]; total: number }> {
  const data = await fetchAPI<any>('/search/albums', { query, page: String(page), limit: '20' });
  return { results: data?.data?.results || [], total: data?.data?.total || 0 };
}

export async function getSongById(id: string): Promise<Song | null> {
  const data = await fetchAPI<any>(`/songs`, { id });
  const raw = data?.data?.['0'] || data?.data?.[0] || null;
  return raw ? normalizeSong(raw) : null;
}

export async function getSongSuggestions(id: string): Promise<Song[]> {
  // Not supported by this API — fall back to empty
  return [];
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const data = await fetchAPI<any>(`/artists`, { id });
  return data?.data || null;
}

export async function getArtistSongs(id: string): Promise<Song[]> {
  const data = await fetchAPI<any>(`/artists/${id}/songs`, { page: '1' });
  return (data?.data?.results || []).map(normalizeSong);
}

export async function getTopArtistsSongs(): Promise<Song[]> {
  const data = await searchSongs('arijit singh', 1);
  return data.results.slice(0, 10);
}
