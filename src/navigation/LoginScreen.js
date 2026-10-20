import React from 'react';
import { SafeAreaView, View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACE, RADIUS } from '../constants/theme.js';

const LoginScreen = ({ navigation = null }) => {
    return (
        <SafeAreaView style={styles.safe}>
            <View>
                <Text style={styles.header}>Hello World</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.primary,

    },
    header: {
        color: COLORS.text,
        padding: SPACE.lg
    }
});

export default LoginScreen;
