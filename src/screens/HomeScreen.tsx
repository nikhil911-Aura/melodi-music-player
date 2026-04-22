import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, TouchableOpacity,
  Image, ScrollView, ActivityIndicator, RefreshControl, StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Song, Artist, Album } from '../types';
import {
  getTrendingSongs, searchSongs, searchArtists, searchAlbums,
  getBestImage, getBollywoodHits, getArtistSongs, getArtistNames,
} from '../api/saavn';
import { usePlayerStore } from '../store/playerStore';
import SongCard from '../components/SongCard';
import { Colors, Spacing, BorderRadius } from '../utils/theme';
import { decodeHtml } from '../utils/format';

type Tab = 'Suggested' | 'Songs' | 'Artists' | 'Albums';

interface PagedState<T> {
  data: T[];
  page: number;
  hasMore: boolean;
}

function initPaged<T>(): PagedState<T> {
  return { data: [], page: 1, hasMore: true };
}

function RecentlyPlayedSection() {
  const { recentlyPlayed, setQueue } = usePlayerStore();
  const navigation = useNavigation<any>();

  if (recentlyPlayed.length === 0) return null;

  return (
    <View style={recentStyles.container}>
      <Text style={recentStyles.title}>Recently Played</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={recentStyles.list}
      >
        {recentlyPlayed.slice(0, 10).map((song, index) => {
          const img = getBestImage(song.image);
          return (
            <TouchableOpacity
              key={`${song.id}-${index}`}
              style={recentStyles.item}
              onPress={() => {
                setQueue([recentlyPlayed[index]], 0);
                navigation.navigate('Player');
              }}
              activeOpacity={0.7}
            >
              {img ? (
                <Image source={{ uri: img }} style={recentStyles.image} />
              ) : (
                <View style={[recentStyles.image, recentStyles.placeholder]}>
                  <Ionicons name="musical-note" size={24} color={Colors.textMuted} />
                </View>
              )}
              <Text style={recentStyles.name} numberOfLines={2}>{decodeHtml(song.name)}</Text>
              <Text style={recentStyles.artist} numberOfLines={1}>
                {decodeHtml(getArtistNames(song))}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const recentStyles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  list: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  item: { width: 100 },
  image: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  name: { fontSize: 11, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  artist: { fontSize: 10, color: Colors.textSecondary },
});

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { setQueue, currentIndex, queue, isLoading: playerLoading } = usePlayerStore();

  const [activeTab, setActiveTab] = useState<Tab>('Suggested');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searching, setSearching] = useState(false);

  const [suggested, setSuggested] = useState<PagedState<Song>>(initPaged());
  const [songs, setSongs] = useState<PagedState<Song>>(initPaged());
  const [artists, setArtists] = useState<PagedState<Artist>>(initPaged());
  const [albums, setAlbums] = useState<PagedState<Album>>(initPaged());

  const [searchSongsState, setSearchSongsState] = useState<PagedState<Song>>(initPaged());
  const [searchArtistsState, setSearchArtistsState] = useState<PagedState<Artist>>(initPaged());
  const [searchAlbumsState, setSearchAlbumsState] = useState<PagedState<Album>>(initPaged());

  const [detailModal, setDetailModal] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailImage, setDetailImage] = useState('');
  const [detailSongs, setDetailSongs] = useState<Song[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const isSearchMode = searchQuery.trim().length > 0;
  const currentSong = queue[currentIndex];
  const loadingMoreRef = useRef(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { loadInitial(); }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const [trendRes, bollRes, artRes, albRes] = await Promise.all([
        getTrendingSongs(1),
        getBollywoodHits(1),
        searchArtists('arijit singh', 1),
        searchAlbums('best hindi albums', 1),
      ]);
      setSuggested({ data: trendRes.results, page: 1, hasMore: trendRes.results.length < trendRes.total });
      setSongs({ data: bollRes.results, page: 1, hasMore: bollRes.results.length < bollRes.total });
      setArtists({ data: artRes.results, page: 1, hasMore: artRes.results.length < artRes.total });
      setAlbums({ data: albRes.results, page: 1, hasMore: albRes.results.length < albRes.total });
    } catch (e) {}
    setLoading(false);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchSongsState(initPaged());
      setSearchArtistsState(initPaged());
      setSearchAlbumsState(initPaged());
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        if (activeTab === 'Suggested' || activeTab === 'Songs') {
          const res = await searchSongs(searchQuery, 1);
          setSearchSongsState({ data: res.results, page: 1, hasMore: res.results.length < res.total });
        } else if (activeTab === 'Artists') {
          const res = await searchArtists(searchQuery, 1);
          setSearchArtistsState({ data: res.results, page: 1, hasMore: res.results.length < res.total });
        } else if (activeTab === 'Albums') {
          const res = await searchAlbums(searchQuery, 1);
          setSearchAlbumsState({ data: res.results, page: 1, hasMore: res.results.length < res.total });
        }
      } catch {}
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery, activeTab]);

  async function handleLoadMore() {
    if (loadingMoreRef.current || loadingMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      if (isSearchMode) {
        if (activeTab === 'Suggested' || activeTab === 'Songs') {
          if (!searchSongsState.hasMore) return;
          const next = searchSongsState.page + 1;
          const res = await searchSongs(searchQuery, next);
          if (res.results.length > 0) {
            setSearchSongsState(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setSearchSongsState(prev => ({ ...prev, hasMore: false }));
        } else if (activeTab === 'Artists') {
          if (!searchArtistsState.hasMore) return;
          const next = searchArtistsState.page + 1;
          const res = await searchArtists(searchQuery, next);
          if (res.results.length > 0) {
            setSearchArtistsState(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setSearchArtistsState(prev => ({ ...prev, hasMore: false }));
        } else if (activeTab === 'Albums') {
          if (!searchAlbumsState.hasMore) return;
          const next = searchAlbumsState.page + 1;
          const res = await searchAlbums(searchQuery, next);
          if (res.results.length > 0) {
            setSearchAlbumsState(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setSearchAlbumsState(prev => ({ ...prev, hasMore: false }));
        }
      } else {
        if (activeTab === 'Suggested') {
          if (!suggested.hasMore) return;
          const next = suggested.page + 1;
          const res = await getTrendingSongs(next);
          if (res.results.length > 0) {
            setSuggested(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setSuggested(prev => ({ ...prev, hasMore: false }));
        } else if (activeTab === 'Songs') {
          if (!songs.hasMore) return;
          const next = songs.page + 1;
          const res = await getBollywoodHits(next);
          if (res.results.length > 0) {
            setSongs(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setSongs(prev => ({ ...prev, hasMore: false }));
        } else if (activeTab === 'Artists') {
          if (!artists.hasMore) return;
          const next = artists.page + 1;
          const res = await searchArtists('arijit singh', next);
          if (res.results.length > 0) {
            setArtists(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setArtists(prev => ({ ...prev, hasMore: false }));
        } else if (activeTab === 'Albums') {
          if (!albums.hasMore) return;
          const next = albums.page + 1;
          const res = await searchAlbums('best hindi albums', next);
          if (res.results.length > 0) {
            setAlbums(prev => ({ data: [...prev.data, ...res.results], page: next, hasMore: (prev.data.length + res.results.length) < res.total }));
          } else setAlbums(prev => ({ ...prev, hasMore: false }));
        }
      }
    } catch (e) {}
    setLoadingMore(false);
    loadingMoreRef.current = false;
  }

  async function openArtist(artist: Artist) {
    setDetailTitle(decodeHtml(artist.name));
    setDetailImage(getBestImage((artist as any).image || []));
    setDetailSongs([]);
    setDetailModal(true);
    setDetailLoading(true);
    try {
      let songList = await getArtistSongs(artist.id);
      if (!songList || songList.length === 0) {
        const res = await searchSongs(artist.name, 1);
        songList = res.results;
      }
      setDetailSongs(songList);
    } catch {
      try {
        const res = await searchSongs(artist.name, 1);
        setDetailSongs(res.results);
      } catch {}
    }
    setDetailLoading(false);
  }

  async function openAlbum(album: Album) {
    setDetailTitle(decodeHtml(album.name));
    setDetailImage(getBestImage((album as any).image || []));
    setDetailSongs([]);
    setDetailModal(true);
    setDetailLoading(true);
    try {
      const res = await searchSongs(album.name, 1);
      setDetailSongs(res.results);
    } catch {}
    setDetailLoading(false);
  }

  function playSong(songList: Song[], index: number) {
    setQueue(songList, index);
    navigation.navigate('Player');
  }

  function playSingle(song: Song) {
    setQueue([song], 0);
    navigation.navigate('Player');
  }

  // ── Toggle queue — add if not in queue, remove if already in ──
  function toggleQueue(song: Song) {
    const { queue, addToQueue, removeFromQueue } = usePlayerStore.getState();
    const existingIndex = queue.findIndex(s => s.id === song.id);
    if (existingIndex >= 0) {
      removeFromQueue(existingIndex);
    } else {
      addToQueue(song);
    }
  }

  function getCurrentSongs(): Song[] {
    if (isSearchMode) return searchSongsState.data;
    return activeTab === 'Songs' ? songs.data : suggested.data;
  }

  const Footer = () => (loadingMore || searching)
    ? <ActivityIndicator style={{ margin: 20 }} color={Colors.primary} />
    : null;

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderArtistItem = ({ item }: { item: Artist }) => {
    const img = getBestImage((item as any).image || []);
    return (
      <TouchableOpacity style={styles.artistRow} onPress={() => openArtist(item)} activeOpacity={0.7}>
        {img
          ? <Image source={{ uri: img }} style={styles.artistImage} />
          : <View style={[styles.artistImage, styles.placeholderBox]}><Ionicons name="person" size={20} color={Colors.textMuted} /></View>
        }
        <Text style={styles.rowName} numberOfLines={1}>{decodeHtml(item.name)}</Text>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const renderAlbumItem = ({ item }: { item: Album }) => {
    const img = getBestImage((item as any).image || []);
    const artistName = (item as any).artists?.primary?.map((a: any) => a.name).join(', ') || '';
    return (
      <TouchableOpacity style={styles.albumRow} onPress={() => openAlbum(item)} activeOpacity={0.7}>
        {img
          ? <Image source={{ uri: img }} style={styles.albumImage} />
          : <View style={[styles.albumImage, styles.placeholderBox]}><Ionicons name="disc" size={20} color={Colors.textMuted} /></View>
        }
        <View style={{ flex: 1 }}>
          <Text style={styles.rowName} numberOfLines={1}>{decodeHtml(item.name)}</Text>
          <Text style={styles.rowSub} numberOfLines={1}>
            {decodeHtml(artistName)}{(item as any).year ? ` • ${(item as any).year}` : ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    );
  };

  const displaySongs = getCurrentSongs();
  const displayArtists = isSearchMode ? searchArtistsState.data : artists.data;
  const displayAlbums = isSearchMode ? searchAlbumsState.data : albums.data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Ionicons name="musical-notes" size={26} color={Colors.primary} />
            <Text style={styles.appName}>Melodi</Text>
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search songs, artists, albums..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); inputRef.current?.focus(); }}>
              <Ionicons name="close-circle" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabs}
          contentContainerStyle={styles.tabsContent}
        >
          {(['Suggested', 'Songs', 'Artists', 'Albums'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {(activeTab === 'Suggested' || activeTab === 'Songs') && (
        <FlatList
          data={displaySongs}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          ListHeaderComponent={
            <View>
              {activeTab === 'Suggested' && !isSearchMode && <RecentlyPlayedSection />}
              <View style={styles.countRow}>
                <Text style={styles.countText}>
                  {isSearchMode ? `${displaySongs.length} results` : `${displaySongs.length} songs`}
                </Text>
              </View>
            </View>
          }
          renderItem={({ item, index }) => (
            <SongCard
              song={item}
              onPress={() => playSingle(displaySongs[index])}
              onAddToQueue={() => toggleQueue(item)}
              isActive={currentSong?.id === item.id}
              isLoading={currentSong?.id === item.id && playerLoading}
            />
          )}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<Footer />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {activeTab === 'Artists' && (
        <FlatList
          data={displayArtists}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderArtistItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<Footer />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {activeTab === 'Albums' && (
        <FlatList
          data={displayAlbums}
          keyExtractor={(item, i) => `${item.id}-${i}`}
          renderItem={renderAlbumItem}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<Footer />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      <Modal visible={detailModal} animationType="slide" onRequestClose={() => setDetailModal(false)}>
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setDetailModal(false)} style={styles.modalBack}>
              <Ionicons name="chevron-down" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{detailTitle}</Text>
            <View style={{ width: 40 }} />
          </View>

          {detailImage ? (
            <Image source={{ uri: detailImage }} style={styles.modalCover} />
          ) : (
            <View style={[styles.modalCover, styles.placeholderBox]}>
              <Ionicons name="musical-notes" size={48} color={Colors.textMuted} />
            </View>
          )}

          {detailSongs.length > 0 && (
            <TouchableOpacity
              style={styles.playAllBtn}
              onPress={() => { playSong(detailSongs, 0); setDetailModal(false); }}
            >
              <Ionicons name="play" size={18} color={Colors.background} />
              <Text style={styles.playAllText}>Play All ({detailSongs.length})</Text>
            </TouchableOpacity>
          )}

          {detailLoading ? (
            <View style={styles.modalLoading}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading songs...</Text>
            </View>
          ) : detailSongs.length === 0 ? (
            <View style={styles.modalLoading}>
              <Ionicons name="musical-notes-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.loadingText}>No songs found</Text>
            </View>
          ) : (
            <FlatList
              data={detailSongs}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              renderItem={({ item, index }) => (
                <SongCard
                  song={item}
                  onPress={() => { playSingle(detailSongs[index]); setDetailModal(false); }}
                  onAddToQueue={() => toggleQueue(item)}
                  showIndex={index}
                  isActive={currentSong?.id === item.id}
                  isLoading={currentSong?.id === item.id && playerLoading}
                />
              )}
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { color: Colors.textSecondary, marginTop: 12, fontSize: 14 },
  fixedHeader: { backgroundColor: Colors.background, zIndex: 10, paddingBottom: 4 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.sm,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appName: { fontSize: 22, fontWeight: '700', color: Colors.text },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    gap: 10, borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  tabs: { marginBottom: 4 },
  tabsContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: BorderRadius.full },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  countRow: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, marginBottom: 4 },
  countText: { color: Colors.textSecondary, fontSize: 12 },
  listContent: { paddingBottom: 20 },
  artistRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md,
  },
  artistImage: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface },
  albumRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.md,
  },
  albumImage: { width: 52, height: 52, borderRadius: BorderRadius.sm, backgroundColor: Colors.surface },
  placeholderBox: { justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surfaceLight },
  rowName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  rowSub: { fontSize: 12, color: Colors.textSecondary },
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalBack: { width: 40 },
  modalTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  modalCover: {
    width: 150, height: 150, borderRadius: BorderRadius.lg,
    alignSelf: 'center', marginVertical: Spacing.md, backgroundColor: Colors.surface,
  },
  playAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primary, marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full, paddingVertical: 12,
    gap: 8, marginBottom: Spacing.md,
  },
  playAllText: { color: Colors.background, fontWeight: '700', fontSize: 15 },
  modalLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
});