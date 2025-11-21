/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db } from './firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    serverTimestamp,
    Timestamp 
} from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser } from './gamification';

// --- MOCK DB HELPERS ---
const MOCK_STORAGE_KEY = 'finquest_mock_users';

const getMockDB = (): Record<string, UserState> => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const saveMockDB = (data: Record<string, UserState>) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

const dispatchMockUpdate = (uid: string, user: UserState) => {
    window.dispatchEvent(new CustomEvent('mock-user-update', { detail: { uid, user } }));
};

// --- CONVERTER ---

// Helper to convert Firestore Timestamps to ISO strings for the app
export const convertDocToUser = (data: any): UserState => {
    const user = { ...data };
    
    // Convert known Timestamp fields to strings
    if (user.createdAt instanceof Timestamp) user.createdAt = user.createdAt.toDate().toISOString();
    if (user.lastLoginAt instanceof Timestamp) user.lastLoginAt = user.lastLoginAt.toDate().toISOString();
    if (user.joinedAt instanceof Timestamp) user.joinedAt = user.joinedAt.toDate().toISOString();
    
    // Handle streakLastDate - might be string or Timestamp depending on how it was saved
    if (user.streakLastDate instanceof Timestamp) user.streakLastDate = user.streakLastDate.toDate().toISOString();
    
    // Handle proExpiresAt
    if (user.proExpiresAt instanceof Timestamp) user.proExpiresAt = user.proExpiresAt.toDate().toISOString();

    return user as UserState;
};

// --- METHODS ---

export const getUser = async (uid: string): Promise<UserState | null> => {
    // Mock Fallback
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        return mockDB[uid] || null;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return convertDocToUser(userDoc.data());
        }
        return null;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

export const createUserDoc = async (uid: string, onboardingData: any) => {
    const initialData = createInitialUser(onboardingData);
    
    const dataToSave = {
        ...initialData,
        uid: uid,
        email: onboardingData.email || '',
        createdAt: new Date().toISOString(), 
        lastLoginAt: new Date().toISOString(),
        isPro: false,
        proExpiresAt: null
    };

    // Mock Fallback
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        mockDB[uid] = dataToSave;
        saveMockDB(mockDB);
        dispatchMockUpdate(uid, dataToSave);
        return dataToSave;
    }

    try {
        // Use serverTimestamp for Firestore truth
        const firestoreData = {
            ...dataToSave,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', uid), firestoreData);
        
        return dataToSave;
    } catch (error) {
        console.error("Error creating user doc:", error);
        throw error;
    }
};

export const updateUser = async (uid: string, data: Partial<UserState>) => {
    // Mock Fallback
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) {
            mockDB[uid] = { ...mockDB[uid], ...data };
            saveMockDB(mockDB);
            dispatchMockUpdate(uid, mockDB[uid]);
        }
        return;
    }

    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            ...data,
            lastSyncedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating user:", error);
    }
};

export const handleDailyLogin = async (uid: string, currentUserState: UserState): Promise<{ updatedUser: UserState, message?: string }> => {
    const { updatedUser, savedByFreeze, broken } = checkStreak(currentUserState);
    
    if (updatedUser.streak !== currentUserState.streak || updatedUser.streakFreezes !== currentUserState.streakFreezes) {
        await updateUser(uid, {
            streak: updatedUser.streak,
            streakLastDate: updatedUser.streakLastDate, 
            streakFreezes: updatedUser.streakFreezes,
            lastLoginAt: uid.startsWith('mock_') ? new Date().toISOString() : serverTimestamp()
        } as any);
    } else {
         await updateUser(uid, {
            lastLoginAt: uid.startsWith('mock_') ? new Date().toISOString() : serverTimestamp()
        } as any);
    }

    let message = '';
    if (broken) message = "💔 Streak Lost! You missed a day.";
    else if (savedByFreeze) message = "❄️ Streak Frozen! Saved by item.";
    else if (updatedUser.streak > currentUserState.streak) message = "🔥 Streak Extended!";

    return { updatedUser, message };
};
