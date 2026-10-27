import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Share,
    Alert,
    Platform,
} from 'react-native';
import { COLORS, SPACE, RADIUS } from '../constants/theme';
import audioPlayer from '../services/audioPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FullScreenPlayerModal = ({
    visible,
    track,
    isPlaying,
    onTogglePlay,
    onClose,
    onNext,
    onPrevious,
    queue = [],
}) => {
    // Player playback state
    const [progressSeconds, setProgressSeconds] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(230);
    const [isLiked, setIsLiked] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
    const [showQueueModal, setShowQueueModal] = useState(false);

    // Dynamic phone / listening device detection
    const deviceName = Platform.select({
        ios: 'iPhone 15 Pro Max',
        android: 'Pixel 8 Pro (This device)',
        default: 'Mobile Device',
    });

    // Parse duration "3:50" into seconds if possible
    useEffect(() => {
        if (track?.duration) {
            const parts = track.duration.split(':');
            if (parts.length === 2) {
                const total = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                if (!isNaN(total)) {
                    setDurationSeconds(total);
                }
            }
        }
    }, [track]);

    // Sync real audio progress
    useEffect(() => {
        const unsubscribe = audioPlayer.addListener((event, data) => {
            if (event === 'progress') {
                if (typeof data.currentTime === 'number') {
                    setProgressSeconds(data.currentTime);
                }
                if (data.duration && data.duration > 0) {
                    setDurationSeconds(data.duration);
                }
            }
        });
        return () => unsubscribe();
    }, []);

    if (!track) return null;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleShare = async () => {
        try {
            await Share.share({
                title: `${track.title} - ${track.artist}`,
                message: `Check out "${track.title}" by ${track.artist} on Spotify!\nhttps://spotify.com/track/${track.id}`,
            });
        } catch (error) {
            Alert.alert('Share', `Sharing "${track.title}" with friends`);
        }
    };

    const toggleLikePlaylist = () => {
        const nextState = !isLiked;
        setIsLiked(nextState);
        Alert.alert(
            nextState ? 'Added to Your Library' : 'Removed from Your Library',
            nextState
                ? `"${track.title}" was saved to your Liked Songs playlist.`
                : `"${track.title}" was removed from your Liked Songs.`
        );
    };

    const toggleRepeat = () => {
        if (repeatMode === 'off') {
            setRepeatMode('all');
            Alert.alert('Repeat Mode', 'Repeat All Songs enabled');
        } else if (repeatMode === 'all') {
            setRepeatMode('one');
            Alert.alert('Repeat Mode', 'Repeat Current Song (1) enabled');
        } else {
            setRepeatMode('off');
            Alert.alert('Repeat Mode', 'Repeat turned off');
        }
    };

    const toggleShuffle = () => {
        const next = !isShuffle;
        setIsShuffle(next);
        Alert.alert('Shuffle Songs', next ? 'Shuffle is ON for next songs' : 'Shuffle is OFF');
    };

    const progressPercent = Math.min((progressSeconds / (durationSeconds || 1)) * 100, 100);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

                {/* Ambient Blurred Background Image */}
                <Image
                    source={{ uri: track.artwork }}
                    style={styles.ambientBackgroundImage}
                    blurRadius={Platform.OS === 'ios' ? 25 : 18}
                />
                <View style={styles.ambientOverlay} />

                <SafeAreaView style={styles.safeArea}>
                    {/* Top Navigation Bar */}
                    <View style={styles.topBar}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.topIconBtn}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.chevronDown}>⌄</Text>
                        </TouchableOpacity>

                        <View style={styles.headerTitleBox}>
                            <Text style={styles.playlistSubtitle}>PLAYING FROM PLAYLIST</Text>
                            <Text style={styles.playlistName} numberOfLines={1}>
                                {track.album || 'Today\'s Top Hits'}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.topIconBtn}
                            onPress={() => Alert.alert('Options', `${track.title}\nArtist: ${track.artist}`)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.moreOptions}>•••</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Album Cover Art */}
                        <View style={styles.artworkContainer}>
                            <Image
                                source={{ uri: track.artwork }}
                                style={styles.albumArt}
                            />
                        </View>

                        {/* Title, Artist, & Favorite Button */}
                        <View style={styles.metaRow}>
                            <View style={styles.titleArtistBox}>
                                <Text style={styles.trackTitle} numberOfLines={1}>
                                    {track.title}
                                </Text>
                                <Text style={styles.trackArtist} numberOfLines={1}>
                                    {track.artist}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={toggleLikePlaylist}
                                style={styles.favoriteButton}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.favoriteIcon,
                                        isLiked && styles.favoriteIconActive,
                                    ]}
                                >
                                    {isLiked ? '💚' : '♡'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Timeline / Progress Slider bar */}
                        <View style={styles.progressContainer}>
                            <TouchableOpacity
                                style={styles.trackBarBackground}
                                activeOpacity={0.9}
                                onPress={(e) => {
                                    const clickX = e.nativeEvent.locationX;
                                    const totalWidth = SCREEN_WIDTH - SPACE.lg * 2;
                                    const ratio = Math.max(0, Math.min(1, clickX / totalWidth));
                                    const seekSecs = Math.floor(ratio * durationSeconds);
                                    setProgressSeconds(seekSecs);
                                    audioPlayer.seekTo(seekSecs);
                                }}
                            >
                                <View
                                    style={[
                                        styles.trackBarFill,
                                        { width: `${progressPercent}%` },
                                    ]}
                                />
                                <View
                                    style={[
                                        styles.progressThumb,
                                        { left: `${Math.max(progressPercent - 1, 0)}%` },
                                    ]}
                                />
                            </TouchableOpacity>

                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>{formatTime(progressSeconds)}</Text>
                                <Text style={styles.timeText}>{formatTime(durationSeconds)}</Text>
                            </View>
                        </View>

                        {/* Controls (Shuffle, Prev, Play/Pause, Next, Repeat) */}
                        <View style={styles.controlsRow}>
                            {/* Shuffle Next Songs Button */}
                            <TouchableOpacity
                                onPress={toggleShuffle}
                                style={styles.controlIconBtn}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.controlIcon,
                                        isShuffle && styles.activeControlText,
                                    ]}
                                >
                                    🔀
                                </Text>
                                {isShuffle && <View style={styles.activeDot} />}
                            </TouchableOpacity>

                            {/* Back / Previous Song */}
                            <TouchableOpacity
                                onPress={onPrevious}
                                style={styles.controlIconBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.prevNextIcon}>⏮</Text>
                            </TouchableOpacity>

                            {/* Play / Pause Primary Button */}
                            <TouchableOpacity
                                onPress={onTogglePlay}
                                style={styles.playPauseButton}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.playPauseText}>
                                    {isPlaying ? '⏸' : '▶'}
                                </Text>
                            </TouchableOpacity>

                            {/* Next Song */}
                            <TouchableOpacity
                                onPress={onNext}
                                style={styles.controlIconBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.prevNextIcon}>⏭</Text>
                            </TouchableOpacity>

                            {/* Play Song Again / Repeat Mode */}
                            <TouchableOpacity
                                onPress={toggleRepeat}
                                style={styles.controlIconBtn}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.controlIcon,
                                        repeatMode !== 'off' && styles.activeControlText,
                                    ]}
                                >
                                    {repeatMode === 'one' ? '🔂' : '🔁'}
                                </Text>
                                {repeatMode !== 'off' && <View style={styles.activeDot} />}
                            </TouchableOpacity>
                        </View>

                        {/* Device Listening At & Action Tools */}
                        <View style={styles.bottomToolBar}>
                            {/* Where you are listening at (device badge) */}
                            <TouchableOpacity
                                style={styles.deviceListeningBadge}
                                activeOpacity={0.7}
                                onPress={() =>
                                    Alert.alert(
                                        'Listening on Device',
                                        `Currently outputting high-definition audio to: ${deviceName}\n\nTap to cast or switch devices via Spotify Connect.`
                                    )
                                }
                            >
                                <Text style={styles.deviceIcon}>📱</Text>
                                <Text style={styles.deviceText} numberOfLines={1}>
                                    {deviceName}
                                </Text>
                            </TouchableOpacity>

                            <View style={styles.rightToolIcons}>
                                {/* Share Button */}
                                <TouchableOpacity
                                    onPress={handleShare}
                                    style={styles.toolIconBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.toolIconText}>↗️</Text>
                                </TouchableOpacity>

                                {/* Open Queue Button */}
                                <TouchableOpacity
                                    onPress={() => setShowQueueModal(true)}
                                    style={styles.toolIconBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.toolIconText}>📋</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* About The Artist Section */}
                        <View style={styles.aboutArtistCard}>
                            <Text style={styles.aboutHeaderTitle}>About the artist</Text>
                            <Image
                                source={{ uri: track.artwork }}
                                style={styles.aboutArtistImage}
                            />
                            <View style={styles.aboutArtistInfo}>
                                <Text style={styles.aboutArtistName}>{track.artist}</Text>
                                <Text style={styles.monthlyListeners}>
                                    {track.plays ? `${track.plays} monthly streams` : '84,920,110 monthly listeners'}
                                </Text>
                                <Text style={styles.artistBio}>
                                    Award-winning hitmaker dominating global charts. Known for record-shattering singles,
                                    visionary synth production, and global stadium arena tours.
                                </Text>

                                <TouchableOpacity
                                    style={styles.followArtistBtn}
                                    activeOpacity={0.8}
                                    onPress={() => Alert.alert('Follow Artist', `You are now following ${track.artist}!`)}
                                >
                                    <Text style={styles.followArtistText}>Follow Artist</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </SafeAreaView>

                {/* Queue Modal Sheet */}
                <Modal
                    visible={showQueueModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowQueueModal(false)}
                >
                    <View style={styles.queueOverlay}>
                        <View style={styles.queueSheet}>
                            <View style={styles.queueHeader}>
                                <Text style={styles.queueTitle}>Up Next in Queue</Text>
                                <TouchableOpacity onPress={() => setShowQueueModal(false)}>
                                    <Text style={styles.closeQueueText}>Close</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.queueList}>
                                <Text style={styles.queueSectionHeader}>Now Playing</Text>
                                <View style={styles.queueItemActive}>
                                    <Image source={{ uri: track.artwork }} style={styles.queueArt} />
                                    <View style={styles.queueInfo}>
                                        <Text style={[styles.queueItemTitle, { color: COLORS.primary }]} numberOfLines={1}>
                                            {track.title}
                                        </Text>
                                        <Text style={styles.queueItemArtist} numberOfLines={1}>
                                            {track.artist}
                                        </Text>
                                    </View>
                                    <Text style={styles.queuePlayingIcon}>▶</Text>
                                </View>

                                <Text style={[styles.queueSectionHeader, { marginTop: SPACE.md }]}>Next In Queue</Text>
                                {queue.length > 0 ? (
                                    queue.map((item, index) => (
                                        <View key={item.id || index} style={styles.queueItem}>
                                            <Image source={{ uri: item.artwork }} style={styles.queueArt} />
                                            <View style={styles.queueInfo}>
                                                <Text style={styles.queueItemTitle} numberOfLines={1}>
                                                    {item.title}
                                                </Text>
                                                <Text style={styles.queueItemArtist} numberOfLines={1}>
                                                    {item.artist}
                                                </Text>
                                            </View>
                                            <Text style={styles.queueDuration}>{item.duration}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={styles.emptyQueueText}>No additional tracks in queue</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    ambientBackgroundImage: {
        ...StyleSheet.absoluteFillObject,
        width: '100%',
        height: '100%',
        opacity: 0.35,
        resizeMode: 'cover',
    },
    ambientOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(12, 12, 12, 0.75)',
    },
    safeArea: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.xs,
    },
    topIconBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevronDown: {
        color: COLORS.white,
        fontSize: 32,
        fontWeight: '300',
        marginTop: -6,
    },
    headerTitleBox: {
        alignItems: 'center',
        flex: 1,
    },
    playlistSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
    playlistName: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    moreOptions: {
        color: COLORS.white,
        fontSize: 20,
        letterSpacing: 1,
    },
    scrollContent: {
        paddingHorizontal: SPACE.lg,
        paddingBottom: 40,
    },
    artworkContainer: {
        alignItems: 'center',
        marginTop: SPACE.md,
        marginBottom: SPACE.xl,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 18,
        elevation: 20,
    },
    albumArt: {
        width: SCREEN_WIDTH - 56,
        height: SCREEN_WIDTH - 56,
        maxWidth: 360,
        maxHeight: 360,
        borderRadius: RADIUS.sm,
        backgroundColor: COLORS.surface,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACE.md,
    },
    titleArtistBox: {
        flex: 1,
        marginRight: SPACE.md,
    },
    trackTitle: {
        color: COLORS.textPrimary,
        fontSize: 22,
        fontWeight: 'bold',
        letterSpacing: 0.2,
    },
    trackArtist: {
        color: COLORS.textSecondary,
        fontSize: 16,
        marginTop: 4,
    },
    favoriteButton: {
        padding: 6,
    },
    favoriteIcon: {
        fontSize: 26,
        color: COLORS.textSecondary,
    },
    favoriteIconActive: {
        color: COLORS.primary,
    },
    progressContainer: {
        marginVertical: SPACE.xs,
    },
    trackBarBackground: {
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 2,
        position: 'relative',
        justifyContent: 'center',
    },
    trackBarFill: {
        height: '100%',
        backgroundColor: COLORS.white,
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.white,
        top: -4,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    timeText: {
        color: COLORS.textSecondary,
        fontSize: 11,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: SPACE.md,
        paddingHorizontal: SPACE.xs,
    },
    controlIconBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlIcon: {
        fontSize: 22,
        color: COLORS.textSecondary,
    },
    prevNextIcon: {
        fontSize: 26,
        color: COLORS.white,
    },
    activeControlText: {
        color: COLORS.primary,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginTop: 2,
    },
    playPauseButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 8,
    },
    playPauseText: {
        color: COLORS.black,
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 2,
    },
    bottomToolBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACE.xs,
        paddingVertical: SPACE.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    },
    deviceListeningBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(29, 185, 84, 0.12)',
        paddingHorizontal: SPACE.sm + 4,
        paddingVertical: 6,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: 'rgba(29, 185, 84, 0.3)',
        maxWidth: SCREEN_WIDTH * 0.58,
    },
    deviceIcon: {
        fontSize: 14,
        marginRight: 6,
    },
    deviceText: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    rightToolIcons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toolIconBtn: {
        padding: 8,
        marginLeft: SPACE.xs,
    },
    toolIconText: {
        fontSize: 20,
    },
    aboutArtistCard: {
        marginTop: SPACE.xl,
        backgroundColor: 'rgba(32, 32, 32, 0.75)',
        borderRadius: RADIUS.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    aboutHeaderTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
        padding: SPACE.md,
    },
    aboutArtistImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    aboutArtistInfo: {
        padding: SPACE.md,
    },
    aboutArtistName: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    monthlyListeners: {
        color: COLORS.textSecondary,
        fontSize: 13,
        marginTop: 2,
        marginBottom: SPACE.sm,
    },
    artistBio: {
        color: '#D0D0D0',
        fontSize: 13,
        lineHeight: 18,
    },
    followArtistBtn: {
        marginTop: SPACE.md,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: COLORS.white,
        borderRadius: RADIUS.circle,
        paddingHorizontal: SPACE.lg,
        paddingVertical: 7,
    },
    followArtistText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: 'bold',
    },
    queueOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'flex-end',
    },
    queueSheet: {
        backgroundColor: '#1E1E1E',
        borderTopLeftRadius: RADIUS.lg,
        borderTopRightRadius: RADIUS.lg,
        maxHeight: SCREEN_HEIGHT * 0.7,
        padding: SPACE.md,
    },
    queueHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: SPACE.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#2C2C2C',
    },
    queueTitle: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeQueueText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    queueList: {
        marginVertical: SPACE.sm,
    },
    queueSectionHeader: {
        color: COLORS.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: SPACE.xs,
    },
    queueItemActive: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282828',
        padding: SPACE.sm,
        borderRadius: RADIUS.sm,
    },
    queueItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACE.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: '#282828',
    },
    queueArt: {
        width: 44,
        height: 44,
        borderRadius: RADIUS.xs,
    },
    queueInfo: {
        flex: 1,
        marginLeft: SPACE.sm,
    },
    queueItemTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    queueItemArtist: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    queuePlayingIcon: {
        color: COLORS.primary,
        fontSize: 16,
        marginRight: 6,
    },
    queueDuration: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
    emptyQueueText: {
        color: COLORS.textMuted,
        fontSize: 13,
        textAlign: 'center',
        paddingVertical: SPACE.lg,
    },
});

export default FullScreenPlayerModal;
