import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import auth, { isFirebaseConfigured } from '../services/firebaseConfig';
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  getUserProfile,
} from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          setUserProfile(profile);
        } catch (e) {
          console.warn('Error loading user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const loggedInUser = await loginWithEmail(email, password);
      setUser(loggedInUser);
      const profile = await getUserProfile(loggedInUser.uid);
      setUserProfile(profile);
      return loggedInUser;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    setAuthError(null);
    try {
      const newUser = await registerWithEmail(email, password, displayName);
      setUser(newUser);
      const profile = await getUserProfile(newUser.uid);
      setUserProfile(profile);
      return newUser;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const loginGoogle = async () => {
    setAuthError(null);
    try {
      const loggedInUser = await loginWithGoogle();
      setUser(loggedInUser);
      const profile = await getUserProfile(loggedInUser.uid);
      setUserProfile(profile);
      return loggedInUser;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const logout = async () => {
    setAuthError(null);
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isLoading,
        authError,
        login,
        register,
        loginGoogle,
        logout,
        clearError,
        isConfigured: isFirebaseConfigured(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext };