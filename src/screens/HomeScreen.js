import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMusic } from '../context/MusicContext';
import { getTrendingMusic, searchMusic } from '../services/audiomackService';
import audioPlayer from '../services/audioPlayer';
import MiniPlayer from '../components/player/MiniPlayer';
import FullScreenPlayerModal from '../components/player/FullScreenPlayerModal';
import PlaylistDetailModal from '../components/playlists/PlaylistDetailModal';

export default function HomeScreen({ navigation, onSelectPlaylist }) {
  // 1. All Context Hooks
  const musicContext = useMusic() || {};
  const {
    playlists = [],
    toggleLikeTrack,
    isLiked,
    addToQueue,
    addToPlaylist,
    deletePlaylist,
  } = musicContext;

  // 2. All State Hooks (Grouped together unconditionally at the top)
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeTrack, setActiveTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);

  // 3. All Effect Hooks
  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (typeof audioPlayer?.getCurrentTrack === 'function') {
      setActiveTrack(audioPlayer.getCurrentTrack());
    }
    if (typeof audioPlayer?.getIsPlaying === 'function') {
      setIsPlaying(audioPlayer.getIsPlaying());
    }

    if (typeof audioPlayer?.addListener !== 'function') return;

    const unsubscribe = audioPlayer.addListener((event, data) => {
      if (data?.track) {
        setActiveTrack(data.track);
      }
      if (data?.isPlaying !== undefined) {
        setIsPlaying(!!data.isPlaying);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // 4. Handlers & Helper Functions
  const fetchTracks = async () => {
    setLoading(true);
    try {
      const data = await getTrendingMusic();
      setTracks(data || []);
    } catch (err) {
      console.warn('Error fetching tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (text) => {
    setSearchQuery(text);
    if (!text.trim()) {
      fetchTracks();
      return;
    }
    setLoading(true);
    try {
      const results = await searchMusic(text);
      setTracks(results || []);
    } catch (err) {
      console.warn('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track, index) => {
    if (!track) return;

    if (typeof audioPlayer?.setQueue === 'function') {
      audioPlayer.setQueue(tracks, index);
    }

    setActiveTrack(track);

    const currentPlayingTrack =
      typeof audioPlayer?.getCurrentTrack === 'function'
        ? audioPlayer.getCurrentTrack()
        : activeTrack;

    if (currentPlayingTrack?.id === track.id) {
      await audioPlayer.togglePlay(track);
    } else {
      await audioPlayer.playTrack(track);
    }
  };

  const handlePlaylistClick = (playlist) => {
    if (typeof onSelectPlaylist === 'function') {
      onSelectPlaylist(playlist);
      return;
    }

    setSelectedPlaylist(playlist);
    setIsPlaylistModalVisible(true);
  };

  const displayedPlaylists =
    playlists.length > 0
      ? playlists
      : [
          {
            id: '1',
            title: 'soft tagalog playlist',
            artwork:
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
          },
          {
            id: '2',
            title: 'DJ Hits',
            artwork:
              'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80',
          },
          {
            id: '3',
            title: 'OPM Favorites',
            artwork:
              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
          },
          {
            id: '4',
            title: 'Acoustic Chill',
            artwork:
              'https://images.unsplash.com/photo-1445985543470-41fba5c3144a?w=300&q=80',
          },
          {
            id: '5',
            title: 'Late Night Vibes',
            artwork:
              'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
          },
          {
            id: '6',
            title: 'Workout Energy',
            artwork:
              'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&q=80',
          },
        ];

  // 5. Render Components
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar with Avatar & Filter Pills */}
      <View style={styles.topProfileBar}>
        <TouchableOpacity style={styles.avatarBtn}>
          <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
            }}
            style={styles.avatarImage}
          />
        </TouchableOpacity>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
        >
          {['All', 'Music', 'Podcasts'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.pill, activeTab === tab && styles.pillActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.pillText,
                  activeTab === tab && styles.pillTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 2-Column Grid for Stored App Playlists */}
      <View style={styles.gridContainer}>
        {displayedPlaylists.slice(0, 8).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.gridCard}
            activeOpacity={0.8}
            onPress={() => handlePlaylistClick(item)}
          >
            <Image
              source={{
                uri:
                  item.artwork ||
                  item.cover ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&q=80',
              }}
              style={styles.gridCardImage}
            />
            <Text style={styles.gridCardTitle} numberOfLines={2}>
              {item.title || item.name || 'Playlist'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Section 1: It's New Music Friday! */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>It's New Music Friday!</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalSectionScroll}
      >
        {tracks.slice(0, 6).map((item, index) => (
          <TouchableOpacity
            key={`nmf-${item.id}-${index}`}
            style={styles.mediaCard}
            activeOpacity={0.8}
            onPress={() => handlePlayTrack(item, index)}
          >
            <Image
              source={{
                uri:
                  item.artwork ||
                  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
              }}
              style={styles.mediaCardImage}
            />
            <Text style={styles.mediaCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.mediaCardSubtitle} numberOfLines={2}>
              {item.artist}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section 2: Made For You */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Made For You</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalSectionScroll}
      >
        {tracks.slice(6, 12).map((item, index) => (
          <TouchableOpacity
            key={`mfy-${item.id}-${index}`}
            style={styles.mediaCard}
            activeOpacity={0.8}
            onPress={() => handlePlayTrack(item, index + 6)}
          >
            <Image
              source={{
                uri:
                  item.artwork ||
                  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
              }}
              style={styles.mediaCardImage}
            />
            <Text style={styles.mediaCardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.mediaCardSubtitle} numberOfLines={2}>
              {item.artist}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Section 3: Recommended Tracks Header */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
        Recommended Tracks
      </Text>
    </View>
  );

  const renderTrackItem = ({ item, index }) => {
    const isCurrent = activeTrack?.id === item.id;
    const liked = typeof isLiked === 'function' ? isLiked(item.id) : false;

    return (
      <TouchableOpacity
        style={[styles.trackRow, isCurrent && styles.trackRowActive]}
        activeOpacity={0.7}
        onPress={() => handlePlayTrack(item, index)}
      >
        <Image
          source={{
            uri:
              item.artwork ||
              'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
          }}
          style={styles.trackArtwork}
        />

        <View style={styles.trackInfo}>
          <Text
            style={[styles.trackTitle, isCurrent && styles.greenText]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {item.artist}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={() =>
              typeof toggleLikeTrack === 'function' && toggleLikeTrack(item)
            }
            style={styles.iconBtn}
          >
            <Text
              style={{ color: liked ? '#1DB954' : '#B3B3B3', fontSize: 16 }}
            >
              {liked ? '💚' : '♡'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              typeof addToQueue === 'function' && addToQueue(item)
            }
            style={styles.iconBtn}
          >
            <Text style={{ color: '#B3B3B3', fontSize: 18, fontWeight: 'bold' }}>
              ≡
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="What do you want to listen to?"
          placeholderTextColor="#777"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#1DB954" />
        </View>
      ) : (
        <FlatList
          data={tracks}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderTrackItem}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* MiniPlayer */}
      <MiniPlayer onPress={() => setIsPlayerModalVisible(true)} />

      {/* Full Screen Player Modal */}
      <FullScreenPlayerModal
        visible={isPlayerModalVisible}
        track={activeTrack}
        isPlaying={isPlaying}
        onClose={() => setIsPlayerModalVisible(false)}
      />

      {/* Playlist Detail Modal */}
      <PlaylistDetailModal
        visible={isPlaylistModalVisible}
        playlist={selectedPlaylist}
        onClose={() => setIsPlaylistModalVisible(false)}
        onPlayTrack={(track) => handlePlayTrack(track, 0)}
        currentTrack={activeTrack}
        onAddToQueue={addToQueue}
        onAddToPlaylist={addToPlaylist}
        onToggleFavorite={toggleLikeTrack}
        isLiked={isLiked}
        onDeletePlaylist={deletePlaylist}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 10 : 0,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topProfileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarBtn: {
    marginRight: 12,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  pillsScroll: {
    flex: 1,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    backgroundColor: '#282828',
    borderRadius: 20,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: '#1DB954',
  },
  pillText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  pillTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  gridCard: {
    width: '48.5%',
    height: 56,
    backgroundColor: '#282828',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  gridCardImage: {
    width: 56,
    height: 56,
    backgroundColor: '#333',
  },
  gridCardTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  horizontalSectionScroll: {
    marginBottom: 16,
    marginLeft: -16,
    paddingLeft: 16,
  },
  mediaCard: {
    width: 150,
    marginRight: 16,
  },
  mediaCardImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    backgroundColor: '#282828',
  },
  mediaCardTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
  },
  mediaCardSubtitle: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  listContent: {
    paddingBottom: 130,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  trackRowActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.08)',
  },
  trackArtwork: {
    width: 44,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#282828',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trackTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  trackArtist: {
    color: '#B3B3B3',
    fontSize: 12,
    marginTop: 2,
  },
  greenText: {
    color: '#1DB954',
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    marginLeft: 4,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});