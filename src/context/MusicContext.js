import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MOCK_TRACKS } from '../services/audiomackService';
import audioPlayer from '../services/audioPlayer';

const MusicContext = createContext(null);

const STORAGE_KEYS = {
    PLAYLISTS: '@spotify_user_playlists_v2',
    LIKED_TRACKS: '@spotify_liked_tracks_v2',
    RECENTS: '@spotify_recents_v2',
    USER_QUEUE: '@spotify_user_queue_v2',
};

// Initial default curated playlists
const DEFAULT_PLAYLISTS = [
    {
        id: 'pl-liked',
        title: 'Liked Songs',
        description: 'Auto-saved favorite songs',
        icon: '💚',
        type: 'Playlist • Auto',
        isDefault: true,
        tracks: [MOCK_TRACKS[0], MOCK_TRACKS[1], MOCK_TRACKS[2]],
    },
    {
        id: 'pl-top-hits',
        title: 'Top Hits 2026',
        description: 'The hottest bangers globally right now',
        icon: '🔥',
        type: 'Playlist • Spotify',
        isDefault: false,
        tracks: [MOCK_TRACKS[1], MOCK_TRACKS[3], MOCK_TRACKS[4]],
    },
    {
        id: 'pl-chill',
        title: 'Late Night Chill',
        description: 'Smooth beats and mellow vibes for unwinding',
        icon: '🌙',
        type: 'Playlist • You',
        isDefault: false,
        tracks: [MOCK_TRACKS[0], MOCK_TRACKS[3]],
    },
    {
        id: 'pl-workout',
        title: 'Workout Energy',
        description: 'High-tempo tracks to smash your personal bests',
        icon: '⚡',
        type: 'Playlist • You',
        isDefault: false,
        tracks: [MOCK_TRACKS[2], MOCK_TRACKS[5], MOCK_TRACKS[6] || MOCK_TRACKS[0]],
    },
    {
        id: 'pl-daily-1',
        title: 'Daily Mix 1',
        description: 'The Weeknd, Drake and similar artists',
        icon: '🎧',
        type: 'Made for You',
        isDefault: false,
        tracks: [MOCK_TRACKS[1], MOCK_TRACKS[2]],
    },
];

export const MusicProvider = ({ children }) => {
    const [playlists, setPlaylists] = useState(DEFAULT_PLAYLISTS);
    const [likedTrackIds, setLikedTrackIds] = useState(['track-1', 'track-2', 'track-3']);
    const [userQueue, setUserQueue] = useState([]);
    const [recentTracks, setRecentTracks] = useState([]);
    const [toast, setToast] = useState(null); // { message, icon, id }

    // Load persisted state on mount
    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const storedPlaylists = await AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS);
                if (storedPlaylists) {
                    const parsed = JSON.parse(storedPlaylists);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setPlaylists(parsed);
                    }
                }

                const storedLiked = await AsyncStorage.getItem(STORAGE_KEYS.LIKED_TRACKS);
                if (storedLiked) {
                    const parsedLiked = JSON.parse(storedLiked);
                    if (Array.isArray(parsedLiked)) {
                        setLikedTrackIds(parsedLiked);
                    }
                }

                const storedRecents = await AsyncStorage.getItem(STORAGE_KEYS.RECENTS);
                if (storedRecents) {
                    const parsedRecents = JSON.parse(storedRecents);
                    if (Array.isArray(parsedRecents)) {
                        setRecentTracks(parsedRecents);
                    }
                } else {
                    // Seed initial recents
                    setRecentTracks([
                        { ...MOCK_TRACKS[0], playedAt: Date.now() - 1000 * 60 * 12 },
                        { ...MOCK_TRACKS[1], playedAt: Date.now() - 1000 * 60 * 45 },
                        { ...MOCK_TRACKS[2], playedAt: Date.now() - 1000 * 60 * 180 },
                        { ...MOCK_TRACKS[3], playedAt: Date.now() - 1000 * 60 * 60 * 24 },
                    ]);
                }
            } catch (err) {
                console.warn('Error loading persisted music data:', err);
            }
        };

        loadPersistedData();
    }, []);

    // Helper: Show floating toast
    const showToast = useCallback((message, icon = '✓') => {
        setToast({ message, icon, id: Date.now() });
    }, []);

    // Dismiss toast after 2.5s
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => {
            setToast(null);
        }, 2600);
        return () => clearTimeout(timer);
    }, [toast]);

    // Save playlists
    const savePlaylists = async (newList) => {
        setPlaylists(newList);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(newList));
        } catch (err) {
            console.warn('Error saving playlists:', err);
        }
    };

    // Create a new playlist
    const createPlaylist = useCallback(async ({ title, description = '', icon = '🎶' }) => {
        if (!title || !title.trim()) return null;
        const cleanTitle = title.trim();
        const newPlaylist = {
            id: `pl-${Date.now()}`,
            title: cleanTitle,
            description: description.trim() || 'Custom playlist created by you',
            icon: icon || '🎶',
            type: 'Playlist • You',
            isDefault: false,
            tracks: [],
            createdAt: Date.now(),
        };

        const updated = [newPlaylist, ...playlists];
        await savePlaylists(updated);
        showToast(`Created playlist "${cleanTitle}"`, '🎉');
        return newPlaylist;
    }, [playlists, showToast]);

    // Delete a playlist
    const deletePlaylist = useCallback(async (playlistId) => {
        const target = playlists.find(p => p.id === playlistId);
        if (target?.isDefault) {
            showToast("Cannot delete default playlist", "⚠️");
            return;
        }
        const updated = playlists.filter(p => p.id !== playlistId);
        await savePlaylists(updated);
        showToast(`Deleted playlist`, '🗑️');
    }, [playlists, showToast]);

    // Add track to a playlist
    const addTrackToPlaylist = useCallback(async (playlistId, track) => {
        if (!track) return false;
        let targetTitle = '';
        const updated = playlists.map(pl => {
            if (pl.id === playlistId) {
                targetTitle = pl.title;
                const exists = (pl.tracks || []).some(t => t.id === track.id);
                if (exists) {
                    return pl; // already exists
                }
                return {
                    ...pl,
                    tracks: [track, ...(pl.tracks || [])],
                };
            }
            return pl;
        });

        await savePlaylists(updated);
        showToast(`Added to "${targetTitle}"`, '🎵');
        return true;
    }, [playlists, showToast]);

    // Remove track from a playlist
    const removeTrackFromPlaylist = useCallback(async (playlistId, trackId) => {
        let removedTitle = '';
        const updated = playlists.map(pl => {
            if (pl.id === playlistId) {
                const targetTrack = pl.tracks.find(t => t.id === trackId);
                if (targetTrack) removedTitle = targetTrack.title;
                return {
                    ...pl,
                    tracks: (pl.tracks || []).filter(t => t.id !== trackId),
                };
            }
            return pl;
        });

        await savePlaylists(updated);
        showToast(`Removed from playlist`, '🗑️');
    }, [playlists, showToast]);

    // Toggle liked track
    const toggleLikeTrack = useCallback(async (track) => {
        if (!track) return;
        const isLikedNow = likedTrackIds.includes(track.id);
        let newLiked;
        if (isLikedNow) {
            newLiked = likedTrackIds.filter(id => id !== track.id);
            showToast(`Removed from Liked Songs`, '♡');
            // Remove from liked playlist too
            const updatedPlaylists = playlists.map(pl => {
                if (pl.id === 'pl-liked') {
                    return { ...pl, tracks: (pl.tracks || []).filter(t => t.id !== track.id) };
                }
                return pl;
            });
            savePlaylists(updatedPlaylists);
        } else {
            newLiked = [track.id, ...likedTrackIds];
            showToast(`Saved to your Liked Songs`, '💚');
            // Add to liked playlist
            const updatedPlaylists = playlists.map(pl => {
                if (pl.id === 'pl-liked') {
                    const exists = (pl.tracks || []).some(t => t.id === track.id);
                    return exists ? pl : { ...pl, tracks: [track, ...(pl.tracks || [])] };
                }
                return pl;
            });
            savePlaylists(updatedPlaylists);
        }

        setLikedTrackIds(newLiked);
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.LIKED_TRACKS, JSON.stringify(newLiked));
        } catch (e) {}
    }, [likedTrackIds, playlists, showToast]);

    const isLiked = useCallback((trackId) => {
        return likedTrackIds.includes(trackId);
    }, [likedTrackIds]);

    // Add to user queue
    const addToQueue = useCallback((track) => {
        if (!track) return;
        setUserQueue(prev => [...prev, track]);
        showToast(`Added to queue: "${track.title}"`, '⤹');
    }, [showToast]);

    const removeFromQueue = useCallback((index) => {
        setUserQueue(prev => prev.filter((_, idx) => idx !== index));
    }, []);

    const clearQueue = useCallback(() => {
        setUserQueue([]);
        showToast('Queue cleared', '✓');
    }, [showToast]);

    // Record played track (recents + stats)
    const recordTrackPlayed = useCallback(async (track) => {
        if (!track) return;
        const entry = {
            ...track,
            playedAt: Date.now(),
        };

        setRecentTracks(prev => {
            const filtered = prev.filter(t => t.id !== track.id);
            const updated = [entry, ...filtered].slice(0, 30);
            AsyncStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated)).catch(() => {});
            return updated;
        });
    }, []);

    // Also listen to audioPlayer status to record recents automatically
    useEffect(() => {
        const unsubscribe = audioPlayer.addListener((event, data) => {
            if (event === 'status' && data?.track && data?.isPlaying) {
                recordTrackPlayed(data.track);
            }
        });
        return () => unsubscribe();
    }, [recordTrackPlayed]);

    const value = {
        playlists,
        createPlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        likedTrackIds,
        toggleLikeTrack,
        isLiked,
        userQueue,
        addToQueue,
        removeFromQueue,
        clearQueue,
        recentTracks,
        recordTrackPlayed,
        toast,
        showToast,
    };

    return (
        <MusicContext.Provider value={value}>
            {children}
        </MusicContext.Provider>
    );
};

export const useMusic = () => {
    const context = useContext(MusicContext);
    if (!context) {
        throw new Error('useMusic must be used within a MusicProvider');
    }
    return context;
};
