import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACE, RADIUS } from '../../constants/theme';

const SettingsModal = ({
    visible,
    onClose,
    user,
    userProfile,
    onLogout,
}) => {
    const insets = useSafeAreaInsets();

    // Setting states
    const [dataSaver, setDataSaver] = useState(false);
    const [offlineMode, setOfflineMode] = useState(false);
    const [crossfade, setCrossfade] = useState('4s');
    const [gapless, setGapless] = useState(true);
    const [automix, setAutomix] = useState(true);
    const [normalizeVolume, setNormalizeVolume] = useState(true);
    const [monoAudio, setMonoAudio] = useState(false);
    const [wifiQuality, setWifiQuality] = useState('Very High');
    const [cellularQuality, setCellularQuality] = useState('High');
    const [privateSession, setPrivateSession] = useState(false);
    const [broadcastActivity, setBroadcastActivity] = useState(true);
    const [cacheSize, setCacheSize] = useState('420 MB');

    const displayName =
        userProfile?.displayName ||
        user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Spotify User');

    const handleClearCache = () => {
        Alert.alert(
            'Clear Cache',
            'Your downloads will not be removed. This will free up 420 MB of temporary storage.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear Cache',
                    style: 'destructive',
                    onPress: () => {
                        setCacheSize('0 KB');
                        Alert.alert('Success', 'Cache has been cleared!');
                    },
                },
            ]
        );
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
                    <Text style={styles.headerTitle}>Settings</Text>
                    <View style={{ width: 36 }} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={{ paddingBottom: 60 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Account Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Account</Text>
                        <View style={styles.accountCard}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountName}>{displayName}</Text>
                                <Text style={styles.accountEmail}>{user?.email || 'user@spotify.com'}</Text>
                                <View style={styles.premiumBadge}>
                                    <Text style={styles.premiumBadgeText}>Spotify Premium Family</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.editBtn}
                                onPress={() => Alert.alert('Account', 'Your Premium Family subscription is active.')}
                            >
                                <Text style={styles.editBtnText}>Manage</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Data Saver */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Data Saver</Text>
                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Audio Data Saver</Text>
                                <Text style={styles.settingSubtitle}>Sets audio quality to low (24 kbit/s)</Text>
                            </View>
                            <Switch
                                value={dataSaver}
                                onValueChange={setDataSaver}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>

                    {/* Playback */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Playback</Text>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Offline Mode</Text>
                                <Text style={styles.settingSubtitle}>Only play downloaded music and podcasts</Text>
                            </View>
                            <Switch
                                value={offlineMode}
                                onValueChange={setOfflineMode}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>

                        {/* Crossfade */}
                        <TouchableOpacity
                            style={styles.settingRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                const options = ['Off', '2s', '4s', '8s', '12s'];
                                const next = options[(options.indexOf(crossfade) + 1) % options.length];
                                setCrossfade(next);
                            }}
                        >
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Crossfade</Text>
                                <Text style={styles.settingSubtitle}>Seamlessly transition between tracks ({crossfade})</Text>
                            </View>
                            <Text style={styles.valueText}>{crossfade} ›</Text>
                        </TouchableOpacity>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Gapless Playback</Text>
                                <Text style={styles.settingSubtitle}>Eliminates silence between songs</Text>
                            </View>
                            <Switch
                                value={gapless}
                                onValueChange={setGapless}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Automix</Text>
                                <Text style={styles.settingSubtitle}>Smooth mixed transitions between songs</Text>
                            </View>
                            <Switch
                                value={automix}
                                onValueChange={setAutomix}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Normalize Volume</Text>
                                <Text style={styles.settingSubtitle}>Set the same volume level for all songs</Text>
                            </View>
                            <Switch
                                value={normalizeVolume}
                                onValueChange={setNormalizeVolume}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Mono Audio</Text>
                                <Text style={styles.settingSubtitle}>Plays same sound from both left and right speakers</Text>
                            </View>
                            <Switch
                                value={monoAudio}
                                onValueChange={setMonoAudio}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>

                    {/* Audio Quality */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Audio Quality</Text>

                        <TouchableOpacity
                            style={styles.settingRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                const q = ['Normal', 'High', 'Very High'];
                                setWifiQuality(q[(q.indexOf(wifiQuality) + 1) % q.length]);
                            }}
                        >
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>WiFi Streaming</Text>
                                <Text style={styles.settingSubtitle}>Highest fidelity (320 kbit/s)</Text>
                            </View>
                            <Text style={styles.valueText}>{wifiQuality} ›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingRow}
                            activeOpacity={0.7}
                            onPress={() => {
                                const q = ['Automatic', 'Normal', 'High'];
                                setCellularQuality(q[(q.indexOf(cellularQuality) + 1) % q.length]);
                            }}
                        >
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Cellular Streaming</Text>
                                <Text style={styles.settingSubtitle}>Adapts to your cellular network</Text>
                            </View>
                            <Text style={styles.valueText}>{cellularQuality} ›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingRow}
                            activeOpacity={0.7}
                            onPress={() => Alert.alert('Equalizer', 'Presets: Bass Boost, Electronic, Vocal, Acoustic')}
                        >
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Equalizer</Text>
                                <Text style={styles.settingSubtitle}>Custom frequency & tone adjustment</Text>
                            </View>
                            <Text style={styles.valueText}>Bass Boost ›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Storage & Cache */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Storage & Cache</Text>
                        <View style={styles.storageCard}>
                            <View style={styles.storageGauge}>
                                <View style={[styles.gaugeSegment, { width: '12%', backgroundColor: '#3E82F7' }]} />
                                <View style={[styles.gaugeSegment, { width: '22%', backgroundColor: COLORS.primary }]} />
                                <View style={[styles.gaugeSegment, { width: '16%', backgroundColor: '#FF9800' }]} />
                                <View style={[styles.gaugeSegment, { width: '50%', backgroundColor: '#333' }]} />
                            </View>
                            <View style={styles.storageDetails}>
                                <Text style={styles.storageLabel}>App: 280 MB  •  Downloads: 650 MB  •  Cache: {cacheSize}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.clearCacheBtn}
                                activeOpacity={0.8}
                                onPress={handleClearCache}
                            >
                                <Text style={styles.clearCacheText}>Clear Cache</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Social */}
                    <View style={styles.section}>
                        <Text style={styles.sectionHeader}>Social & Privacy</Text>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Private Session</Text>
                                <Text style={styles.settingSubtitle}>Listen anonymously without updating your stats</Text>
                            </View>
                            <Switch
                                value={privateSession}
                                onValueChange={setPrivateSession}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>

                        <View style={styles.settingRow}>
                            <View style={styles.settingMeta}>
                                <Text style={styles.settingTitle}>Listening Activity</Text>
                                <Text style={styles.settingSubtitle}>Share what I listen to with my followers</Text>
                            </View>
                            <Switch
                                value={broadcastActivity}
                                onValueChange={setBroadcastActivity}
                                trackColor={{ false: '#333', true: COLORS.primary }}
                                thumbColor={COLORS.white}
                            />
                        </View>
                    </View>

                    {/* Sign Out */}
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                                onClose();
                                if (onLogout) onLogout();
                            }}
                        >
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                        <Text style={styles.versionInfo}>Spotify for Mobile • v8.9.2 • Build 148</Text>
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
    scroll: {
        flex: 1,
        paddingHorizontal: SPACE.md,
    },
    section: {
        marginTop: SPACE.lg,
    },
    sectionHeader: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: SPACE.sm,
    },
    accountCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        borderRadius: RADIUS.md,
        padding: SPACE.md,
        borderWidth: 1,
        borderColor: '#282828',
    },
    accountInfo: {
        flex: 1,
    },
    accountName: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    accountEmail: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
    },
    premiumBadge: {
        backgroundColor: '#1E382B',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: RADIUS.xs,
        marginTop: 6,
    },
    premiumBadgeText: {
        color: COLORS.primary,
        fontSize: 11,
        fontWeight: 'bold',
    },
    editBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: '#444',
    },
    editBtnText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: '600',
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: '#202020',
    },
    settingMeta: {
        flex: 1,
        marginRight: SPACE.md,
    },
    settingTitle: {
        color: COLORS.textPrimary,
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 2,
    },
    settingSubtitle: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    valueText: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    storageCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: RADIUS.md,
        padding: SPACE.md,
        borderWidth: 1,
        borderColor: '#262626',
    },
    storageGauge: {
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        flexDirection: 'row',
        marginBottom: SPACE.sm,
    },
    gaugeSegment: {
        height: '100%',
    },
    storageDetails: {
        marginBottom: SPACE.md,
    },
    storageLabel: {
        color: COLORS.textSecondary,
        fontSize: 12,
    },
    clearCacheBtn: {
        backgroundColor: '#262626',
        paddingVertical: 10,
        borderRadius: RADIUS.circle,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#383838',
    },
    clearCacheText: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    logoutBtn: {
        backgroundColor: '#1E1E1E',
        borderRadius: RADIUS.circle,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginTop: SPACE.sm,
    },
    logoutText: {
        color: '#FF5252',
        fontSize: 15,
        fontWeight: 'bold',
    },
    versionInfo: {
        color: COLORS.textMuted,
        fontSize: 11,
        textAlign: 'center',
        marginTop: SPACE.md,
    },
});

export default SettingsModal;
