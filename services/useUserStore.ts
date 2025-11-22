/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import * as firestore from 'firebase/firestore';
import { db } from './firebase';
import { UserState } from './gamification';
import { convertDocToUser, getUser } from './db';

const { doc, onSnapshot } = firestore;

interface UserStore {
    user: UserState | null;
    loading: boolean;
    error: string | null;
    
    // Actions
    syncUser: (uid: string) => () => void; // Returns unsubscribe function
    clearUser: () => void;
    setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    loading: true,
    error: null,

    syncUser: (uid: string) => {
        set({ loading: true, error: null });
        console.log(`[STORE] Starting sync for ${uid}`);
        
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
            
            // Return cleanup function
            return () => window.removeEventListener('mock-user-update', handleUpdate);
        }

        // FIREBASE SYNC
        let connectionTimeout: any;
        let unsub: () => void = () => {};

        try {
            // Set a robust timeout to allow for cold starts
            connectionTimeout = setTimeout(() => {
                console.warn("[STORE] Firestore connection slow/timed out.");
                set({ 
                    loading: false, 
                    error: "Server connection timed out. Please check your internet or try again." 
                });
            }, 15000); // 15 seconds timeout

            unsub = onSnapshot(doc(db, 'users', uid), 
                (docSnap) => {
                    clearTimeout(connectionTimeout);
                    if (docSnap.exists()) {
                        const userData = convertDocToUser(docSnap.data());
                        set({ user: userData, loading: false, error: null });
                    } else {
                        // User authenticated but no doc found yet (likely creating...)
                        console.log("[STORE] User doc not found yet (waiting for creation...)");
                        // We don't stop loading here, waiting for creation to complete
                    }
                },
                (err) => {
                    clearTimeout(connectionTimeout);
                    console.error('[STORE] Sync error:', err);
                    
                    let msg = err.message;
                    if (err.code === 'permission-denied') {
                        msg = "DATABASE LOCKED: Please go to Firebase Console -> Firestore Database -> Rules and set 'allow read, write: if request.auth != null;'";
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
             console.error('[STORE] Firebase Init Error:', e);
             set({ error: e.message, loading: false });
             return () => {};
        }
    },

    clearUser: () => set({ user: null, loading: false, error: null }),
    setLoading: (loading) => set({ loading })
}));