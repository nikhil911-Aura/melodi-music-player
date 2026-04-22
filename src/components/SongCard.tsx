import React from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Song } from '../types';
import { Colors, BorderRadius, Spacing } from '../utils/theme';
import { getBestImage, getArtistNames } from '../api/saavn';
import { formatDuration, decodeHtml } from '../utils/format';
import { usePlayerStore } from '../store/playerStore';

interface Props {
  song: Song;
  onPress: () => void;
  onAddToQueue?: () => void;
  showIndex?: number;
  isActive?: boolean;
  isLoading?: boolean;
}

export default function SongCard({ song, onPress, onAddToQueue, showIndex, isActive, isLoading }: Props) {
  const { toggleFavorite, isFavorite } = usePlayerStore();
  const isInQueue = usePlayerStore(state => state.queue.some(q => q.id === song.id));
  const imageUri = getBestImage(song.image);
  const artist = decodeHtml(getArtistNames(song));
  const dur = formatDuration(song.duration);
  const favorite = isFavorite(song.id);

  return (
    <TouchableOpacity style={[styles.container, isActive && styles.active]} onPress={onPress} activeOpacity={0.7}>
      {showIndex !== undefined ? (
        <Text style={styles.index}>{showIndex + 1}</Text>
      ) : null}

      <View style={styles.imageWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="musical-note" size={20} color={Colors.textMuted} />
          </View>
        )}
        {isActive && (
          <View style={styles.activeOverlay}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="musical-notes" size={16} color={Colors.primary} />
            )}
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, isActive && styles.activeName]} numberOfLines={1}>{decodeHtml(song.name)}</Text>
        <Text style={styles.artist} numberOfLines={1}>{artist} • {dur}</Text>
      </View>

      {/* Favorite button */}
      <TouchableOpacity
        onPress={() => toggleFavorite(song)}
        style={styles.actionBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name={favorite ? 'heart' : 'heart-outline'}
          size={20}
          color={favorite ? Colors.primary : Colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Add to queue button */}
      {onAddToQueue && (
        <TouchableOpacity
          onPress={onAddToQueue}
          style={styles.actionBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={isInQueue ? 'checkmark-circle' : 'add-circle-outline'}
            size={22}
            color={isInQueue ? Colors.primary : Colors.textSecondary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  active: { backgroundColor: 'rgba(255,107,53,0.08)' },
  index: { width: 24, fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginRight: Spacing.sm },
  imageWrap: { position: 'relative', marginRight: Spacing.md },
  image: { width: 52, height: 52, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceLight },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  activeOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  activeName: { color: Colors.primary },
  artist: { fontSize: 12, color: Colors.textSecondary },
  actionBtn: { padding: 4, marginLeft: 4 },
});