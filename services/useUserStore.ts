/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { UserState } from './gamification';
import { convertDocToUser } from './db';

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
        
        const unsub = onSnapshot(doc(db, 'users', uid), 
            (docSnap) => {
                if (docSnap.exists()) {
                    const userData = convertDocToUser(docSnap.data());
                    set({ user: userData, loading: false });
                    // console.log('[STORE] User updated:', userData.xp);
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
    },

    clearUser: () => set({ user: null, loading: false }),
    setLoading: (loading) => set({ loading })
}));