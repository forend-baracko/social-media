import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACE } from '../constants/theme';

export const TABS = {
    HOME: 'Home',
    SEARCH: 'Search',
    LIBRARY: 'Your Library',
    CREATE: 'Create',
};

const BottomNavBar = ({ activeTab, onSelectTab }) => {
    const tabs = [
        { id: TABS.HOME, label: 'Home', icon: '🏠' },
        { id: TABS.SEARCH, label: 'Search', icon: '🔍' },
        { id: TABS.LIBRARY, label: 'Your Library', icon: '📚' },
        { id: TABS.CREATE, label: 'Create', icon: '➕' },
    ];

    return (
        <View style={styles.container}>
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <TouchableOpacity
                        key={tab.id}
                        style={styles.tabButton}
                        activeOpacity={0.7}
                        onPress={() => onSelectTab(tab.id)}
                    >
                        <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                            {tab.icon}
                        </Text>
                        <Text
                            style={[styles.tabLabel, isActive && styles.activeTabLabel]}
                            numberOfLines={1}
                        >
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        height: 62,
        backgroundColor: '#0F0F0F',
        borderTopWidth: 1,
        borderTopColor: '#202020',
        paddingHorizontal: SPACE.sm,
        paddingBottom: 4,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    tabIcon: {
        fontSize: 20,
        marginBottom: 3,
        opacity: 0.65,
    },
    activeTabIcon: {
        opacity: 1,
        transform: [{ scale: 1.08 }],
    },
    tabLabel: {
        color: COLORS.textMuted,
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.2,
    },
    activeTabLabel: {
        color: COLORS.white,
        fontWeight: 'bold',
    },
});

export default BottomNavBar;
