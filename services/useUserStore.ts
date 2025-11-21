/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserState } from './gamification';
import { convertDocToUser, getUser } from './db';

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
        set({ loading: true });
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
        try {
            const unsub = onSnapshot(doc(db, 'users', uid), 
                (docSnap) => {
                    if (docSnap.exists()) {
                        const userData = convertDocToUser(docSnap.data());
                        set({ user: userData, loading: false });
                    } else {
                        set({ user: null, loading: false, error: 'User not found' });
                    }
                },
                (err) => {
                    console.error('[STORE] Sync error:', err);
                    set({ error: err.message, loading: false });
                }
            );
            return unsub;
        } catch (e: any) {
             console.error('[STORE] Firebase Init Error:', e);
             set({ error: e.message, loading: false });
             return () => {};
        }
    },

    clearUser: () => set({ user: null, loading: false }),
    setLoading: (loading) => set({ loading })
}));
