import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { COLORS, SPACE, RADIUS } from '../constants/theme';

export const LibraryView = ({ onSelectPlaylist }) => {
    const playlists = [
        { id: 'p1', title: 'Liked Songs', count: '142 songs', icon: '💚', type: 'Playlist • Auto' },
        { id: 'p2', title: 'Top Hits 2026', count: '50 songs', icon: '🔥', type: 'Playlist • Spotify' },
        { id: 'p3', title: 'Daily Mix 1', count: '32 songs', icon: '🎧', type: 'Made for You' },
        { id: 'p4', title: 'Late Night Chill', count: '64 songs', icon: '🌙', type: 'Playlist • You' },
        { id: 'p5', title: 'Workout Energy', count: '48 songs', icon: '⚡', type: 'Playlist • You' },
    ];

    return (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollPad}>
            <View style={styles.headerRow}>
                <Text style={styles.tabHeading}>Your Library</Text>
                <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert('New Playlist', 'Create playlist dialog')}
                >
                    <Text style={styles.actionBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.chipsRow}>
                {['Playlists', 'Podcasts', 'Artists', 'Downloaded'].map((chip, idx) => (
                    <View key={chip} style={[styles.chip, idx === 0 && styles.activeChip]}>
                        <Text style={[styles.chipText, idx === 0 && styles.activeChipText]}>
                            {chip}
                        </Text>
                    </View>
                ))}
            </View>

            {playlists.map((pl) => (
                <TouchableOpacity
                    key={pl.id}
                    style={styles.playlistRow}
                    activeOpacity={0.7}
                    onPress={() => Alert.alert(pl.title, `Opening playlist containing ${pl.count}`)}
                >
                    <View style={styles.playlistIconBox}>
                        <Text style={styles.playlistEmoji}>{pl.icon}</Text>
                    </View>
                    <View style={styles.playlistInfo}>
                        <Text style={styles.playlistTitle}>{pl.title}</Text>
                        <Text style={styles.playlistMeta}>
                            {pl.type} • {pl.count}
                        </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );
};

export const CreateView = () => {
    const options = [
        { id: 'c1', title: 'Playlist', desc: 'Build a playlist with songs or episodes', icon: '🎶' },
        { id: 'c2', title: 'Blend', desc: 'Combine tastes with friends into a shared playlist', icon: '👥' },
        { id: 'c3', title: 'Folder', desc: 'Organize your playlists neatly', icon: '📁' },
        { id: 'c4', title: 'Jam Session', desc: 'Listen together with friends in real time', icon: '📻' },
    ];

    return (
        <ScrollView style={styles.tabContent} contentContainerStyle={styles.scrollPad}>
            <Text style={styles.tabHeading}>Create</Text>
            <Text style={styles.tabSubheading}>Start something new with your friends or solo</Text>

            <View style={styles.createGrid}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.id}
                        style={styles.createCard}
                        activeOpacity={0.7}
                        onPress={() => Alert.alert(opt.title, `Ready to create a new ${opt.title}!`)}
                    >
                        <View style={styles.createIconBox}>
                            <Text style={styles.createEmoji}>{opt.icon}</Text>
                        </View>
                        <View style={styles.createTextContainer}>
                            <Text style={styles.createCardTitle}>{opt.title}</Text>
                            <Text style={styles.createCardDesc}>{opt.desc}</Text>
                        </View>
                        <Text style={styles.createPlus}>+</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    tabContent: {
        flex: 1,
    },
    scrollPad: {
        paddingHorizontal: SPACE.lg,
        paddingTop: SPACE.sm,
        paddingBottom: 110,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACE.md,
    },
    tabHeading: {
        color: COLORS.textPrimary,
        fontSize: 24,
        fontWeight: 'bold',
    },
    tabSubheading: {
        color: COLORS.textSecondary,
        fontSize: 14,
        marginBottom: SPACE.lg,
    },
    actionBtn: {
        backgroundColor: COLORS.surfaceElevated,
        paddingHorizontal: SPACE.md,
        paddingVertical: 6,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    actionBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    chipsRow: {
        flexDirection: 'row',
        marginBottom: SPACE.md,
    },
    chip: {
        backgroundColor: COLORS.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.circle,
        marginRight: 8,
    },
    activeChip: {
        backgroundColor: COLORS.white,
    },
    chipText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    activeChipText: {
        color: COLORS.black,
    },
    playlistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACE.sm,
        borderBottomWidth: 0.5,
        borderBottomColor: '#202020',
    },
    playlistIconBox: {
        width: 52,
        height: 52,
        borderRadius: RADIUS.xs,
        backgroundColor: '#262626',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playlistEmoji: {
        fontSize: 24,
    },
    playlistInfo: {
        flex: 1,
        marginLeft: SPACE.md,
    },
    playlistTitle: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '600',
    },
    playlistMeta: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 3,
    },
    chevron: {
        color: COLORS.textMuted,
        fontSize: 20,
    },
    createGrid: {
        marginTop: SPACE.xs,
    },
    createCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceElevated,
        padding: SPACE.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACE.md,
        borderWidth: 1,
        borderColor: '#2D2D2D',
    },
    createIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#353535',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACE.md,
    },
    createEmoji: {
        fontSize: 22,
    },
    createTextContainer: {
        flex: 1,
    },
    createCardTitle: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    createCardDesc: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 3,
    },
    createPlus: {
        color: COLORS.primary,
        fontSize: 24,
        fontWeight: '300',
        marginLeft: SPACE.sm,
    },
});
