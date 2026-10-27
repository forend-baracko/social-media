import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getTrendingMusic, searchMusic, MOCK_TRACKS } from '../services/audiomackService';
import audioPlayer from '../services/audioPlayer';
import BottomNavBar, { TABS } from '../components/BottomNavBar';
import ProfileDrawer from '../components/ProfileDrawer';
import FullScreenPlayerModal from '../components/FullScreenPlayerModal';
import { LibraryView, CreateView } from '../components/LibraryAndCreateViews';

const HomeScreen = () => {
    const insets = useSafeAreaInsets();
    const { user, userProfile, logout, isConfigured } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.HOME);

    // Track states
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState(MOCK_TRACKS);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTrack, setCurrentTrack] = useState(() => audioPlayer.getCurrentTrack() || MOCK_TRACKS[0]);
    const [isPlaying, setIsPlaying] = useState(() => audioPlayer.getIsPlaying());

    // Modals state
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

    const loadTrending = useCallback(async () => {
        setIsLoading(true);
        try {
            const result = await getTrendingMusic();
            if (result && result.length > 0) {
                setTracks(result);
            } else {
                setTracks(MOCK_TRACKS);
            }
        } catch (err) {
            console.warn('Failed to load tracks, using fallback music:', err);
            setTracks(MOCK_TRACKS);
        } finally {
            setIsLoading(false);
        }
    }, []);

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
                            audioPlayer.stop();
                            await logout();
                        } catch (e) {
                            Alert.alert('Error', e.message);
                        }
                    },
                },
            ]
        );
    };

    // Sync audio player state across tab switches and background playback
    useEffect(() => {
        const unsubscribe = audioPlayer.addListener((event, data) => {
            if (event === 'status') {
                if (typeof data?.isPlaying === 'boolean') {
                    setIsPlaying(data.isPlaying);
                }
                if (data?.track) {
                    setCurrentTrack(data.track);
                }
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    const togglePlay = () => {
        if (!currentTrack) return;
        audioPlayer.togglePlay(currentTrack);
    };

    const handleSelectTrack = (track) => {
        setCurrentTrack(track);
        audioPlayer.playTrack(track, () => {
            handleNextTrack();
        });
    };

    const handleNextTrack = () => {
        if (!tracks || tracks.length === 0 || !currentTrack) return;
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        const nextTrack = tracks[nextIndex];
        setCurrentTrack(nextTrack);
        audioPlayer.playTrack(nextTrack, () => {
            handleNextTrack();
        });
    };

    const handlePreviousTrack = () => {
        if (!tracks || tracks.length === 0 || !currentTrack) return;
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        const prevTrack = tracks[prevIndex];
        setCurrentTrack(prevTrack);
        audioPlayer.playTrack(prevTrack, () => {
            handleNextTrack();
        });
    };

    const upcomingQueue = useMemo(() => {
        if (!tracks || tracks.length === 0 || !currentTrack) return [];
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        if (currentIndex === -1) return tracks.slice(0, 5);
        return [...tracks.slice(currentIndex + 1), ...tracks.slice(0, currentIndex)];
    }, [tracks, currentTrack]);

    const displayName =
        userProfile?.displayName ||
        user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Music Lover');

    const photoURL = userProfile?.photoURL || user?.photoURL || null;

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

    const renderMainContent = () => {
        if (activeTab === TABS.LIBRARY) {
            return <LibraryView />;
        }

        if (activeTab === TABS.CREATE) {
            return <CreateView />;
        }

        // Both Home & Search tabs display music feeds with search capability
        return (
            <View style={styles.tabContentContainer}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder={
                            activeTab === TABS.SEARCH
                                ? "What do you want to listen to?"
                                : "Search Audiomack songs, artists..."
                        }
                        placeholderTextColor={COLORS.textMuted}
                        value={searchQuery}
                        onChangeText={handleSearch}
                        autoCapitalize="none"
                        clearButtonMode="while-editing"
                        autoFocus={activeTab === TABS.SEARCH}
                    />
                </View>

                {/* Section Title */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        {searchQuery.trim()
                            ? 'Search Results'
                            : activeTab === TABS.SEARCH
                                ? 'Top Charts & Genres'
                                : 'Trending Music'}
                    </Text>
                    <Text style={styles.trackCount}>{tracks.length} tracks</Text>
                </View>

                {/* Track List */}
                {isLoading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Loading music...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={tracks}
                        keyExtractor={(item) => item.id}
                        renderItem={renderTrackItem}
                        style={styles.flatList}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: currentTrack ? 90 : 30 },
                        ]}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyTitle}>No tracks found</Text>
                                <Text style={styles.emptySubtitle}>Try searching for another artist or song</Text>
                            </View>
                        }
                    />
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header with Clickable Profile Picture */}
            <View
                style={[
                    styles.header,
                    {
                        paddingTop: Math.max(
                            insets.top,
                            Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 10
                        ) + SPACE.xs,
                    },
                ]}
            >
                <View style={styles.headerLeft}>
                    {/* Profile Picture (Click opens Side Bar Drawer) */}
                    <TouchableOpacity
                        style={styles.avatarButton}
                        activeOpacity={0.8}
                        onPress={() => setIsProfileDrawerOpen(true)}
                    >
                        {photoURL ? (
                            <Image source={{ uri: photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitial}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                        <View style={styles.avatarOnlineDot} />
                    </TouchableOpacity>

                    <View style={styles.userInfoBox}>
                        <Text style={styles.greeting}>Welcome back,</Text>
                        <Text style={styles.userName} numberOfLines={1}>
                            {displayName}
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

            {/* Tab Body View */}
            <View style={styles.mainContainer}>
                {renderMainContent()}
            </View>

            {/* Mini Player Bar (Clicking anywhere opens Full Screen Player) */}
            {currentTrack && (
                <TouchableOpacity
                    style={styles.playerBar}
                    activeOpacity={0.92}
                    onPress={() => setIsPlayerModalOpen(true)}
                >
                    <Image source={{ uri: currentTrack.artwork }} style={styles.playerArtwork} />
                    <View style={styles.playerDetails}>
                        <Text style={styles.playerTitle} numberOfLines={1}>
                            {currentTrack.title}
                        </Text>
                        <Text style={styles.playerArtist} numberOfLines={1}>
                            {currentTrack.artist}
                        </Text>
                    </View>

                    {/* Quick Like / Heart button on mini player */}
                    <TouchableOpacity
                        style={styles.miniLikeButton}
                        activeOpacity={0.7}
                        onPress={(e) => {
                            e.stopPropagation();
                            Alert.alert('Liked Songs', `Saved "${currentTrack.title}" to Liked Songs.`);
                        }}
                    >
                        <Text style={styles.miniLikeIcon}>♡</Text>
                    </TouchableOpacity>

                    {/* Play/Pause Button on mini player */}
                    <TouchableOpacity
                        style={styles.playButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            togglePlay();
                        }}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.playButtonText}>
                            {isPlaying ? '⏸' : '▶'}
                        </Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            )}

            {/* Bottom Navigation Bar: Home - Search - Your Library - Create */}
            <BottomNavBar
                activeTab={activeTab}
                onSelectTab={(tab) => setActiveTab(tab)}
            />

            {/* Side Bar Drawer for Profile */}
            <ProfileDrawer
                visible={isProfileDrawerOpen}
                onClose={() => setIsProfileDrawerOpen(false)}
                user={user}
                userProfile={userProfile}
                onLogout={logout}
            />

            {/* Full Screen Music Player Modal */}
            <FullScreenPlayerModal
                visible={isPlayerModalOpen}
                track={currentTrack}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                onClose={() => setIsPlayerModalOpen(false)}
                onNext={handleNextTrack}
                onPrevious={handlePreviousTrack}
                queue={upcomingQueue}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mainContainer: {
        flex: 1,
    },
    tabContentContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.xs,
        paddingBottom: SPACE.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F1F',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexShrink: 1,
        marginRight: SPACE.xs,
    },
    avatarButton: {
        position: 'relative',
        marginRight: SPACE.md,
        flexShrink: 0,
    },
    avatar: {
        width: 46,
        height: 46,
        borderRadius: 23,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#282828',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    avatarInitial: {
        color: COLORS.primary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    avatarOnlineDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: COLORS.background,
    },
    userInfoBox: {
        flex: 1,
        flexShrink: 1,
    },
    greeting: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    userName: {
        color: COLORS.textPrimary,
        fontSize: 17,
        fontWeight: 'bold',
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 5,
    },
    statusDotActive: {
        backgroundColor: COLORS.primary,
    },
    statusDotPending: {
        backgroundColor: '#E5A93C',
    },
    badgeText: {
        color: COLORS.textSecondary,
        fontSize: 11,
    },
    signOutButton: {
        backgroundColor: COLORS.surfaceElevated,
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.xs + 2,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginLeft: SPACE.sm,
        flexShrink: 0,
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
    flatList: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.xs,
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
        flexShrink: 1,
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
        justifyContent: 'center',
        marginLeft: SPACE.sm,
        flexShrink: 0,
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
        backgroundColor: '#202020',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.xs + 2,
        borderTopWidth: 1,
        borderTopColor: '#2C2C2C',
        borderBottomWidth: 1,
        borderBottomColor: '#171717',
    },
    playerArtwork: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.xs,
        flexShrink: 0,
    },
    playerDetails: {
        flex: 1,
        flexShrink: 1,
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
    miniLikeButton: {
        padding: 8,
        marginRight: 4,
    },
    miniLikeIcon: {
        color: COLORS.textSecondary,
        fontSize: 20,
    },
    playButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: SPACE.xs,
    },
    playButtonText: {
        color: COLORS.black,
        fontSize: 15,
        marginLeft: 1,
    },
});

export default HomeScreen;
