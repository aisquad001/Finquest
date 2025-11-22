
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import * as firestore from 'firebase/firestore';
import { db } from './firebase';
import { UserState } from './gamification';
import { convertDocToUser, getUser } from './db';
import { logger } from './logger';

const { doc, onSnapshot } = firestore;

interface UserStore {
    user: UserState | null;
    loading: boolean;
    error: string | null;
    
    // Actions
    syncUser: (uid: string) => () => void; // Returns unsubscribe function
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    loading: true,
    error: null,

    syncUser: (uid: string) => {
        set({ loading: true, error: null });
        logger.info(`Syncing user profile`, { uid });
        
        // MOCK MODE SYNC
        if (uid.startsWith('mock_')) {
            // Initial Fetch
            getUser(uid).then(u => {
                if (u) set({ user: u, loading: false });
                else set({ error: "Mock User not found", loading: false });
            });

            // Listen for local updates
            const handleUpdate = (e: any) => {
                if (e.detail.uid === uid) {
                    set({ user: e.detail.user });
                }
            };
            window.addEventListener('mock-user-update', handleUpdate);
            return () => window.removeEventListener('mock-user-update', handleUpdate);
        }

        // FIREBASE SYNC
        let connectionTimeout: any;
        let creationTimeout: any;
        let unsub: () => void = () => {};

        try {
            // Set a robust timeout to allow for cold starts (15s)
            connectionTimeout = setTimeout(() => {
                if (get().loading) {
                    logger.warn("Firestore connection timed out", { uid });
                    set({ 
                        loading: false, 
                        error: "Server connection slow. Check internet or refresh." 
                    });
                }
            }, 15000);

            unsub = onSnapshot(doc(db, 'users', uid), 
                (docSnap) => {
                    clearTimeout(connectionTimeout); // Connection established
                    
                    if (docSnap.exists()) {
                        clearTimeout(creationTimeout); // Doc exists, valid state
                        const userData = convertDocToUser(docSnap.data());
                        set({ user: userData, loading: false, error: null });
                        // Only log this once or if significant change? Keep noisy logs down
                        // logger.info("User profile updated", { level: userData.level });
                    } else {
                        // User authenticated but doc missing.
                        // This happens momentarily during registration.
                        logger.info("Auth success but profile doc missing. Waiting for creation...", { uid });
                        
                        // If this state persists > 10s, something broke in createUserDoc
                        if (!creationTimeout) {
                            creationTimeout = setTimeout(() => {
                                if (!get().user && get().loading) {
                                    const msg = "Profile creation hung. Please refresh.";
                                    logger.error(msg, { uid });
                                    set({ loading: false, error: msg });
                                }
                            }, 10000);
                        }
                    }
                },
                (err) => {
                    clearTimeout(connectionTimeout);
                    clearTimeout(creationTimeout);
                    
                    logger.error('Firestore Sync Error', { code: err.code, msg: err.message });
                    
                    let msg = err.message;
                    if (err.code === 'permission-denied') {
                        msg = "ACCESS DENIED: Database rules block this request.";
                    }
                    if (err.code === 'unavailable') msg = "Network Offline. Please check connection.";

                    set({ error: msg, loading: false });
                }
            );
            
            return () => {
                clearTimeout(connectionTimeout);
                clearTimeout(creationTimeout);
                unsub();
            };

        } catch (e: any) {
             clearTimeout(connectionTimeout);
             logger.error('Firebase Init Error', e);
             set({ error: e.message, loading: false });
             return () => {};
        }
    },

    clearUser: () => {
        logger.info("Clearing user session");
        set({ user: null, loading: false, error: null });
    },
    
    setLoading: (loading) => set({ loading }),
    
    setError: (error) => {
        logger.error("Global Store Error Set", error);
        set({ error, loading: false });
    }
}));
