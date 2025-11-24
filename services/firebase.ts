/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    OAuthProvider,
    signInWithPopup, 
    signInAnonymously,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    type User,
    type NextOrObserver
} from 'firebase/auth';
import * as firestore from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { logger } from './logger';

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
// Hardcoded to ensure stability on production without env vars
const firebaseConfig = {
  apiKey: "AIzaSyDR2GIy-E11dUptoi2LAzsHWdAJn_IoNR0",
  authDomain: "finquest-453823206066.firebaseapp.com",
  projectId: "finquest-453823206066",
  storageBucket: "finquest-453823206066.firebasestorage.app",
  messagingSenderId: "583622846504",
  appId: "1:583622846504:web:257545b9ff0eb9d408ed1d",
  measurementId: "G-M29LK595L7"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = firestore.getFirestore(app);
export const getFirestore = firestore.getFirestore;

// Initialize Analytics safely
export let analytics: any = null;
isSupported().then(yes => {
  if (yes) {
    analytics = getAnalytics(app);
  }
});

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

export const signInWithGoogle = async () => {
    try {
        logger.info("[Auth] Starting Google Sign In...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        logger.error("Google Sign In Error", error);
        const currentDomain = window.location.hostname;

        // HELPFUL ERROR HANDLING FOR USER
        if (error.code === 'auth/unauthorized-domain') {
            const msg = `⛔ DOMAIN BLOCKED: ${currentDomain}\n\nTo fix this:\n1. Go to Firebase Console > Authentication > Settings > Authorized Domains\n2. Add "${currentDomain}" to the list.`;
            alert(msg);
            throw new Error("Domain not authorized. See alert for instructions.");
        } else if (error.code === 'auth/popup-closed-by-user') {
            logger.warn("User closed popup");
            throw new Error("Login cancelled.");
        } else if (error.code === 'auth/operation-not-allowed') {
            alert("Google Login is disabled. Enable it in Firebase Console.");
            throw new Error("Google provider disabled.");
        }
        
        throw error;
    }
};

export const signInWithApple = async () => {
    try {
        logger.info("[Auth] Starting Apple Sign In...");
        const result = await signInWithPopup(auth, appleProvider);
        return result.user;
    } catch (error: any) {
        logger.error(`[Auth] Apple Sign In Error:`, error.message);
        alert(`Apple Login Failed: ${error.message}`);
        throw error;
    }
};

export const signInAsGuest = async () => {
    try {
        logger.info("[Auth] Starting Guest Sign In (Anonymous)...");
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (error: any) {
        logger.error("Guest Sign In Error", error);
        // If guest auth fails (usually due to it not being enabled in console), fall back to mock
        if (error.code === 'auth/operation-not-allowed') {
             alert("Guest Mode is disabled in Firebase Console. Enabling Mock Mode.");
        }
        logger.warn("[Auth] Falling back to Mock Guest due to error.");
        return createMockUser();
    }
};

export const logout = async () => {
    try {
        localStorage.removeItem('racked_mock_session_uid');
        await firebaseSignOut(auth);
    } catch (error) {
        logger.error("Sign Out Error", error);
    }
};

// Wrapper for onAuthStateChanged to avoid import errors in App.tsx
export const subscribeToAuthChanges = (callback: NextOrObserver<User>) => {
    return onAuthStateChanged(auth, callback);
};

// Helper to create a fake user for demo mode (fallback)
const createMockUser = (): User => {
    const uid = `mock_guest_${Date.now()}`;
    return {
        uid,
        email: null,
        emailVerified: false,
        isAnonymous: true,
        displayName: "Guest Player",
        photoURL: null,
        phoneNumber: null,
        providerId: 'anonymous',
        metadata: {
            creationTime: new Date().toISOString(),
            lastSignInTime: new Date().toISOString()
        },
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "mock_token",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        providerData: []
    } as unknown as User;
};

export type { User };