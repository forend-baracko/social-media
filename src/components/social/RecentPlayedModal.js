import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../constants/theme';
import SwipeableTrackRow from '../player/SwipeableTrackRow';
import { MOCK_TRACKS } from '../../services/audiomackService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const RECENT_ALBUMS = [
    { id: 'alb-1', title: 'After Hours', artist: 'The Weeknd', year: '2020', artwork: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80', tracks: '14 songs' },
    { id: 'alb-2', title: 'Scorpion', artist: 'Drake', year: '2018', artwork: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80', tracks: '25 songs' },
    { id: 'alb-3', title: "Harry's House", artist: 'Harry Styles', year: '2022', artwork: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&q=80', tracks: '13 songs' },
    { id: 'alb-4', title: 'Future Nostalgia', artist: 'Dua Lipa', year: '2020', artwork: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80', tracks: '11 songs' },
    { id: 'alb-5', title: 'Love, Damini', artist: 'Burna Boy', year: '2022', artwork: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&q=80', tracks: '19 songs' },
    { id: 'alb-6', title: '÷ (Divide)', artist: 'Ed Sheeran', year: '2017', artwork: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=400&q=80', tracks: '16 songs' },
];

const RecentPlayedModal = ({
    visible,
    onClose,
    recentTracks = [],
    onPlayTrack,
    currentTrack,
    onOpenTrackMenu,
    onAddToQueue,
    onAddToPlaylist,
    onToggleFavorite,
    isLiked,
}) => {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('Songs'); // 'Songs' | 'Albums'

    // Combine recent tracks with fallback mock tracks if few
    const displayTracks = recentTracks.length > 0 ? recentTracks : MOCK_TRACKS;

    const todayTracks = displayTracks.slice(0, 3);
    const yesterdayTracks = displayTracks.slice(3, 7);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={onClose}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Recently Played</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Sub-tabs: Songs / Albums */}
                <View style={styles.tabSwitch}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Songs' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('Songs')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'Songs' && styles.tabButtonTextActive]}>
                            Songs & Episodes
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Albums' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('Albums')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'Albums' && styles.tabButtonTextActive]}>
                            Albums
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    {activeTab === 'Songs' ? (
                        <>
                            {/* Today */}
                            <Text style={styles.timeGroupHeader}>Today</Text>
                            {todayTracks.map((track) => (
                                <SwipeableTrackRow
                                    key={`rec-today-${track.id}`}
                                    track={track}
                                    isSelected={currentTrack?.id === track.id}
                                    onPress={() => onPlayTrack && onPlayTrack(track)}
                                    onOpenMenu={() => onOpenTrackMenu && onOpenTrackMenu(track)}
                                    onAddToQueue={onAddToQueue}
                                    onAddToPlaylist={onAddToPlaylist}
                                    onToggleFavorite={onToggleFavorite}
                                    isLiked={isLiked && isLiked(track.id)}
                                />
                            ))}

                            {/* Yesterday */}
                            {yesterdayTracks.length > 0 && (
                                <>
                                    <Text style={styles.timeGroupHeader}>Yesterday & Earlier</Text>
                                    {yesterdayTracks.map((track) => (
                                        <SwipeableTrackRow
                                            key={`rec-yesterday-${track.id}`}
                                            track={track}
                                            isSelected={currentTrack?.id === track.id}
                                            onPress={() => onPlayTrack && onPlayTrack(track)}
                                            onOpenMenu={() => onOpenTrackMenu && onOpenTrackMenu(track)}
                                            onAddToQueue={onAddToQueue}
                                            onAddToPlaylist={onAddToPlaylist}
                                            onToggleFavorite={onToggleFavorite}
                                            isLiked={isLiked && isLiked(track.id)}
                                        />
                                    ))}
                                </>
                            )}
                        </>
                    ) : (
                        /* Albums Grid */
                        <View style={styles.albumsGrid}>
                            {RECENT_ALBUMS.map((alb) => (
                                <TouchableOpacity
                                    key={alb.id}
                                    style={styles.albumCard}
                                    activeOpacity={0.8}
                                    onPress={() => Alert.alert(alb.title, `Playing album "${alb.title}" by ${alb.artist}`)}
                                >
                                    <Image source={{ uri: alb.artwork }} style={styles.albumCover} />
                                    <Text style={styles.albumTitle} numberOfLines={1}>
                                        {alb.title}
                                    </Text>
                                    <Text style={styles.albumArtist} numberOfLines={1}>
                                        {alb.artist} • {alb.year}
                                    </Text>
                                    <Text style={styles.albumTracks}>{alb.tracks}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </ScrollView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACE.md,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
    },
    backBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        color: COLORS.textPrimary,
        fontSize: 34,
        fontWeight: '300',
        lineHeight: 36,
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: 17,
        fontWeight: 'bold',
    },
    tabSwitch: {
        flexDirection: 'row',
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: '#222',
        gap: 8,
    },
    tabButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: RADIUS.circle,
        backgroundColor: '#202020',
    },
    tabButtonActive: {
        backgroundColor: COLORS.white,
    },
    tabButtonText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    tabButtonTextActive: {
        color: COLORS.black,
    },
    scroll: {
        flex: 1,
    },
    timeGroupHeader: {
        color: COLORS.textMuted,
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.md,
        paddingBottom: 6,
    },
    albumsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: SPACE.md,
        paddingTop: SPACE.md,
        gap: 12,
    },
    albumCard: {
        width: (SCREEN_WIDTH - 32 - 12) / 2,
        backgroundColor: '#181818',
        borderRadius: 8,
        padding: 10,
        borderWidth: 1,
        borderColor: '#242424',
    },
    albumCover: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 6,
        marginBottom: 8,
    },
    albumTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    albumArtist: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginBottom: 4,
    },
    albumTracks: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: '600',
    },
});

export default RecentPlayedModal;
