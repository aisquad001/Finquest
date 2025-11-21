/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    signInAnonymously,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Configuration using environment variables
// Note: If running in an environment without these set, we fall back to Mock Mode.
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

export const signInWithGoogle = async () => {
    try {
        if (!isConfigValid) throw new Error("Firebase not configured. Google Sign In unavailable in demo mode.");
        console.log("[Auth] Starting Google Sign In...");
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error) {
        console.error("Google Sign In Error:", error);
        throw error;
    }
};

export const signInAsGuest = async () => {
    try {
        // Fast-fail or detect invalid key to switch to mock
        if (!isConfigValid) {
            console.warn("[Auth] Invalid API Key. Switching to Mock Guest.");
            return createMockUser();
        }

        console.log("[Auth] Starting Guest Sign In (Anonymous)...");
        const result = await signInAnonymously(auth);
        console.log("[Auth] Guest Sign In Success:", result.user.uid);
        return result.user;
    } catch (error: any) {
        // If the API key is technically present but invalid (e.g. blocked or wrong), catch it
        if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
            console.warn("[Auth] API Key Rejected. Switching to Mock Guest.");
            return createMockUser();
        }
        console.error("Guest Sign In Error:", error);
        throw error;
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
