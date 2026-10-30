import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SPACE } from '../../constants/theme';
import audioPlayer from '../../services/audioPlayer';

export const TABS = {
  HOME: 'Home',
  SEARCH: 'Search',
  LIBRARY: 'Your Library',
  CREATE: 'Create',
};

const BottomNavBar = ({ activeTab, onSelectTab, onOpenPlayer }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(230);

  useEffect(() => {
    // Sync initial state on mount
    if (typeof audioPlayer?.getCurrentTrack === 'function') {
      setCurrentTrack(audioPlayer.getCurrentTrack());
    }
    if (typeof audioPlayer?.getIsPlaying === 'function') {
      setIsPlaying(audioPlayer.getIsPlaying());
    }

    // Subscribe to status and progress updates from audioPlayer
    if (typeof audioPlayer?.addListener !== 'function') return;

    const unsubscribe = audioPlayer.addListener((event, data) => {
      if (data?.track) {
        setCurrentTrack(data.track);
      }
      if (data?.isPlaying !== undefined) {
        setIsPlaying(!!data.isPlaying);
      }
      if (data?.currentTime !== undefined) {
        setCurrentTime(data.currentTime);
      }
      if (data?.duration !== undefined) {
        setDuration(data.duration);
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const tabs = [
    { id: TABS.HOME, label: 'Home', icon: '🏠' },
    { id: TABS.SEARCH, label: 'Search', icon: '🔍' },
    { id: TABS.LIBRARY, label: 'Your Library', icon: '📚' },
    { id: TABS.CREATE, label: 'Create', icon: '➕' },
  ];

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (typeof audioPlayer?.togglePlay === 'function') {
      audioPlayer.togglePlay(currentTrack);
    }
  };

  const progressPercentage = Math.min(
    100,
    ((currentTime || 0) / (duration || 230)) * 100
  );

  return (
    <View style={styles.wrapper}>
      {/* Embedded Mini Player (Floating Spotify-like Card) */}
      {currentTrack && (
        <TouchableOpacity
          style={styles.miniPlayerContainer}
          activeOpacity={0.9}
          onPress={onOpenPlayer}
        >
          <Image
            source={{
              uri:
                currentTrack.artwork ||
                'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
            }}
            style={styles.artwork}
          />

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title || 'Unknown Track'}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist || 'Unknown Artist'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.playButton}
            onPress={handleTogglePlay}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.playIcon}>{isPlaying ? '⏸' : '▶'}</Text>
          </TouchableOpacity>

          {/* Bottom Progress Bar */}
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation Tab Bar */}
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.tabButton}
              activeOpacity={0.7}
              onPress={() => onSelectTab(tab.id)}
            >
              <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                {tab.icon}
              </Text>
              <Text
                style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'transparent',
  },
  /* Floating Mini Player Styles */
  miniPlayerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#212121',
    marginHorizontal: 8,
    marginBottom: 6,
    height: 56,
    borderRadius: 8,
    paddingHorizontal: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
  },
  artwork: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  trackInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  trackTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  trackArtist: {
    color: COLORS?.textMuted || '#B3B3B3',
    fontSize: 11,
    marginTop: 2,
  },
  playButton: {
    padding: 8,
  },
  playIcon: {
    color: '#FFF',
    fontSize: 18,
  },
  progressBarBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1DB954',
  },
  /* Navigation Tab Bar Styles */
  container: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: '#0F0F0F',
    borderTopWidth: 1,
    borderTopColor: '#202020',
    paddingHorizontal: SPACE?.sm || 8,
    paddingBottom: 4,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 3,
    opacity: 0.65,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    color: COLORS?.textMuted || '#B3B3B3',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: COLORS?.white || '#FFF',
    fontWeight: 'bold',
  },
});

export default BottomNavBar;