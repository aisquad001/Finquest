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

// Configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "finquest-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "finquest-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Check if configuration is valid
const isConfigValid = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');

export const signInWithGoogle = async () => {
    try {
        if (!isConfigValid) throw new Error("Firebase not configured.");
        console.log("[Auth] Starting Google Sign In...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Sign In Error:", error);
        throw error;
    }
};

export const signInWithApple = async () => {
    try {
        if (!isConfigValid) throw new Error("Firebase not configured.");
        console.log("[Auth] Starting Apple Sign In...");
        const result = await signInWithPopup(auth, appleProvider);
        return result.user;
    } catch (error) {
        console.error("Apple Sign In Error:", error);
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
        localStorage.removeItem('finquest_mock_session_uid');
        if (isConfigValid) {
            await firebaseSignOut(auth);
        }
    } catch (error) {
        console.error("Sign Out Error:", error);
    }
};

// Helper to create a fake user for demo mode
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