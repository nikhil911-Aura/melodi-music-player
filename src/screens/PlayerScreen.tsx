import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator,
  SafeAreaView, Dimensions, StatusBar, FlatList, Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage, getArtistNames } from '../api/saavn';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatDuration, decodeHtml } from '../utils/format';
import { seek } from '../hooks/useAudioPlayer';
import * as FileSystem from 'expo-file-system/legacy';

const { width } = Dimensions.get('window');
const ARTWORK_SIZE = width - 80;

export default function PlayerScreen() {
  const navigation = useNavigation();
  const {
    queue, currentIndex, isPlaying, currentPosition, duration,
    isLoading, shuffleMode, repeatMode, setIsPlaying,
    playNext, playPrevious, toggleShuffle, toggleRepeat,
    toggleFavorite, isFavorite, setCurrentIndex, addDownloaded, isDownloaded,
  } = usePlayerStore();

  const [showQueue, setShowQueue] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isSlidingLocally, setIsSlidingLocally] = useState(false);
  const [localSeekValue, setLocalSeekValue] = useState(0);

  const song = queue[currentIndex];
  if (!song) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="musical-notes-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No song playing</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const imageUri = getBestImage(song.image);
  const artist = getArtistNames(song);
  const favorite = isFavorite(song.id);
  const downloaded = isDownloaded(song.id);

  const sliderValue = isSlidingLocally
    ? localSeekValue
    : (duration > 0 ? currentPosition / duration : 0);

  async function handleDownload() {
    if (downloaded) return;
    const url = song.downloadUrl?.find(d => d.quality === '320kbps')?.url
      || song.downloadUrl?.[song.downloadUrl.length - 1]?.url;
    if (!url) return;
    setDownloading(true);
    try {
      const filename = `${song.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      const dest = FileSystem.documentDirectory + filename;
      const result = await FileSystem.downloadAsync(url, dest);
      if (result.status === 200) {
        addDownloaded(song.id);
        Alert.alert('✅ Downloaded', `${decodeHtml(song.name)} saved!`);
      } else {
        Alert.alert('Error', 'Download failed');
      }
    } catch (e) {
      console.log('Download error:', e);
      Alert.alert('Error', 'Failed to download song');
    }
    setDownloading(false);
  }

  const repeatColor = repeatMode !== 'off' ? Colors.primary : Colors.textSecondary;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-down" size={28} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>NOW PLAYING</Text>
        </View>
        <TouchableOpacity onPress={() => setShowQueue(!showQueue)}>
          <Ionicons name="list" size={24} color={showQueue ? Colors.primary : Colors.text} />
        </TouchableOpacity>
      </View>

      {showQueue ? (
        <QueuePanel
          queue={queue}
          currentIndex={currentIndex}
          onSelect={(i) => setCurrentIndex(i)}
          onClose={() => setShowQueue(false)}
        />
      ) : (
        <View style={styles.content}>
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.artwork} />
            ) : (
              <View style={[styles.artwork, styles.artworkPlaceholder]}>
                <Ionicons name="musical-note" size={80} color={Colors.textMuted} />
              </View>
            )}
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            )}
          </View>

          {/* Song info */}
          <View style={styles.infoRow}>
            <View style={styles.infoText}>
              <Text style={styles.songName} numberOfLines={1}>{decodeHtml(song.name)}</Text>
              <Text style={styles.artistName} numberOfLines={1}>{decodeHtml(artist)}</Text>
              {song.album?.name && (
                <Text style={styles.albumName} numberOfLines={1}>{decodeHtml(song.album.name)}</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => toggleFavorite(song)}>
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={26}
                color={favorite ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Seek Bar */}
          <View style={styles.seekContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={sliderValue}
              minimumTrackTintColor={Colors.primary}
              maximumTrackTintColor={Colors.border}
              thumbTintColor={Colors.primary}
              onSlidingStart={(val) => {
                setIsSlidingLocally(true);
                setLocalSeekValue(val);
              }}
              onValueChange={(val) => {
                setLocalSeekValue(val);
              }}
              onSlidingComplete={async (val) => {
                await seek(val * duration);
                setIsSlidingLocally(false);
              }}
            />
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>
                {formatDuration(isSlidingLocally ? localSeekValue * duration : currentPosition)}
              </Text>
              <Text style={styles.timeText}>{formatDuration(duration)}</Text>
            </View>
          </View>

          {/* Main Controls */}
          <View style={styles.controls}>
            <TouchableOpacity onPress={toggleShuffle}>
              <Ionicons
                name="shuffle"
                size={22}
                color={shuffleMode ? Colors.primary : Colors.textSecondary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={playPrevious} style={styles.skipBtn}>
              <Ionicons name="play-skip-back" size={32} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsPlaying(!isPlaying)}
              style={styles.playButton}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.background} />
              ) : (
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={34}
                  color={Colors.background}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={playNext} style={styles.skipBtn}>
              <Ionicons name="play-skip-forward" size={32} color={Colors.text} />
            </TouchableOpacity>

            <TouchableOpacity onPress={toggleRepeat}>
              <View>
                <Ionicons name="repeat" size={22} color={repeatColor} />
                {repeatMode === 'track' && (
                  <Text style={styles.repeatBadge}>1</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {/* Extra Controls */}
          <View style={styles.extraControls}>
            <TouchableOpacity onPress={handleDownload} disabled={downloaded || downloading}>
              {downloading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Ionicons
                  name={downloaded ? 'checkmark-circle' : 'download-outline'}
                  size={24}
                  color={downloaded ? Colors.success : Colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function QueuePanel({ queue, currentIndex, onSelect, onClose }: {
  queue: any[]; currentIndex: number; onSelect: (i: number) => void; onClose: () => void;
}) {
  const { removeFromQueue } = usePlayerStore();
  return (
    <View style={styles.queuePanel}>
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>Queue ({queue.length})</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={queue}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={({ item, index }) => {
          const img = getBestImage(item.image);
          const isActive = index === currentIndex;
          return (
            <TouchableOpacity
              style={[styles.queueItem, isActive && styles.queueItemActive]}
              onPress={() => onSelect(index)}
            >
              {img ? (
                <Image source={{ uri: img }} style={styles.queueImage} />
              ) : (
                <View style={[styles.queueImage, { backgroundColor: Colors.surfaceLight, justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="musical-note" size={14} color={Colors.textMuted} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.queueItemName, isActive && { color: Colors.primary }]} numberOfLines={1}>
                  {decodeHtml(item.name)}
                </Text>
                <Text style={styles.queueItemArtist} numberOfLines={1}>{getArtistNames(item)}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFromQueue(index)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 2 },
  content: { flex: 1, paddingHorizontal: Spacing.lg },
  artworkContainer: {
    alignSelf: 'center',
    marginVertical: Spacing.lg,
    position: 'relative',
  },
  artwork: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.surface,
  },
  artworkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  infoText: { flex: 1, marginRight: Spacing.md },
  songName: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  artistName: { fontSize: 14, color: Colors.textSecondary, marginBottom: 2 },
  albumName: { fontSize: 12, color: Colors.textMuted },
  seekContainer: { marginBottom: Spacing.md },
  slider: { width: '100%', height: 40 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -8 },
  timeText: { fontSize: 12, color: Colors.textSecondary },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  skipBtn: { padding: 4 },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  repeatBadge: {
    position: 'absolute',
    right: -4,
    top: -4,
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.textSecondary, fontSize: 16 },
  backBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  backBtnText: { color: Colors.white, fontWeight: '600' },
  queuePanel: { flex: 1 },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  queueTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  queueItemActive: { backgroundColor: 'rgba(255,107,53,0.08)' },
  queueImage: { width: 44, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface },
  queueItemName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  queueItemArtist: { fontSize: 11, color: Colors.textSecondary },
});