import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  StatusBar, ActivityIndicator, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import { getBestImage, getArtistNames, getBestAudio } from '../api/saavn';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { formatDuration, decodeHtml } from '../utils/format';
import { Song } from '../types';
import * as FileSystem from 'expo-file-system/legacy';

export default function PlaylistsScreen() {
  const navigation = useNavigation<any>();
  const {
    queue, currentIndex, setCurrentIndex,
    removeFromQueue, setIsPlaying,
    addDownloaded, isDownloaded,
  } = usePlayerStore();

  const currentSong = queue[currentIndex];
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});

  function handlePlay(index: number) {
    setCurrentIndex(index);
    setIsPlaying(true);
    navigation.navigate('Player');
  }

  async function handleDownload(song: Song) {
    if (isDownloaded(song.id) || downloading[song.id]) return;
    const url = getBestAudio(song.downloadUrl);
    if (!url) return;
    setDownloading(prev => ({ ...prev, [song.id]: true }));
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
    setDownloading(prev => ({ ...prev, [song.id]: false }));
  }

  const renderItem = ({ item, index }: { item: Song; index: number }) => {
    const img = getBestImage(item.image);
    const artist = decodeHtml(getArtistNames(item));
    const isCurrentSong = currentSong?.id === item.id;
    const downloaded = isDownloaded(item.id);
    const isDownloading = downloading[item.id] ?? false;

    return (
      <TouchableOpacity
        style={[
          styles.songRow,
          isCurrentSong && styles.songRowActive,
        ]}
        onPress={() => handlePlay(index)}
        activeOpacity={0.7}
      >
        {/* Index / playing indicator */}
        <View style={styles.indexWrap}>
          {isCurrentSong ? (
            <Ionicons name="musical-notes" size={16} color={Colors.primary} />
          ) : (
            <Text style={styles.indexText}>{index + 1}</Text>
          )}
        </View>

        {/* Artwork */}
        {img ? (
          <Image source={{ uri: img }} style={styles.artwork} />
        ) : (
          <View style={[styles.artwork, styles.artworkPlaceholder]}>
            <Ionicons name="musical-note" size={18} color={Colors.textMuted} />
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text
            style={[styles.songName, isCurrentSong && styles.songNameActive]}
            numberOfLines={1}
          >
            {decodeHtml(item.name)}
          </Text>
          <Text style={styles.artistName} numberOfLines={1}>
            {artist} • {formatDuration(item.duration)}
          </Text>
        </View>

        {/* Download button */}
        <TouchableOpacity
          onPress={() => handleDownload(item)}
          disabled={downloaded || isDownloading}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Ionicons
              name={downloaded ? 'checkmark-circle' : 'download-outline'}
              size={20}
              color={downloaded ? Colors.success : Colors.textSecondary}
            />
          )}
        </TouchableOpacity>

        {/* Remove button */}
        <TouchableOpacity
          onPress={() => removeFromQueue(index)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.actionBtn}
        >
          <Ionicons name="close" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Queue</Text>
          <Text style={styles.subtitle}>{queue.length} songs</Text>
        </View>
      </View>

      {currentSong && (
        <TouchableOpacity
          style={styles.nowPlayingBanner}
          onPress={() => navigation.navigate('Player')}
          activeOpacity={0.8}
        >
          <View style={styles.nowPlayingLeft}>
            <Ionicons name="musical-notes" size={16} color={Colors.primary} />
            <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
          </View>
          <Text style={styles.nowPlayingSong} numberOfLines={1}>
            {decodeHtml(currentSong.name)}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {queue.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="list-outline" size={72} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>Queue is empty</Text>
          <Text style={styles.emptySubtext}>
            Tap the + icon on any song to add it to your queue
          </Text>
        </View>
      ) : (
        <FlatList
          data={queue}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  nowPlayingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,53,0.1)',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.3)',
    gap: 8,
  },
  nowPlayingLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  nowPlayingLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, letterSpacing: 1 },
  nowPlayingSong: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  listContent: { paddingBottom: 40 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    gap: 8,
  },
  songRowActive: { backgroundColor: 'rgba(255,107,53,0.06)' },
  indexWrap: { width: 20, alignItems: 'center' },
  indexText: { fontSize: 12, color: Colors.textMuted },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
  },
  artworkPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  info: { flex: 1 },
  songName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  songNameActive: { color: Colors.primary },
  artistName: { fontSize: 12, color: Colors.textSecondary },
  actionBtn: { padding: 4, width: 30, alignItems: 'center' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textSecondary },
  emptySubtext: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
});