import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SPACE } from '../../constants/theme';

export default function PageThree() {
    return (
        <View style={styles.container}>
            <Image
                source={require('../../assets/images/spotify-icon.webp')}
                style={styles.image}
            />
            <Text style={styles.title}>Listen Everywhere</Text>
            <Text style={styles.subtitle}>Stream your favorite tracks, discover artists, and create your library</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: SPACE.md,
    },
    image: {
        width: 140,
        height: 140,
        resizeMode: 'contain',
        marginBottom: SPACE.xl,
    },
    title: {
        color: COLORS.textPrimary,
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: SPACE.sm,
    },
    subtitle: {
        color: COLORS.textSecondary,
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
});