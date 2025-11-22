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
    User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDR2GIy-E11dUptoi2LAzsHWdAJn_IoNR0",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "finquest-453823206066.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "finquest-453823206066",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "finquest-453823206066.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "583622846504",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:583622846504:web:257545b9ff0eb9d408ed1d",
  measurementId: "G-M29LK595L7"
};

// Check if configuration is valid (Real keys do not contain "PASTE_")
const isConfigValid = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("PASTE_");

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

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
        if (!isConfigValid) {
            console.error("Firebase Config Invalid");
            alert("⚠️ CONFIG ERROR: Check services/firebase.ts");
            throw new Error("Firebase not configured.");
        }
        console.log("[Auth] Starting Google Sign In...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error(`[Auth] Google Sign In Error (${errorCode}):`, errorMessage);
        throw error;
    }
};

export const signInWithApple = async () => {
    try {
        if (!isConfigValid) {
            console.error("Firebase Config Invalid");
            throw new Error("Firebase not configured.");
        }
        console.log("[Auth] Starting Apple Sign In...");
        const result = await signInWithPopup(auth, appleProvider);
        return result.user;
    } catch (error: any) {
        console.error(`[Auth] Apple Sign In Error:`, error.message);
        throw error;
    }
};

export const signInAsGuest = async () => {
    try {
        if (!isConfigValid) {
            console.warn("[Auth] Invalid API Key. Switching to Mock Guest.");
            return createMockUser();
        }

        console.log("[Auth] Starting Guest Sign In (Anonymous)...");
        const result = await signInAnonymously(auth);
        return result.user;
    } catch (error: any) {
        console.error("Guest Sign In Error:", error);
        console.warn("[Auth] Falling back to Mock Guest due to error.");
        return createMockUser();
    }
};

export const logout = async () => {
    try {
        localStorage.removeItem('racked_mock_session_uid');
        if (isConfigValid) {
            await firebaseSignOut(auth);
        }
    } catch (error) {
        console.error("Sign Out Error:", error);
    }
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