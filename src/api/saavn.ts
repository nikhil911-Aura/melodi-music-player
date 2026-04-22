import { Song, Album, Artist, SearchResult } from '../types';

const BASE_URL = 'https://saavn.sumit.co';

async function fetchAPI<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
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
  if (!song.artists?.primary?.length) return 'Unknown Artist';
  return song.artists.primary.map(a => a.name).join(', ');
}

export async function searchSongs(query: string, page = 1): Promise<{ results: Song[]; total: number }> {
  const data = await fetchAPI<any>('/api/search/songs', { query, page: String(page), limit: '20' });
  return data?.data || { results: [], total: 0 };
}

export async function searchAll(query: string): Promise<SearchResult> {
  const data = await fetchAPI<any>('/api/search', { query });
  return data?.data || {};
}

export async function getTrendingSongs(page = 1): Promise<{ results: Song[]; total: number }> {
  const data = await fetchAPI<any>('/api/search/songs', { query: 'trending', page: String(page), limit: '20' });
  return data?.data || { results: [], total: 0 };
}

export async function getBollywoodHits(page = 1): Promise<{ results: Song[]; total: number }> {
  const data = await fetchAPI<any>('/api/search/songs', { query: 'bollywood hits 2024', page: String(page), limit: '20' });
  return data?.data || { results: [], total: 0 };
}

export async function searchArtists(query: string, page = 1): Promise<{ results: Artist[]; total: number }> {
  const data = await fetchAPI<any>('/api/search/artists', { query, page: String(page), limit: '20' });
  return { results: data?.data?.results || [], total: data?.data?.total || 0 };
}

export async function searchAlbums(query: string, page = 1): Promise<{ results: Album[]; total: number }> {
  const data = await fetchAPI<any>('/api/search/albums', { query, page: String(page), limit: '20' });
  return { results: data?.data?.results || [], total: data?.data?.total || 0 };
}

export async function getSongById(id: string): Promise<Song | null> {
  const data = await fetchAPI<any>(`/api/songs/${id}`);
  return data?.data?.[0] || null;
}

export async function getSongSuggestions(id: string): Promise<Song[]> {
  const data = await fetchAPI<any>(`/api/songs/${id}/suggestions`, { limit: '10' });
  return data?.data || [];
}

export async function getArtistById(id: string): Promise<Artist | null> {
  const data = await fetchAPI<any>(`/api/artists/${id}`);
  return data?.data || null;
}

export async function getArtistSongs(id: string): Promise<Song[]> {
  const data = await fetchAPI<any>(`/api/artists/${id}/songs`);
  return data?.data?.results || [];
}

export async function getTopArtistsSongs(): Promise<Song[]> {
  const data = await fetchAPI<any>('/api/search/songs', { query: 'arijit singh', limit: '10' });
  return data?.data?.results || [];
}