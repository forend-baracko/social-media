import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { MusicProvider } from './src/context/MusicContext';
import RootNavigator from './src/navigation/RootNavigator';
import { COLORS } from './src/constants/theme';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <AuthProvider>
        <MusicProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </MusicProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}