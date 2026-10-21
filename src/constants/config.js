import {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    AUDIOMACK_API_KEY,
    GOOGLE_WEB_CLIENT_ID,
} from '@env';

/**
 * Application Configuration
 *
 * Reads values securely from your local .env file.
 * The .env file is git-ignored and will not be pushed to GitHub.
 */
export const FIREBASE_CONFIG = {
    apiKey: FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
    authDomain: FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
    projectId: FIREBASE_PROJECT_ID || "your-app-id",
    storageBucket: FIREBASE_STORAGE_BUCKET || "your-app.firebasestorage.app",
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID || "1234567890",
    appId: FIREBASE_APP_ID || "1:1234567890:web:abcdef123456"
};

/**
 * Audiomack API Configuration
 *
 * When useMockData is true (or when AUDIOMACK_API_KEY is empty),
 * the app uses high-fidelity offline mock music data.
 */
export const AUDIOMACK_CONFIG = {
    baseUrl: 'https://api.audiomack.com/v1',
    apiKey: AUDIOMACK_API_KEY || '',
    useMockData: !AUDIOMACK_API_KEY,
};

/**
 * Google Sign-In Configuration
 */
export const GOOGLE_CONFIG = {
    webClientId: GOOGLE_WEB_CLIENT_ID || '',
};
