import React from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

import OnBoardingScreen from './OnBoardingScreen';
import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.splashContainer}>
                <Image
                    source={require('../assets/images/spotify-icon.webp')}
                    style={styles.splashLogo}
                />
                <ActivityIndicator size="large" color={COLORS.primary} style={styles.spinner} />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
            {user ? (
                // Authenticated Stack
                <Stack.Screen name="Home" component={HomeScreen} />
            ) : (
                // Unauthenticated Auth Stack
                <>
                    <Stack.Screen name="OnBoarding" component={OnBoardingScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                </>
            )}
        </Stack.Navigator>
    );
}

const styles = StyleSheet.create({
    splashContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    splashLogo: {
        width: 100,
        height: 100,
        resizeMode: 'contain',
    },
    spinner: {
        marginTop: 24,
    },
});
