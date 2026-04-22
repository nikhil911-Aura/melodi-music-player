import React from 'react';
import { View, Text, FlatList, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { usePlayerStore } from '../store/playerStore';
import SongCard from '../components/SongCard';
import { Colors, Spacing } from '../utils/theme';
import { Song } from '../types';

function toggleQueue(song: Song) {
  const { queue, addToQueue, removeFromQueue } = usePlayerStore.getState();
  const existingIndex = queue.findIndex(s => s.id === song.id);
  if (existingIndex >= 0) {
    removeFromQueue(existingIndex);
  } else {
    addToQueue(song);
  }
}

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const { favorites, setQueue, currentIndex, queue } = usePlayerStore();
  const currentSong = queue[currentIndex];

  function playSong(index: number) {
    setQueue([favorites[index]], 0);
    navigation.navigate('Player');
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.count}>{favorites.length} songs</Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No favorites yet</Text>
          <Text style={styles.emptySubtext}>Tap the heart on any song to add it here</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <SongCard
              song={item}
              onPress={() => playSong(index)}
              onAddToQueue={() => toggleQueue(item)}
              isActive={currentSong?.id === item.id}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: 26, fontWeight: '700', color: Colors.text },
  count: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 80,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textSecondary },
  emptySubtext: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});