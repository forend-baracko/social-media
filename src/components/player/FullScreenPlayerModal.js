import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
    ScrollView,
    Share,
    Alert,
    Platform,
    Animated,
    PanResponder,
    StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE } from '../../constants/theme';
import audioPlayer from '../../services/audioPlayer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Swipe-to-close threshold ─────────────────────────────────────────────────
const SWIPE_DOWN_THRESHOLD = SCREEN_HEIGHT * 0.22; // 22% of screen height triggers close
const SWIPE_VELOCITY_THRESHOLD = 0.5;              // fast flick also triggers close

// ─── Three-Dot Options Dropdown ──────────────────────────────────────────────
const OptionsDropdown = ({ visible, onClose, track, onShare, onToggleLike, isLiked, topOffset }) => {
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim,  { toValue: 1, duration: 180, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 15 }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim,  { toValue: 0, duration: 120, useNativeDriver: true }),
                Animated.timing(scaleAnim, { toValue: 0.88, duration: 120, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    if (!track) return null;

    const options = [
        { icon: '↗', label: 'Share',                  onPress: () => { onClose(); onShare(); } },
        { icon: '+', label: 'Add to playlist',         onPress: () => { onClose(); Alert.alert('Add to Playlist', `"${track.title}" added to playlist.`); } },
        { icon: '⬇', label: 'Add to queue',           onPress: () => { onClose(); Alert.alert('Add to Queue',    `"${track.title}" added to queue.`); } },
        { icon: isLiked ? '♥' : '♡',
          label: isLiked ? 'Remove from Liked Songs' : 'Save to Liked Songs',
          onPress: () => { onClose(); onToggleLike(); }, active: isLiked },
        { icon: '◎', label: 'Go to artist',           onPress: () => { onClose(); Alert.alert('Go to Artist', `Viewing ${track.artist}'s profile.`); } },
        { icon: '◉', label: 'Go to album',            onPress: () => { onClose(); Alert.alert('Go to Album',  `Viewing: ${track.album || 'Unknown Album'}`); } },
        { icon: '≡', label: 'View credits',            onPress: () => { onClose(); Alert.alert('Credits',     `${track.title} · ${track.artist}`); } },
        { icon: '✕', label: "Don't play this",        onPress: () => { onClose(); Alert.alert('Preference',   `We'll play less like "${track.title}".`); } },
    ];

    return (
        <TouchableWithoutFeedback onPress={onClose}>
            <View style={dropStyles.overlay}>
                <TouchableWithoutFeedback>
                    <Animated.View style={[
                        dropStyles.menu,
                        { top: topOffset + 8, opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                    ]}>
                        <View style={dropStyles.trackPreview}>
                            <Image source={{ uri: track.artwork }} style={dropStyles.previewArt} />
                            <View style={dropStyles.previewInfo}>
                                <Text style={dropStyles.previewTitle}  numberOfLines={1}>{track.title}</Text>
                                <Text style={dropStyles.previewArtist} numberOfLines={1}>{track.artist}</Text>
                            </View>
                        </View>
                        <View style={dropStyles.divider} />
                        {options.map((opt, i) => (
                            <TouchableOpacity key={i} style={dropStyles.optionRow} onPress={opt.onPress} activeOpacity={0.65}>
                                <Text style={[dropStyles.optionIcon,  opt.active && dropStyles.optionIconActive]}>{opt.icon}</Text>
                                <Text style={[dropStyles.optionLabel, opt.active && dropStyles.optionLabelActive]}>{opt.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableWithoutFeedback>
            </View>
        </TouchableWithoutFeedback>
    );
};

const dropStyles = StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 999 },
    menu: {
        position: 'absolute',
        right: 16,
        width: SCREEN_WIDTH * 0.76,
        backgroundColor: '#1C1C1E',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    trackPreview:  { flexDirection: 'row', alignItems: 'center', padding: 14 },
    previewArt:    { width: 46, height: 46, borderRadius: 6 },
    previewInfo:   { flex: 1, marginLeft: 12 },
    previewTitle:  { color: '#FFF', fontSize: 14, fontWeight: '700' },
    previewArtist: { color: '#A0A0A0', fontSize: 12, marginTop: 2 },
    divider:       { height: 0.5, backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 14 },
    optionRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14 },
    optionIcon:    { fontSize: 18, width: 28, color: '#B0B0B0' },
    optionIconActive:  { color: COLORS.primary },
    optionLabel:       { color: '#E5E5E5', fontSize: 15, marginLeft: 10, fontWeight: '500' },
    optionLabelActive: { color: COLORS.primary },
});

// ─── Main Full-Screen Player ──────────────────────────────────────────────────
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
    const insets = useSafeAreaInsets();

    // Player state
    const [progressSeconds, setProgressSeconds] = useState(0);
    const [durationSeconds, setDurationSeconds] = useState(230);
    const [isLiked,   setIsLiked]   = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode,    setRepeatMode]    = useState('off');
    const [showQueueModal, setShowQueueModal] = useState(false);
    const [showOptions,    setShowOptions]    = useState(false);

    // Swipe-to-close animation
    const translateY = useRef(new Animated.Value(0)).current;
    const lastGestureY = useRef(0);

    const panResponder = useRef(
        PanResponder.create({
            // Only capture downward vertical swipes that start on the drag handle or top zone
            onMoveShouldSetPanResponder: (_, gs) =>
                gs.dy > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
            onPanResponderMove: (_, gs) => {
                // Only allow dragging downward (positive dy)
                if (gs.dy > 0) {
                    translateY.setValue(gs.dy);
                    lastGestureY.current = gs.dy;
                }
            },
            onPanResponderRelease: (_, gs) => {
                const shouldClose =
                    gs.dy > SWIPE_DOWN_THRESHOLD ||
                    (gs.vy > SWIPE_VELOCITY_THRESHOLD && gs.dy > 60);

                if (shouldClose) {
                    // Slide all the way down then close
                    Animated.timing(translateY, {
                        toValue: SCREEN_HEIGHT,
                        duration: 260,
                        useNativeDriver: true,
                    }).start(() => {
                        translateY.setValue(0);
                        onClose();
                    });
                } else {
                    // Snap back to top
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                        tension: 180,
                        friction: 20,
                    }).start();
                }
            },
            onPanResponderTerminate: () => {
                Animated.spring(translateY, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start();
            },
        })
    ).current;

    // Reset position when modal opens
    useEffect(() => {
        if (visible) translateY.setValue(0);
    }, [visible]);

    // Parse "3:50" → seconds
    useEffect(() => {
        if (track?.duration) {
            const parts = track.duration.split(':');
            if (parts.length === 2) {
                const total = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                if (!isNaN(total)) setDurationSeconds(total);
            }
        }
    }, [track]);

    // Live audio progress
    useEffect(() => {
        const unsub = audioPlayer.addListener((event, data) => {
            if (event === 'progress') {
                if (typeof data.currentTime === 'number') setProgressSeconds(data.currentTime);
                if (data.duration && data.duration > 0) setDurationSeconds(data.duration);
            }
        });
        return () => unsub();
    }, []);

    if (!track) return null;

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const remaining       = Math.max(durationSeconds - progressSeconds, 0);
    const progressPercent = Math.min((progressSeconds / (durationSeconds || 1)) * 100, 100);

    const handleShare = async () => {
        try {
            await Share.share({ message: `Check out "${track.title}" by ${track.artist} on Spotify!` });
        } catch {
            Alert.alert('Share', `Sharing "${track.title}"`);
        }
    };

    const toggleLike = () => {
        const next = !isLiked;
        setIsLiked(next);
        Alert.alert(
            next ? 'Saved to Liked Songs' : 'Removed',
            next ? `"${track.title}" added to Liked Songs.` : `"${track.title}" removed.`
        );
    };

    const toggleRepeat = () => {
        if (repeatMode === 'off')  setRepeatMode('all');
        else if (repeatMode === 'all') setRepeatMode('one');
        else setRepeatMode('off');
    };

    const handleSeek = (e) => {
        const ratio    = Math.max(0, Math.min(1, e.nativeEvent.locationX / (SCREEN_WIDTH - SPACE.lg * 2)));
        const seekSecs = Math.floor(ratio * durationSeconds);
        setProgressSeconds(seekSecs);
        audioPlayer.seekTo(seekSecs);
    };

    // Safe-area-aware top/bottom padding
    const safeTop    = Math.max(insets.top,    Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0);
    const safeBottom = Math.max(insets.bottom, 8);

    // Top-bar height for dropdown positioning
    const topBarBottom = safeTop + 52; // safeTop + topBar height

    const deviceName = Platform.select({ ios: 'iPhone', android: 'This device', default: 'Mobile Device' });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}
        >
            <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />

            {/* Root container – receives pan gesture */}
            <Animated.View
                style={[styles.container, { transform: [{ translateY }] }]}
                {...panResponder.panHandlers}
            >
                {/* ── Background blur layer (z=0) ── */}
                <View style={styles.backgroundLayer} pointerEvents="none">
                    <Image
                        source={{ uri: track.artwork }}
                        style={StyleSheet.absoluteFillObject}
                        blurRadius={Platform.OS === 'ios' ? 28 : 20}
                    />
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(8,8,8,0.80)' }]} />
                </View>

                {/* ── Content layer (z=10) – safe-area-aware ── */}
                <View style={[styles.contentLayer, { paddingTop: safeTop, paddingBottom: safeBottom }]}>

                    {/* Drag handle indicator */}
                    <View style={styles.dragHandle} />

                    {/* ── Top Bar ── */}
                    <View style={styles.topBar}>
                        <TouchableOpacity onPress={onClose} style={styles.topIconBtn} activeOpacity={0.7}>
                            <Text style={styles.chevronDown}>{'⌄'}</Text>
                        </TouchableOpacity>

                        <View style={styles.headerTitleBox}>
                            <Text style={styles.playlistSubtitle}>PLAYING FROM PLAYLIST</Text>
                            <Text style={styles.playlistName} numberOfLines={1}>
                                {track.album || "Today's Top Hits"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.topIconBtn}
                            onPress={() => setShowOptions((v) => !v)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.moreOptions}>{'•••'}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* ── Scrollable Body ── */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[styles.scrollContent, { paddingBottom: safeBottom + 16 }]}
                        scrollEnabled={!showOptions}
                        // Don't let ScrollView at top compete with swipe-down pan
                        scrollEventThrottle={16}
                    >
                        {/* Album Artwork */}
                        <View style={styles.artworkContainer}>
                            <Image source={{ uri: track.artwork }} style={styles.albumArt} />
                        </View>

                        {/* Track Name + Artist + Like */}
                        <View style={styles.metaRow}>
                            <View style={styles.titleArtistBox}>
                                <Text style={styles.trackTitle}  numberOfLines={1}>{track.title}</Text>
                                <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>
                            </View>
                            <TouchableOpacity onPress={toggleLike} style={styles.likeBtn} activeOpacity={0.7}>
                                <Text style={[styles.likeIcon, isLiked && styles.likeIconActive]}>
                                    {isLiked ? '♥' : '♡'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Progress / Seek Bar */}
                        <View style={styles.progressContainer}>
                            <TouchableOpacity style={styles.seekTrack} activeOpacity={1} onPress={handleSeek}>
                                <View style={[styles.seekFill, { width: `${progressPercent}%` }]} />
                                <View style={[styles.seekThumb, { left: `${Math.max(progressPercent - 1, 0)}%` }]} />
                            </TouchableOpacity>
                            <View style={styles.timeRow}>
                                <Text style={styles.timeText}>{formatTime(progressSeconds)}</Text>
                                <Text style={styles.timeText}>{'-'}{formatTime(remaining)}</Text>
                            </View>
                        </View>

                        {/* ── Controls: Shuffle | Prev | Play/Pause | Next | Repeat ── */}
                        <View style={styles.controlsRow}>
                            <TouchableOpacity onPress={() => setIsShuffle(v => !v)} style={styles.controlBtn} activeOpacity={0.7}>
                                <Text style={[styles.controlIcon, isShuffle && styles.controlIconActive]}>{'⇄'}</Text>
                                {isShuffle && <View style={styles.activeDot} />}
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onPrevious} style={styles.controlBtn} activeOpacity={0.7}>
                                <Text style={styles.skipIcon}>{'⏮'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onTogglePlay} style={styles.playPauseBtn} activeOpacity={0.85}>
                                <Text style={styles.playPauseText}>{isPlaying ? '⏸' : '▶'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={onNext} style={styles.controlBtn} activeOpacity={0.7}>
                                <Text style={styles.skipIcon}>{'⏭'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={toggleRepeat} style={styles.controlBtn} activeOpacity={0.7}>
                                <Text style={[styles.controlIcon, repeatMode !== 'off' && styles.controlIconActive]}>
                                    {repeatMode === 'one' ? '🔂' : '🔁'}
                                </Text>
                                {repeatMode !== 'off' && <View style={styles.activeDot} />}
                            </TouchableOpacity>
                        </View>

                        {/* ── Bottom Tool Bar: Device | Share + Queue ── */}
                        <View style={styles.bottomBar}>
                            <TouchableOpacity
                                style={styles.deviceBadge}
                                activeOpacity={0.75}
                                onPress={() => Alert.alert('Listening on', `Playing on: ${deviceName}`)}
                            >
                                <Text style={styles.deviceEmoji}>{'📱'}</Text>
                                <Text style={styles.deviceText} numberOfLines={1}>{deviceName}</Text>
                            </TouchableOpacity>

                            <View style={styles.rightTools}>
                                <TouchableOpacity onPress={handleShare} style={styles.toolBtn} activeOpacity={0.7}>
                                    <Text style={styles.toolBtnIcon}>{'↗'}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => setShowQueueModal(true)} style={styles.toolBtn} activeOpacity={0.7}>
                                    <View style={styles.queueIconWrap}>
                                        <View style={styles.queueLine} />
                                        <View style={[styles.queueLine, { width: 14 }]} />
                                        <View style={styles.queueLine} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* About the Artist */}
                        <View style={styles.artistCard}>
                            <Text style={styles.artistCardTitle}>About the artist</Text>
                            <Image source={{ uri: track.artwork }} style={styles.artistCardImage} />
                            <View style={styles.artistCardBody}>
                                <Text style={styles.artistCardName}>{track.artist}</Text>
                                <Text style={styles.artistListeners}>
                                    {track.plays ? `${track.plays} monthly streams` : '84,920,110 monthly listeners'}
                                </Text>
                                <Text style={styles.artistBio}>
                                    Award-winning hitmaker dominating global charts. Known for record-shattering
                                    singles, visionary production and global stadium tours.
                                </Text>
                                <TouchableOpacity
                                    style={styles.followBtn}
                                    activeOpacity={0.8}
                                    onPress={() => Alert.alert('Follow', `You are now following ${track.artist}!`)}
                                >
                                    <Text style={styles.followBtnText}>Follow</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </View>

                {/* ── Three-Dot Dropdown ── */}
                {showOptions && (
                    <OptionsDropdown
                        visible={showOptions}
                        onClose={() => setShowOptions(false)}
                        track={track}
                        onShare={handleShare}
                        onToggleLike={toggleLike}
                        isLiked={isLiked}
                        topOffset={topBarBottom}
                    />
                )}

                {/* ── Queue Bottom Sheet ── */}
                <Modal
                    visible={showQueueModal}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setShowQueueModal(false)}
                >
                    <View style={queueStyles.overlay}>
                        <View style={[queueStyles.sheet, { paddingBottom: safeBottom + 16 }]}>
                            <View style={queueStyles.handle} />
                            <View style={queueStyles.header}>
                                <Text style={queueStyles.title}>Queue</Text>
                                <TouchableOpacity onPress={() => setShowQueueModal(false)}>
                                    <Text style={queueStyles.closeBtn}>Close</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView style={queueStyles.list} showsVerticalScrollIndicator={false}>
                                <Text style={queueStyles.sectionLabel}>NOW PLAYING</Text>
                                <View style={queueStyles.activeItem}>
                                    <Image source={{ uri: track.artwork }} style={queueStyles.art} />
                                    <View style={queueStyles.itemInfo}>
                                        <Text style={[queueStyles.itemTitle, { color: COLORS.primary }]} numberOfLines={1}>
                                            {track.title}
                                        </Text>
                                        <Text style={queueStyles.itemArtist} numberOfLines={1}>{track.artist}</Text>
                                    </View>
                                    <Text style={{ color: COLORS.primary, fontSize: 15 }}>{'▶'}</Text>
                                </View>

                                <Text style={[queueStyles.sectionLabel, { marginTop: 18 }]}>NEXT IN QUEUE</Text>
                                {queue.length > 0 ? (
                                    queue.map((item, idx) => (
                                        <View key={`queue-item-${item.id || 'track'}-${idx}`} style={queueStyles.item}>
                                            <Image source={{ uri: item.artwork }} style={queueStyles.art} />
                                            <View style={queueStyles.itemInfo}>
                                                <Text style={queueStyles.itemTitle}  numberOfLines={1}>{item.title}</Text>
                                                <Text style={queueStyles.itemArtist} numberOfLines={1}>{item.artist}</Text>
                                            </View>
                                            <Text style={queueStyles.itemDuration}>{item.duration}</Text>
                                        </View>
                                    ))
                                ) : (
                                    <Text style={queueStyles.emptyText}>No additional tracks in queue</Text>
                                )}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Animated.View>
        </Modal>
    );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    // z=0 — blurred art + dark overlay
    backgroundLayer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 0,
        overflow: 'hidden',
    },
    // z=10 — all UI lives here, padded by safe area
    contentLayer: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 10,
        flex: 1,
    },
    // Small pill at the very top as a drag affordance
    dragHandle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.28)',
        alignSelf: 'center',
        marginTop: 6,
        marginBottom: 4,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACE.md,
        paddingVertical: 6,
    },
    topIconBtn: {
        width: 42, height: 42,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chevronDown: {
        color: '#FFF',
        fontSize: 30,
        fontWeight: '300',
        marginTop: -4,
    },
    headerTitleBox: { flex: 1, alignItems: 'center' },
    playlistSubtitle: {
        color: '#A0A0A0',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.3,
    },
    playlistName: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 2,
    },
    moreOptions: {
        color: '#FFF',
        fontSize: 18,
        letterSpacing: 1.5,
        fontWeight: '700',
    },

    scrollContent: {
        paddingHorizontal: SPACE.lg,
    },
    artworkContainer: {
        alignItems: 'center',
        marginTop: SPACE.sm,
        marginBottom: SPACE.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.65,
        shadowRadius: 24,
        elevation: 24,
    },
    albumArt: {
        width: SCREEN_WIDTH - 56,
        height: SCREEN_WIDTH - 56,
        maxWidth: 340,
        maxHeight: 340,
        borderRadius: 8,
        backgroundColor: '#202020',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACE.sm,
    },
    titleArtistBox: { flex: 1, marginRight: SPACE.md },
    trackTitle:  { color: '#FFF', fontSize: 22, fontWeight: 'bold', letterSpacing: 0.2 },
    trackArtist: { color: '#A0A0A0', fontSize: 16, marginTop: 4 },
    likeBtn:     { padding: 6 },
    likeIcon:    { fontSize: 26, color: '#A0A0A0' },
    likeIconActive: { color: COLORS.primary },

    progressContainer: { marginVertical: SPACE.xs },
    seekTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 2,
        position: 'relative',
        justifyContent: 'center',
    },
    seekFill:  { height: '100%', backgroundColor: '#FFF', borderRadius: 2 },
    seekThumb: {
        position: 'absolute',
        width: 13, height: 13,
        borderRadius: 7,
        backgroundColor: '#FFF',
        top: -4.5,
    },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    timeText: { color: '#808080', fontSize: 11 },

    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: SPACE.md,
        paddingHorizontal: SPACE.xs,
    },
    controlBtn: { width: 46, height: 46, justifyContent: 'center', alignItems: 'center' },
    controlIcon: { fontSize: 22, color: '#A0A0A0' },
    controlIconActive: { color: COLORS.primary },
    activeDot: {
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: COLORS.primary,
        marginTop: 2,
    },
    skipIcon: { fontSize: 26, color: '#FFF' },
    playPauseBtn: {
        width: 68, height: 68, borderRadius: 34,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 10,
    },
    playPauseText: { color: '#000', fontSize: 26, fontWeight: 'bold', marginLeft: 2 },

    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: SPACE.xs,
        paddingVertical: SPACE.sm,
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255,255,255,0.08)',
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    deviceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(29,185,84,0.10)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(29,185,84,0.28)',
        maxWidth: SCREEN_WIDTH * 0.55,
    },
    deviceEmoji: { fontSize: 13, marginRight: 6 },
    deviceText:  { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
    rightTools:  { flexDirection: 'row', alignItems: 'center' },
    toolBtn:     { padding: 10, marginLeft: 4, justifyContent: 'center', alignItems: 'center' },
    toolBtnIcon: { color: '#A0A0A0', fontSize: 22, fontWeight: '600' },
    queueIconWrap: { justifyContent: 'space-between', height: 16 },
    queueLine: { height: 2.5, width: 20, backgroundColor: '#A0A0A0', borderRadius: 1.5, marginVertical: 1.5 },

    artistCard: {
        marginTop: SPACE.xl,
        backgroundColor: 'rgba(30,30,30,0.8)',
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    artistCardTitle:  { color: '#FFF', fontSize: 17, fontWeight: 'bold', padding: SPACE.md },
    artistCardImage:  { width: '100%', height: 170, resizeMode: 'cover' },
    artistCardBody:   { padding: SPACE.md },
    artistCardName:   { color: '#FFF', fontSize: 17, fontWeight: 'bold' },
    artistListeners:  { color: '#A0A0A0', fontSize: 13, marginTop: 2, marginBottom: SPACE.sm },
    artistBio:        { color: '#C8C8C8', fontSize: 13, lineHeight: 19 },
    followBtn: {
        marginTop: SPACE.md,
        alignSelf: 'flex-start',
        borderWidth: 1, borderColor: '#FFF',
        borderRadius: 20,
        paddingHorizontal: SPACE.lg,
        paddingVertical: 7,
    },
    followBtnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
});

const queueStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.72,
        padding: SPACE.md,
    },
    handle: {
        width: 36, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'center',
        marginBottom: SPACE.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: SPACE.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: '#2C2C2C',
        marginBottom: SPACE.sm,
    },
    title:    { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    closeBtn: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
    list:     { flex: 1 },
    sectionLabel: { color: '#808080', fontSize: 11, fontWeight: '700', letterSpacing: 1.1, marginBottom: 8 },
    activeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#282828',
        padding: SPACE.sm,
        borderRadius: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACE.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: '#252525',
    },
    art:          { width: 46, height: 46, borderRadius: 5 },
    itemInfo:     { flex: 1, marginLeft: SPACE.sm },
    itemTitle:    { color: '#FFF', fontSize: 14, fontWeight: '600' },
    itemArtist:   { color: '#A0A0A0', fontSize: 12, marginTop: 2 },
    itemDuration: { color: '#808080', fontSize: 12 },
    emptyText:    { color: '#606060', fontSize: 13, textAlign: 'center', paddingVertical: SPACE.lg },
});

export default FullScreenPlayerModal;
