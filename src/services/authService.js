import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { GOOGLE_CONFIG } from '../constants/config';

// Configure Google Sign-In with webClientId if provided
export const configureGoogleSignIn = () => {
    if (GOOGLE_CONFIG.webClientId) {
        try {
            GoogleSignin.configure({
                webClientId: GOOGLE_CONFIG.webClientId,
                offlineAccess: true,
                scopes: ['profile', 'email'],
            });
        } catch (err) {
            console.warn('GoogleSignin configure warning:', err);
        }
    }
};

// Initial setup
configureGoogleSignIn();

/**
 * Format Firebase Auth errors into clear, user-friendly messages
 */
export const getReadableAuthError = (errorCode) => {
    switch (errorCode) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please sign in instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/weak-password':
            return 'Password is too weak. Please use at least 6 characters.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
};

/**
 * Register a new user with Email and Password
 * Creates Firebase Auth record + Firestore /users/{uid} document
 */
export const registerWithEmail = async (email, password, displayName) => {
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }

    if (!isFirebaseConfigured() || !auth) {
        throw new Error('Firebase credentials not configured. Please check your .env file.');
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const user = userCredential.user;

        if (displayName) {
            await updateProfile(user, { displayName: displayName.trim() });
        }

        // Save user profile in Cloud Firestore
        if (db) {
            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName ? displayName.trim() : email.split('@')[0],
                createdAt: serverTimestamp(),
                favoriteTracks: [],
            });
        }

        return user;
    } catch (error) {
        const readableMessage = getReadableAuthError(error.code);
        const enhancedError = new Error(readableMessage);
        enhancedError.code = error.code;
        throw enhancedError;
    }
};

/**
 * Sign in an existing user with Email and Password
 */
export const loginWithEmail = async (email, password) => {
    if (!email || !password) {
        throw new Error('Please enter both email and password.');
    }

    if (!isFirebaseConfigured() || !auth) {
        throw new Error('Firebase credentials not configured. Please check your .env file.');
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        return userCredential.user;
    } catch (error) {
        const readableMessage = getReadableAuthError(error.code);
        const enhancedError = new Error(readableMessage);
        enhancedError.code = error.code;
        throw enhancedError;
    }
};

/**
 * Sign in or Register using Google Account
 */
export const loginWithGoogle = async () => {
    if (!isFirebaseConfigured() || !auth) {
        throw new Error('Firebase credentials not configured. Please check your .env file.');
    }

    if (!GOOGLE_CONFIG.webClientId) {
        throw new Error(
            'Google Web Client ID is not configured. Please add GOOGLE_WEB_CLIENT_ID to your .env file.'
        );
    }

    try {
        configureGoogleSignIn();
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signInResult = await GoogleSignin.signIn();
        const idToken = signInResult.data?.idToken || signInResult.idToken;

        if (!idToken) {
            throw new Error('Failed to retrieve ID token from Google.');
        }

        const credential = GoogleAuthProvider.credential(idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        // Upsert user profile in Firestore
        if (db) {
            await setDoc(
                doc(db, 'users', user.uid),
                {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email?.split('@')[0] || 'User',
                    photoURL: user.photoURL || null,
                    updatedAt: serverTimestamp(),
                },
                { merge: true }
            );
        }

        return user;
    } catch (error) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            throw new Error('Google sign-in was cancelled.');
        } else if (error.code === statusCodes.IN_PROGRESS) {
            throw new Error('Google sign-in is already in progress.');
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
            throw new Error('Google Play Services not available or outdated.');
        }
        throw new Error(error.message || 'Google sign-in failed.');
    }
};

/**
 * Sign out current user
 */
export const logoutUser = async () => {
    try {
        await GoogleSignin.signOut();
    } catch (e) {
        // Ignore if user wasn't signed in via Google
    }
    if (auth) {
        await signOut(auth);
    }
};

/**
 * Fetch extended user profile from Cloud Firestore
 */
export const getUserProfile = async (uid) => {
    if (!db || !uid) return null;
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null;
    } catch (err) {
        console.warn('Failed to fetch user profile:', err);
        return null;
    }
};
