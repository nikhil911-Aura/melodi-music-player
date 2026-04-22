import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage, getArtistNames } from '../api/saavn';
import { Colors, BorderRadius, Spacing } from '../utils/theme';
import { decodeHtml } from '../utils/format';

interface Props {
  onPress: () => void;
}

export default function MiniPlayer({ onPress }: Props) {
  const {
    queue, currentIndex, isPlaying, isLoading,
    setIsPlaying, playNext, currentPosition, duration,
  } = usePlayerStore();

  const song = queue[currentIndex];
  if (!song) return null;

  const imageUri = getBestImage(song.image);
  const artist = getArtistNames(song);

  // Real progress 0→1
  const progress = duration > 0 ? Math.min(currentPosition / duration, 1) : 0;

  return (
    <View style={styles.container}>

      {/* Real progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.inner}>
        {/* Tapping image/info opens player */}
        <TouchableOpacity style={styles.infoRow} onPress={onPress} activeOpacity={0.7}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Ionicons name="musical-note" size={16} color={Colors.textMuted} />
            </View>
          )}
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{decodeHtml(song.name)}</Text>
            <Text style={styles.artist} numberOfLines={1}>{decodeHtml(artist)}</Text>
          </View>
        </TouchableOpacity>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            onPress={() => setIsPlaying(!isPlaying)}
            style={styles.playBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.text} />
            ) : (
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color={Colors.text}
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={playNext}
            style={styles.nextBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="play-skip-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressTrack: {
    height: 3,
    backgroundColor: Colors.border,
    width: '100%',
  },
  progressFill: {
    height: 3,
    backgroundColor: Colors.primary,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  image: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceLight,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1 },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  artist: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: { padding: 4 },
});