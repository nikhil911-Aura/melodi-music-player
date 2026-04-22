import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Image, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage, getArtistNames } from '../api/saavn';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatDuration, decodeHtml } from '../utils/format';
import { Song } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

export default function DownloadsScreen() {
  const navigation = useNavigation<any>();
  const {
    downloadedSongs, queue, currentIndex,
    setQueue, addToQueue, isDownloaded,
  } = usePlayerStore();

  const currentSong = queue[currentIndex];
  const [downloadedSongObjects, setDownloadedSongObjects] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  // Get full song objects that are downloaded from recentlyPlayed + queue + favorites
  useEffect(() => {
    loadDownloadedSongs();
  }, [downloadedSongs]);

  async function loadDownloadedSongs() {
    setLoading(true);
    const { recentlyPlayed, favorites } = usePlayerStore.getState();

    // Collect all known songs
    const allKnownSongs = [...recentlyPlayed, ...favorites, ...queue];
    const seen = new Set<string>();
    const unique: Song[] = [];
    for (const song of allKnownSongs) {
      if (!seen.has(song.id) && isDownloaded(song.id)) {
        seen.add(song.id);
        unique.push(song);
      }
    }

    // Verify files actually exist
    const verified: Song[] = [];
    for (const song of unique) {
      const filename = `${song.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      const path = FileSystem.documentDirectory + filename;
      const info = await FileSystem.getInfoAsync(path);
      if (info.exists) {
        verified.push(song);
      }
    }

    setDownloadedSongObjects(verified);
    setLoading(false);
  }

  async function handleDelete(song: Song) {
    Alert.alert(
      'Delete Download',
      `Remove "${decodeHtml(song.name)}" from downloads?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const filename = `${song.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
              const path = FileSystem.documentDirectory + filename;
              await FileSystem.deleteAsync(path, { idempotent: true });
              // Remove from store
              usePlayerStore.setState(state => ({
                downloadedSongs: state.downloadedSongs.filter(id => id !== song.id),
              }));
              setDownloadedSongObjects(prev => prev.filter(s => s.id !== song.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete file');
            }
          },
        },
      ]
    );
  }

  function playSong(index: number) {
    setQueue([downloadedSongObjects[index]], 0);
    navigation.navigate('Player');
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading downloads...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Downloads</Text>
          <Text style={styles.subtitle}>{downloadedSongObjects.length} songs</Text>
        </View>
        {downloadedSongObjects.length > 0 && (
          <TouchableOpacity
            style={styles.playAllBtn}
            onPress={() => { setQueue(downloadedSongObjects, 0); navigation.navigate('Player'); }}
          >
            <Ionicons name="play" size={16} color={Colors.background} />
            <Text style={styles.playAllText}>Play All</Text>
          </TouchableOpacity>
        )}
      </View>

      {downloadedSongObjects.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="download-outline" size={72} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>No downloads yet</Text>
          <Text style={styles.emptySubtext}>
            Tap the download icon on any song to save it for offline listening
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloadedSongObjects}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => {
            const img = getBestImage(item.image);
            const artist = decodeHtml(getArtistNames(item));
            const isActive = currentSong?.id === item.id;

            return (
              <TouchableOpacity
                style={[styles.songRow, isActive && styles.songRowActive]}
                onPress={() => playSong(index)}
                activeOpacity={0.7}
              >
                {/* Artwork */}
                {img ? (
                  <Image source={{ uri: img }} style={styles.artwork} />
                ) : (
                  <View style={[styles.artwork, styles.artworkPlaceholder]}>
                    <Ionicons name="musical-note" size={20} color={Colors.textMuted} />
                  </View>
                )}

                {/* Info */}
                <View style={styles.info}>
                  <Text
                    style={[styles.songName, isActive && styles.songNameActive]}
                    numberOfLines={1}
                  >
                    {decodeHtml(item.name)}
                  </Text>
                  <Text style={styles.artistName} numberOfLines={1}>
                    {artist} • {formatDuration(item.duration)}
                  </Text>
                  {/* Offline badge */}
                  <View style={styles.offlineBadge}>
                    <Ionicons name="checkmark-circle" size={11} color={Colors.success} />
                    <Text style={styles.offlineText}>Available offline</Text>
                  </View>
                </View>

                {/* Add to queue */}
                <TouchableOpacity
                  onPress={() => addToQueue(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="add-circle-outline" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>

                {/* Delete */}
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={styles.actionBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 28, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  playAllText: { color: Colors.background, fontSize: 13, fontWeight: '700' },
  listContent: { paddingBottom: 40 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  songRowActive: { backgroundColor: 'rgba(255,107,53,0.06)' },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  artworkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  info: { flex: 1 },
  songName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  songNameActive: { color: Colors.primary },
  artistName: { fontSize: 12, color: Colors.textSecondary, marginBottom: 3 },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  offlineText: { fontSize: 10, color: Colors.success, fontWeight: '600' },
  actionBtn: { padding: 4 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});