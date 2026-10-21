import React, { useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    View,
    Text,
    TextInput,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    StatusBar,
    Alert,
} from 'react-native';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getTrendingMusic, searchMusic } from '../services/audiomackService';

const HomeScreen = () => {
    const { user, userProfile, logout, isConfigured } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const loadTrending = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getTrendingMusic();
            setTracks(result);
            if (result.length > 0 && !currentTrack) {
                setCurrentTrack(result[0]);
            }
        } catch (err) {
            console.warn('Failed to load tracks:', err);
        } finally {
            setIsLoading(false);
        }
    }, [currentTrack]);

    // Fetch initial trending tracks on mount
    useEffect(() => {
        loadTrending();
    }, [loadTrending]);

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (!query.trim()) {
            loadTrending();
            return;
        }

        setIsLoading(true);
        try {
            const results = await searchMusic(query);
            setTracks(results);
        } catch (err) {
            console.warn('Search failed:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out of Spotify?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                        } catch (e) {
                            Alert.alert('Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSelectTrack = (track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const displayName =
        userProfile?.displayName ||
        user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Music Lover');

    const renderTrackItem = ({ item }) => {
        const isSelected = currentTrack?.id === item.id;

        return (
            <TouchableOpacity
                style={[styles.trackRow, isSelected && styles.trackRowActive]}
                onPress={() => handleSelectTrack(item)}
                activeOpacity={0.7}
            >
                <Image source={{ uri: item.artwork }} style={styles.artwork} />
                <View style={styles.trackInfo}>
                    <Text
                        style={[styles.trackTitle, isSelected && styles.trackTitleActive]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist}
                    </Text>
                </View>
                <View style={styles.trackMeta}>
                    <Text style={styles.duration}>{item.duration}</Text>
                    {item.plays ? (
                        <Text style={styles.plays}>{item.plays} plays</Text>
                    ) : null}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.userName}>{displayName}</Text>
                    <View style={styles.badgeContainer}>
                        <View
                            style={[
                                styles.statusDot,
                                isConfigured ? styles.statusDotActive : styles.statusDotPending,
                            ]}
                        />
                        <Text style={styles.badgeText}>
                            {isConfigured ? 'Firebase Sync Active' : 'Firebase Ready'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Audiomack songs, artists..."
                    placeholderTextColor={COLORS.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoCapitalize="none"
                    clearButtonMode="while-editing"
                />
            </View>

            {/* Section Title */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {searchQuery.trim() ? 'Search Results' : 'Trending on Audiomack'}
                </Text>
                <Text style={styles.trackCount}>{tracks.length} tracks</Text>
            </View>

            {/* Track List */}
            {isLoading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading Audiomack music...</Text>
                </View>
            ) : (
                <FlatList
                    data={tracks}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTrackItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyTitle}>No tracks found</Text>
                            <Text style={styles.emptySubtitle}>Try searching for another artist or song</Text>
                        </View>
                    }
                />
            )}

            {/* Mini Player */}
            {currentTrack && (
                <View style={styles.playerBar}>
                    <Image source={{ uri: currentTrack.artwork }} style={styles.playerArtwork} />
                    <View style={styles.playerDetails}>
                        <Text style={styles.playerTitle} numberOfLines={1}>
                            {currentTrack.title}
                        </Text>
                        <Text style={styles.playerArtist} numberOfLines={1}>
                            {currentTrack.artist}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={togglePlay}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.playButtonText}>
                            {isPlaying ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.md,
        paddingBottom: SPACE.sm,
    },
    greeting: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    userName: {
        color: COLORS.textPrimary,
        fontSize: 22,
        fontWeight: 'bold',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusDotActive: {
        backgroundColor: COLORS.primary,
    },
    statusDotPending: {
        backgroundColor: '#E5A93C',
    },
    badgeText: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    signOutButton: {
        backgroundColor: COLORS.surfaceElevated,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.xs + 2,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    signOutText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    searchContainer: {
        paddingHorizontal: SPACE.lg,
        marginTop: SPACE.sm,
        marginBottom: SPACE.sm,
    },
    searchInput: {
        backgroundColor: COLORS.inputBackground,
        color: COLORS.textPrimary,
        borderRadius: RADIUS.circle,
        paddingHorizontal: SPACE.lg,
        paddingVertical: SPACE.sm + 2,
        fontSize: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACE.lg,
        paddingVertical: SPACE.sm,
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    trackCount: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    listContent: {
        paddingHorizontal: SPACE.lg,
        paddingBottom: 90,
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACE.sm,
        paddingHorizontal: SPACE.sm,
        borderRadius: RADIUS.sm,
        marginBottom: SPACE.xs,
    },
    trackRowActive: {
        backgroundColor: COLORS.surfaceElevated,
    },
    artwork: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.xs,
        backgroundColor: COLORS.surface,
    },
    trackInfo: {
        flex: 1,
        marginLeft: SPACE.md,
        justifyContent: 'center',
    },
    trackTitle: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    trackTitleActive: {
        color: COLORS.primary,
    },
    trackArtist: {
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    trackMeta: {
        alignItems: 'flex-end',
        marginLeft: SPACE.sm,
    },
    duration: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    plays: {
        color: COLORS.textMuted,
        fontSize: 10,
        marginTop: 2,
    },
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: COLORS.textSecondary,
        marginTop: SPACE.md,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: SPACE.xxl,
    },
    emptyTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    emptySubtitle: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginTop: 4,
    },
    playerBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.surfaceElevated,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    playerArtwork: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.xs,
    },
    playerDetails: {
        flex: 1,
        marginLeft: SPACE.md,
    },
    playerTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: 'bold',
    },
    playerArtist: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACE.md,
    },
    playButtonText: {
        color: COLORS.black,
        fontSize: 16,
    },
});

export default HomeScreen;
