import { useEffect, useRef, useCallback } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { usePlayerStore } from '../store/playerStore';
import { getBestAudio } from '../api/saavn';

let globalSound: Audio.Sound | null = null;
let loadToken = 0;

export async function seek(seconds: number) {
  if (!globalSound) return;
  try { await globalSound.setPositionAsync(seconds * 1000); } catch {}
}

async function destroyCurrentSound() {
  const sound = globalSound;
  globalSound = null;
  if (sound) {
    try { await sound.stopAsync(); } catch {}
    try { await sound.unloadAsync(); } catch {}
  }
}

export function useAudioPlayer() {
  const {
    queue,
    currentIndex,
    isPlaying,
    setIsPlaying,
    setCurrentPosition,
    setDuration,
    setIsLoading,
    playNext,
    addToRecentlyPlayed,
    repeatMode,
  } = usePlayerStore();

  const currentSong = queue[currentIndex] ?? null;
  const currentSongId = currentSong?.id;

  const repeatModeRef = useRef(repeatMode);
  const playNextRef = useRef(playNext);
  const setCurrentPositionRef = useRef(setCurrentPosition);

  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { playNextRef.current = playNext; }, [playNext]);
  useEffect(() => { setCurrentPositionRef.current = setCurrentPosition; }, [setCurrentPosition]);

  // Configure audio session once
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  useEffect(() => {
    if (!currentSong) {
      destroyCurrentSound();
      return;
    }

    loadToken += 1;
    const myToken = loadToken;

    async function loadAndPlay() {
      await destroyCurrentSound();

      if (myToken !== loadToken) return;

      const url = getBestAudio(currentSong!.downloadUrl);
      if (!url) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setCurrentPosition(0);
      setDuration(0);

      let sound: Audio.Sound | null = null;
      try {
        const result = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false, progressUpdateIntervalMillis: 500 },
          (status: AVPlaybackStatus) => {
            if (!status.isLoaded) return;

            // Update position
            setCurrentPositionRef.current((status.positionMillis || 0) / 1000);

            // Update duration
            if (status.durationMillis) {
              setDuration(status.durationMillis / 1000);
            }

            // Song finished
            if (status.didJustFinish) {
              if (repeatModeRef.current === 'track') {
                // Reset seek bar to 0 then replay
                setCurrentPositionRef.current(0);
                globalSound?.replayAsync().catch(() => {});
              } else if (repeatModeRef.current === 'queue' || repeatModeRef.current === 'off') {
                // playNext handles both queue loop and stop-at-end
                playNextRef.current();
              }
            }
          }
        );
        sound = result.sound;
      } catch (err) {
        console.log('createAsync error:', err);
        setIsLoading(false);
        return;
      }

      if (myToken !== loadToken) {
        try { await sound.unloadAsync(); } catch {}
        return;
      }

      globalSound = sound;
      setIsLoading(false);
      setIsPlaying(true);
      try { await globalSound.playAsync(); } catch {}
      addToRecentlyPlayed(currentSong!);
    }

    loadAndPlay();
  }, [currentSongId]);

  // Sync play/pause
  useEffect(() => {
    if (!globalSound) return;
    if (isPlaying) {
      globalSound.playAsync().catch(() => {});
    } else {
      globalSound.pauseAsync().catch(() => {});
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  return { seek, togglePlay };
}