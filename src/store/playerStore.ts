import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Song, RepeatMode } from '../types';
import { getBestAudio } from '../api/saavn';

interface PlayerState {
  // Queue
  queue: Song[];
  currentIndex: number;

  // Playback state
  isPlaying: boolean;
  currentPosition: number; // in seconds
  duration: number;
  isLoading: boolean;

  // Modes
  shuffleMode: boolean;
  repeatMode: RepeatMode;
  shuffledIndices: number[];

  // Favorites
  favorites: Song[];

  // Recently played
  recentlyPlayed: Song[];

  // Downloaded songs
  downloadedSongs: string[]; // song ids

  // Actions
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (val: boolean) => void;
  setCurrentPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  setIsLoading: (val: boolean) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleFavorite: (song: Song) => void;
  isFavorite: (id: string) => boolean;
  addToRecentlyPlayed: (song: Song) => void;
  addDownloaded: (id: string) => void;
  isDownloaded: (id: string) => boolean;
  getCurrentSong: () => Song | null;
  getNextSong: () => Song | null;
}

const shuffleArray = (arr: number[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentPosition: 0,
  duration: 0,
  isLoading: false,
  shuffleMode: false,
  repeatMode: 'off',
  shuffledIndices: [],
  favorites: [],
  recentlyPlayed: [],
  downloadedSongs: [],

  getCurrentSong: () => {
    const { queue, currentIndex } = get();
    if (currentIndex < 0 || currentIndex >= queue.length) return null;
    return queue[currentIndex];
  },

  getNextSong: () => {
    const { queue, currentIndex, repeatMode, shuffleMode, shuffledIndices } = get();
    if (queue.length === 0) return null;
    if (repeatMode === 'track') return queue[currentIndex];
    if (shuffleMode && shuffledIndices.length > 0) {
      const currPos = shuffledIndices.indexOf(currentIndex);
      const nextPos = (currPos + 1) % shuffledIndices.length;
      return queue[shuffledIndices[nextPos]];
    }
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      return repeatMode === 'queue' ? queue[0] : null;
    }
    return queue[nextIndex];
  },

  setQueue: (songs, startIndex = 0) => {
    const indices = songs.map((_, i) => i);
    set({
      queue: songs,
      currentIndex: startIndex,
      shuffledIndices: shuffleArray(indices),
      currentPosition: 0,
      duration: 0,
    });
  },

  addToQueue: (song) => {
    set(state => ({
      queue: [...state.queue, song],
      shuffledIndices: shuffleArray([...state.queue, song].map((_, i) => i)),
    }));
  },

  removeFromQueue: (index) => {
    set(state => {
      const newQueue = state.queue.filter((_, i) => i !== index);
      let newIndex = state.currentIndex;
      if (index < state.currentIndex) newIndex--;
      else if (index === state.currentIndex) newIndex = Math.min(newIndex, newQueue.length - 1);
      return {
        queue: newQueue,
        currentIndex: newIndex,
        shuffledIndices: shuffleArray(newQueue.map((_, i) => i)),
      };
    });
  },

  reorderQueue: (fromIndex, toIndex) => {
    set(state => {
      const newQueue = [...state.queue];
      const [moved] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, moved);
      let newIndex = state.currentIndex;
      if (state.currentIndex === fromIndex) newIndex = toIndex;
      else if (fromIndex < state.currentIndex && toIndex >= state.currentIndex) newIndex--;
      else if (fromIndex > state.currentIndex && toIndex <= state.currentIndex) newIndex++;
      return { queue: newQueue, currentIndex: newIndex };
    });
  },

  playNext: () => {
    const { queue, currentIndex, repeatMode, shuffleMode, shuffledIndices } = get();
    if (queue.length === 0) return;
    if (repeatMode === 'track') {
      set({ currentPosition: 0 });
      return;
    }
    let nextIndex: number;
    if (shuffleMode && shuffledIndices.length > 0) {
      const currPos = shuffledIndices.indexOf(currentIndex);
      const nextPos = (currPos + 1) % shuffledIndices.length;
      nextIndex = shuffledIndices[nextPos];
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'queue') nextIndex = 0;
        else { set({ isPlaying: false }); return; }
      }
    }
    set({ currentIndex: nextIndex, currentPosition: 0 });
  },

  playPrevious: () => {
    const { queue, currentIndex, currentPosition, shuffleMode, shuffledIndices } = get();
    if (queue.length === 0) return;
    if (currentPosition > 3) {
      set({ currentPosition: 0 });
      return;
    }
    let prevIndex: number;
    if (shuffleMode && shuffledIndices.length > 0) {
      const currPos = shuffledIndices.indexOf(currentIndex);
      const prevPos = (currPos - 1 + shuffledIndices.length) % shuffledIndices.length;
      prevIndex = shuffledIndices[prevPos];
    } else {
      prevIndex = Math.max(0, currentIndex - 1);
    }
    set({ currentIndex: prevIndex, currentPosition: 0 });
  },

  setCurrentIndex: (index) => set({ currentIndex: index, currentPosition: 0 }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setCurrentPosition: (pos) => set({ currentPosition: pos }),
  setDuration: (dur) => set({ duration: dur }),
  setIsLoading: (val) => set({ isLoading: val }),

  toggleShuffle: () => {
    const { queue } = get();
    set(state => ({
      shuffleMode: !state.shuffleMode,
      shuffledIndices: shuffleArray(queue.map((_, i) => i)),
    }));
  },

  toggleRepeat: () => {
    set(state => {
      const modes: RepeatMode[] = ['off', 'queue', 'track'];
      const idx = modes.indexOf(state.repeatMode);
      return { repeatMode: modes[(idx + 1) % modes.length] };
    });
  },

  toggleFavorite: (song) => {
    set(state => {
      const exists = state.favorites.find(f => f.id === song.id);
      const newFavs = exists
        ? state.favorites.filter(f => f.id !== song.id)
        : [song, ...state.favorites];
      AsyncStorage.setItem('favorites', JSON.stringify(newFavs));
      return { favorites: newFavs };
    });
  },

  isFavorite: (id) => get().favorites.some(f => f.id === id),

  addToRecentlyPlayed: (song) => {
    set(state => {
      const filtered = state.recentlyPlayed.filter(s => s.id !== song.id);
      const updated = [song, ...filtered].slice(0, 20);
      AsyncStorage.setItem('recentlyPlayed', JSON.stringify(updated));
      return { recentlyPlayed: updated };
    });
  },

  addDownloaded: (id) => {
    set(state => {
      if (state.downloadedSongs.includes(id)) return state;
      const updated = [...state.downloadedSongs, id];
      AsyncStorage.setItem('downloadedSongs', JSON.stringify(updated));
      return { downloadedSongs: updated };
    });
  },

  isDownloaded: (id) => get().downloadedSongs.includes(id),
}));

// Load persisted data on startup
export async function loadPersistedData() {
  try {
    const [favs, recent, downloaded] = await Promise.all([
      AsyncStorage.getItem('favorites'),
      AsyncStorage.getItem('recentlyPlayed'),
      AsyncStorage.getItem('downloadedSongs'),
    ]);
    usePlayerStore.setState({
      favorites: favs ? JSON.parse(favs) : [],
      recentlyPlayed: recent ? JSON.parse(recent) : [],
      downloadedSongs: downloaded ? JSON.parse(downloaded) : [],
    });
  } catch (e) {
    console.log('Failed to load persisted data', e);
  }
}
