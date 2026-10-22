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
} from 'react-native';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { getTrendingMusic, searchMusic } from '../services/audiomackService';
import BottomNavBar, { TABS } from '../components/BottomNavBar';
import ProfileDrawer from '../components/ProfileDrawer';
import FullScreenPlayerModal from '../components/FullScreenPlayerModal';
import { LibraryView, CreateView } from '../components/LibraryAndCreateViews';

const HomeScreen = () => {
    const { user, userProfile, logout, isConfigured } = useAuth();
    const [activeTab, setActiveTab] = useState(TABS.HOME);

    // Track states
    const [searchQuery, setSearchQuery] = useState('');
    const [tracks, setTracks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Modals state
    const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);

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

    const handleNextTrack = () => {
        if (!tracks || tracks.length === 0 || !currentTrack) return;
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const nextIndex = (currentIndex + 1) % tracks.length;
        setCurrentTrack(tracks[nextIndex]);
        setIsPlaying(true);
    };

    const handlePreviousTrack = () => {
        if (!tracks || tracks.length === 0 || !currentTrack) return;
        const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
        const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
        setCurrentTrack(tracks[prevIndex]);
        setIsPlaying(true);
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
                            : 'Trending on Audiomack'}
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
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            {/* Header with Clickable Profile Picture */}
            <View style={styles.header}>
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
                        <View style={styles.badgeContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    isConfigured ? styles.statusDotActive : styles.statusDotPending,
                                ]}
                            />
                            <Text style={styles.badgeText}>
                                {isConfigured ? 'Firebase Sync' : 'Ready'}
                            </Text>
                        </View>
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
        paddingTop: SPACE.sm,
        paddingBottom: SPACE.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#1F1F1F',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarButton: {
        position: 'relative',
        marginRight: SPACE.md,
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
        paddingBottom: 20,
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
