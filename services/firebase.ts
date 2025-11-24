/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/analytics';
import { logger } from './logger';

// Access the global firebase namespace exposed by the V8 scripts
// The importmap in index.html loads the scripts, which attach 'firebase' to window.
const globalFirebase = (window as any).firebase;

if (!globalFirebase) {
    console.error("Firebase global not found. Check internet connection or importmap.");
}

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyDR2GIy-E11dUptoi2LAzsHWdAJn_IoNR0",
  authDomain: "finquest-453823206066.firebaseapp.com",
  projectId: "finquest-453823206066",
  storageBucket: "finquest-453823206066.firebasestorage.app",
  messagingSenderId: "583622846504",
  appId: "1:583622846504:web:257545b9ff0eb9d408ed1d",
  measurementId: "G-M29LK595L7"
};

if (globalFirebase && !globalFirebase.apps.length) {
    globalFirebase.initializeApp(firebaseConfig);
}

// Export services using the global instance
export const firebase = globalFirebase;
export const auth = globalFirebase ? globalFirebase.auth() : null;
export const db = globalFirebase ? globalFirebase.firestore() : null;

// Analytics
let analyticsInstance: any = null;
try {
    if (typeof window !== 'undefined' && globalFirebase) {
        analyticsInstance = globalFirebase.analytics();
    }
} catch (e) {
    console.warn("Analytics not supported");
}
export const analytics = analyticsInstance;

export const googleProvider = globalFirebase ? new globalFirebase.auth.GoogleAuthProvider() : null;
export const appleProvider = globalFirebase ? new globalFirebase.auth.OAuthProvider('apple.com') : null;
if (appleProvider) {
    appleProvider.addScope('email');
    appleProvider.addScope('name');
}

export const signInWithGoogle = async () => {
    if (!auth) throw new Error("Auth not initialized");
    try {
        logger.info("[Auth] Starting Google Sign In...");
        const result = await auth.signInWithPopup(googleProvider);
        return result.user;
    } catch (error: any) {
        logger.error("Google Sign In Error", error);
        const currentDomain = window.location.hostname;

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
    if (!auth) throw new Error("Auth not initialized");
    try {
        logger.info("[Auth] Starting Apple Sign In...");
        const result = await auth.signInWithPopup(appleProvider);
        return result.user;
    } catch (error: any) {
        logger.error(`[Auth] Apple Sign In Error:`, error.message);
        alert(`Apple Login Failed: ${error.message}`);
        throw error;
    }
};

export const signInAsGuest = async () => {
    if (!auth) throw new Error("Auth not initialized");
    try {
        logger.info("[Auth] Starting Guest Sign In (Anonymous)...");
        const result = await auth.signInAnonymously();
        return result.user;
    } catch (error: any) {
        logger.error("Guest Sign In Error", error);
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
        if (auth) await auth.signOut();
    } catch (error) {
        logger.error("Sign Out Error", error);
    }
};

export const subscribeToAuthChanges = (callback: (user: any) => void) => {
    if (!auth) return () => {};
    return auth.onAuthStateChanged(callback);
};

// Helper to create a fake user for demo mode (fallback)
const createMockUser = (): any => {
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
    };
};

export type User = any;