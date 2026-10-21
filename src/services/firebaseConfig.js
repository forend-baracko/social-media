import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../constants/config';

export const isFirebaseConfigured = () => {
    return (
        FIREBASE_CONFIG.apiKey &&
        FIREBASE_CONFIG.apiKey !== 'YOUR_FIREBASE_API_KEY' &&
        FIREBASE_CONFIG.projectId &&
        FIREBASE_CONFIG.projectId !== 'your-app-id'
    );
};

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured()) {
    try {
        app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
        db = getFirestore(app);
    } catch (error) {
        console.warn('Firebase initialization error:', error);
    }
}

export { app, auth, db };
