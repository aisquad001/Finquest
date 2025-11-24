/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { db } from './firebase';
import { UserState } from './gamification';
import { convertDocToUser, getUser } from './db';
import { logger } from './logger';

interface UserStore {
    user: UserState | null;
    loading: boolean;
    error: string | null;
    
    // Actions
    syncUser: (uid: string) => () => void; // Returns unsubscribe function
    clearUser: () => void;
    setUser: (user: UserState) => void; // NEW: Manual override
    setLoading: (loading: boolean) => void;
    setError: (error: string) => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    loading: true,
    error: null,

    setUser: (user: UserState) => {
        set({ user, loading: false, error: null });
    },

    syncUser: (uid: string) => {
        set({ loading: true, error: null });
        logger.info(`Syncing user profile`, { uid });
        
        // MOCK MODE SYNC
        if (uid.startsWith('mock_')) {
            getUser(uid).then(u => {
                if (u) set({ user: u, loading: false });
                else set({ error: "Mock User not found", loading: false });
            });

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
        let unsub: () => void = () => {};

        try {
            // Set a robust timeout to allow for cold starts (15s)
            connectionTimeout = setTimeout(() => {
                if (get().loading) {
                    logger.warn("Firestore connection timed out", { uid });
                    // Do NOT set error here strictly, just warn, as createUserDoc might save us
                }
            }, 15000);

            unsub = db.collection('users').doc(uid).onSnapshot(
                (docSnap: any) => {
                    clearTimeout(connectionTimeout); // Connection established
                    
                    if (docSnap.exists) {
                        const userData = convertDocToUser(docSnap.data());
                        set({ user: userData, loading: false, error: null });
                    } else {
                        // User authenticated but doc missing.
                        // This happens momentarily during registration.
                        logger.info("Auth success but profile doc missing. Waiting for creation...", { uid });
                    }
                },
                (err: any) => {
                    clearTimeout(connectionTimeout);
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