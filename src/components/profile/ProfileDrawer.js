import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Animated,
    Dimensions,
    TouchableWithoutFeedback,
    ScrollView,
    Image,
    Alert,
} from 'react-native';
import { COLORS, SPACE, RADIUS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.78, 320);

const ProfileDrawer = ({
    visible,
    onClose,
    user,
    userProfile,
    onLogout,
    onOpenStats,
    onOpenRecents,
    onOpenMessages,
    onOpenSettings,
}) => {
    const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -DRAWER_WIDTH,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, slideAnim, fadeAnim]);

    const displayName =
        userProfile?.displayName ||
        user?.displayName ||
        (user?.email ? user.email.split('@')[0] : 'Spotify User');

    const email = user?.email || 'user@spotify.com';
    const photoURL = userProfile?.photoURL || user?.photoURL || null;

    const handleAction = (title, message) => {
        Alert.alert(title, message || 'Feature coming soon in the next release!');
    };

    const menuItems = [
        {
            id: 'stats',
            icon: '📊',
            label: 'User Stats',
            description: 'Listening history & top genres',
            onPress: () => {
                onClose();
                if (onOpenStats) onOpenStats();
            },
        },
        {
            id: 'recents',
            icon: '🕒',
            label: 'Recents',
            description: 'Recently played albums & tracks',
            onPress: () => {
                onClose();
                if (onOpenRecents) onOpenRecents();
            },
        },
        {
            id: 'messages',
            icon: '💬',
            label: 'Messages',
            description: 'Friend activity & playlist shares',
            badge: '2',
            onPress: () => {
                onClose();
                if (onOpenMessages) onOpenMessages();
            },
        },
        {
            id: 'account_status',
            icon: '⭐',
            label: 'Account Status',
            description: 'Premium Family • Active',
            isHighlighted: true,
            onPress: () => handleAction('Account Status', 'Your Spotify Premium plan is active and renews on Nov 15.'),
        },
        {
            id: 'add_account',
            icon: '➕',
            label: 'Add Account',
            description: 'Switch or add another profile',
            onPress: () => handleAction('Add Account', 'Multi-account switcher will be available in settings.'),
        },
        {
            id: 'settings',
            icon: '⚙️',
            label: 'Settings',
            description: 'Audio quality, downloads & privacy',
            onPress: () => {
                onClose();
                if (onOpenSettings) onOpenSettings();
            },
        },
    ];

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.overlayContainer}>
                {/* Backdrop */}
                <TouchableWithoutFeedback onPress={onClose}>
                    <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
                </TouchableWithoutFeedback>

                {/* Animated Drawer */}
                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            transform: [{ translateX: slideAnim }],
                        },
                    ]}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.drawerScroll}
                    >
                        {/* Profile Header */}
                        <View style={styles.profileHeader}>
                            <View style={styles.avatarWrapper}>
                                {photoURL ? (
                                    <Image source={{ uri: photoURL }} style={styles.avatarImage} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>
                                            {displayName.charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                )}
                                <View style={styles.onlineBadge} />
                            </View>

                            <Text style={styles.drawerUserName} numberOfLines={1}>
                                {displayName}
                            </Text>
                            <Text style={styles.drawerUserEmail} numberOfLines={1}>
                                {email}
                            </Text>

                            <TouchableOpacity
                                style={styles.viewProfileBtn}
                                activeOpacity={0.8}
                                onPress={() => handleAction('Profile', `Public profile for @${displayName.toLowerCase().replace(/\s+/g, '_')}`)}
                            >
                                <Text style={styles.viewProfileText}>View Profile</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.divider} />

                        {/* Menu Options */}
                        <View style={styles.menuSection}>
                            {menuItems.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={styles.menuItem}
                                    activeOpacity={0.7}
                                    onPress={item.onPress}
                                >
                                    <View style={[styles.menuIconContainer, item.isHighlighted && styles.highlightedIcon]}>
                                        <Text style={styles.menuIconText}>{item.icon}</Text>
                                    </View>
                                    <View style={styles.menuTextContainer}>
                                        <View style={styles.menuTitleRow}>
                                            <Text style={[styles.menuLabel, item.isHighlighted && styles.highlightedLabel]}>
                                                {item.label}
                                            </Text>
                                            {item.badge && (
                                                <View style={styles.badgePill}>
                                                    <Text style={styles.badgePillText}>{item.badge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.menuDescription} numberOfLines={1}>
                                            {item.description}
                                        </Text>
                                    </View>
                                    <Text style={styles.chevron}>›</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        {/* Sign Out / Bottom section */}
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            activeOpacity={0.8}
                            onPress={() => {
                                onClose();
                                onLogout && onLogout();
                            }}
                        >
                            <Text style={styles.logoutIcon}>🚪</Text>
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>

                        <Text style={styles.versionText}>Spotify v8.9.2 • Premium Edition</Text>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlayContainer: {
        flex: 1,
        flexDirection: 'row',
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
    },
    drawer: {
        width: DRAWER_WIDTH,
        height: '100%',
        backgroundColor: '#161616',
        borderRightWidth: 1,
        borderRightColor: '#282828',
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 16,
    },
    drawerScroll: {
        paddingTop: 54,
        paddingBottom: 40,
        paddingHorizontal: SPACE.md,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: SPACE.sm,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: SPACE.sm,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: COLORS.primary,
        borderWidth: 2,
        borderColor: '#161616',
    },
    drawerUserName: {
        color: COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 4,
        textAlign: 'center',
    },
    drawerUserEmail: {
        color: COLORS.textSecondary,
        fontSize: 12,
        marginTop: 2,
        marginBottom: SPACE.sm,
        textAlign: 'center',
    },
    viewProfileBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: SPACE.lg,
        paddingVertical: 7,
        borderRadius: RADIUS.circle,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        marginTop: 4,
    },
    viewProfileText: {
        color: COLORS.textPrimary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    divider: {
        height: 1,
        backgroundColor: '#262626',
        marginVertical: SPACE.md,
    },
    menuSection: {
        paddingVertical: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        paddingHorizontal: 8,
        borderRadius: RADIUS.sm,
    },
    menuIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#222222',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACE.md,
    },
    highlightedIcon: {
        backgroundColor: 'rgba(29, 185, 84, 0.15)',
    },
    menuIconText: {
        fontSize: 17,
    },
    menuTextContainer: {
        flex: 1,
    },
    menuTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLabel: {
        color: COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    highlightedLabel: {
        color: COLORS.primary,
    },
    badgePill: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 1,
        marginLeft: 8,
    },
    badgePillText: {
        color: '#000',
        fontSize: 10,
        fontWeight: 'bold',
    },
    menuDescription: {
        color: COLORS.textSecondary,
        fontSize: 11,
        marginTop: 2,
    },
    chevron: {
        color: COLORS.textMuted,
        fontSize: 20,
        marginLeft: 6,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(226, 33, 52, 0.1)',
        borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: 'rgba(226, 33, 52, 0.25)',
    },
    logoutIcon: {
        fontSize: 16,
        marginRight: SPACE.sm,
    },
    logoutText: {
        color: '#FF5C5C',
        fontSize: 14,
        fontWeight: '600',
    },
    versionText: {
        color: COLORS.textMuted,
        fontSize: 11,
        textAlign: 'center',
        marginTop: SPACE.lg,
    },
});

export default ProfileDrawer;
