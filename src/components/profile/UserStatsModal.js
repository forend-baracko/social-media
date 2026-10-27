import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Share,
    Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOP_ARTISTS = [
    { rank: 1, name: 'The Weeknd', plays: '482 plays', genre: 'R&B / Synthpop', avatar: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80' },
    { rank: 2, name: 'Drake', plays: '356 plays', genre: 'Hip-Hop', avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80' },
    { rank: 3, name: 'December Avenue', plays: '298 plays', genre: 'OPM / Indie Rock', avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&q=80' },
    { rank: 4, name: 'Dua Lipa', plays: '245 plays', genre: 'Dance-Pop', avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80' },
    { rank: 5, name: 'Harry Styles', plays: '190 plays', genre: 'Pop', avatar: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=200&q=80' },
];

const TOP_TRACKS = [
    { rank: 1, title: 'Fallin', artist: 'December Avenue', duration: '4:17', plays: '142 streams' },
    { rank: 2, title: 'Blinding Lights', artist: 'The Weeknd', duration: '3:20', plays: '118 streams' },
    { rank: 3, title: "God's Plan", artist: 'Drake', duration: '3:18', plays: '94 streams' },
    { rank: 4, title: 'As It Was', artist: 'Harry Styles', duration: '2:47', plays: '81 streams' },
    { rank: 5, title: 'Levitating', artist: 'Dua Lipa', duration: '3:23', plays: '67 streams' },
];

const GENRES = [
    { name: 'Hip-Hop & Rap', pct: 38, color: '#1DB954' },
    { name: 'R&B & Soul', pct: 28, color: '#3E82F7' },
    { name: 'Pop & Dance', pct: 20, color: '#8E24AA' },
    { name: 'Indie & Alternative', pct: 14, color: '#FF9800' },
];

const UserStatsModal = ({
    visible,
    onClose,
    userProfile,
    user,
}) => {
    const insets = useSafeAreaInsets();
    const [timeframe, setTimeframe] = useState('Month'); // 'Week', 'Month', 'All Time'

    const displayName =
        userProfile?.displayName ||
        user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Music Fan');

    const handleShareStats = async () => {
        try {
            await Share.share({
                title: 'My Spotify Sound Capsule',
                message: `🎶 My Spotify stats this month: 142 hours listened! Top Artist: The Weeknd. Top Track: Fallin. #SpotifyStats`,
            });
        } catch (e) {}
    };

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
                    <Text style={styles.headerTitle}>User Stats & Insights</Text>
                    <TouchableOpacity
                        style={styles.shareBtn}
                        onPress={handleShareStats}
                    >
                        <Text style={styles.shareIcon}>↗</Text>
                    </TouchableOpacity>
                </View>

                {/* Filter Pills */}
                <View style={styles.timeframeRow}>
                    {['4 Weeks', 'Month', 'All Time'].map((tf) => (
                        <TouchableOpacity
                            key={tf}
                            style={[
                                styles.timeframePill,
                                timeframe === tf && styles.timeframePillActive,
                            ]}
                            onPress={() => setTimeframe(tf)}
                        >
                            <Text
                                style={[
                                    styles.timeframeText,
                                    timeframe === tf && styles.timeframeTextActive,
                                ]}
                            >
                                {tf}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Persona Badge */}
                    <View style={styles.personaCard}>
                        <View style={styles.personaHeader}>
                            <Text style={styles.personaBadge}>YOUR SOUND PERSONALITY</Text>
                            <Text style={styles.personaTitle}>The Sonic Pioneer</Text>
                            <Text style={styles.personaDesc}>
                                You listen to emerging artists before they reach global charts, with a strong appetite for late-night vibes and beats.
                            </Text>
                        </View>
                    </View>

                    {/* Stats Highlights Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>142h</Text>
                            <Text style={styles.statLabel}>Listening Time</Text>
                            <Text style={styles.statSub}>+18% from last month</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>1,248</Text>
                            <Text style={styles.statLabel}>Tracks Streamed</Text>
                            <Text style={styles.statSub}>42 unique artists</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>28</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                            <Text style={styles.statSub}>Personal record 🔥</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statNumber}>Top 1%</Text>
                            <Text style={styles.statLabel}>The Weeknd Fan</Text>
                            <Text style={styles.statSub}>Global listener</Text>
                        </View>
                    </View>

                    {/* Top Genres Breakdown */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Top Genres</Text>
                        <View style={styles.genreBarContainer}>
                            {GENRES.map((g) => (
                                <View
                                    key={g.name}
                                    style={[
                                        styles.genreBarSegment,
                                        { width: `${g.pct}%`, backgroundColor: g.color },
                                    ]}
                                />
                            ))}
                        </View>

                        <View style={styles.genreLegend}>
                            {GENRES.map((g) => (
                                <View key={g.name} style={styles.genreLegendItem}>
                                    <View style={[styles.genreDot, { backgroundColor: g.color }]} />
                                    <Text style={styles.genreName}>{g.name}</Text>
                                    <Text style={styles.genrePct}>{g.pct}%</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Top Artists */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Top Artists This {timeframe}</Text>
                        {TOP_ARTISTS.map((artist) => (
                            <View key={artist.rank} style={styles.artistRow}>
                                <Text style={styles.rankNumber}>{artist.rank}</Text>
                                <Image source={{ uri: artist.avatar }} style={styles.artistAvatar} />
                                <View style={styles.artistInfo}>
                                    <Text style={styles.artistName}>{artist.name}</Text>
                                    <Text style={styles.artistGenre}>{artist.genre}</Text>
                                </View>
                                <Text style={styles.artistPlays}>{artist.plays}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Top Tracks */}
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Top Songs This {timeframe}</Text>
                        {TOP_TRACKS.map((t) => (
                            <View key={t.rank} style={styles.trackRow}>
                                <Text style={styles.rankNumber}>{t.rank}</Text>
                                <View style={styles.trackInfo}>
                                    <Text style={styles.trackTitle}>{t.title}</Text>
                                    <Text style={styles.trackArtist}>{t.artist}</Text>
                                </View>
                                <Text style={styles.trackPlays}>{t.plays}</Text>
                            </View>
                        ))}
                    </View>
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
    shareBtn: {
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareIcon: {
        color: COLORS.primary,
        fontSize: 22,
    },
    timeframeRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACE.md,
        paddingVertical: SPACE.sm,
        gap: 8,
    },
    timeframePill: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: RADIUS.circle,
        backgroundColor: '#242424',
    },
    timeframePillActive: {
        backgroundColor: COLORS.white,
    },
    timeframeText: {
        color: COLORS.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    timeframeTextActive: {
        color: COLORS.black,
    },
    scroll: {
        flex: 1,
        paddingHorizontal: SPACE.md,
    },
    personaCard: {
        backgroundColor: '#1E382B',
        borderRadius: RADIUS.lg,
        padding: SPACE.lg,
        marginTop: SPACE.sm,
        marginBottom: SPACE.md,
        borderWidth: 1,
        borderColor: '#26543A',
    },
    personaBadge: {
        color: COLORS.primary,
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    personaTitle: {
        color: COLORS.white,
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    personaDesc: {
        color: '#C0D8C8',
        fontSize: 13,
        lineHeight: 18,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: SPACE.md,
    },
    statBox: {
        width: (SCREEN_WIDTH - 32 - 10) / 2,
        backgroundColor: '#1C1C1C',
        borderRadius: RADIUS.md,
        padding: SPACE.md,
        borderWidth: 1,
        borderColor: '#282828',
    },
    statNumber: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    statSub: {
        color: COLORS.textMuted,
        fontSize: 11,
        marginTop: 4,
    },
    sectionCard: {
        backgroundColor: '#1C1C1C',
        borderRadius: RADIUS.lg,
        padding: SPACE.md,
        marginBottom: SPACE.md,
        borderWidth: 1,
        borderColor: '#282828',
    },
    sectionTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACE.md,
    },
    genreBarContainer: {
        height: 12,
        borderRadius: 6,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: SPACE.md,
    },
    genreBarSegment: {
        height: '100%',
    },
    genreLegend: {
        gap: 8,
    },
    genreLegendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    genreDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    genreName: {
        flex: 1,
        color: COLORS.textSecondary,
        fontSize: 13,
    },
    genrePct: {
        color: COLORS.textPrimary,
        fontSize: 13,
        fontWeight: '600',
    },
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 0.5,
        borderBottomColor: '#262626',
    },
    rankNumber: {
        color: COLORS.textMuted,
        fontSize: 14,
        fontWeight: 'bold',
        width: 24,
    },
    artistAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: SPACE.sm,
    },
    artistInfo: {
        flex: 1,
    },
    artistName: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    artistGenre: {
        color: COLORS.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    artistPlays: {
        color: COLORS.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#262626',
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    trackArtist: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    trackPlays: {
        color: COLORS.textMuted,
        fontSize: 12,
    },
});

export default UserStatsModal;
