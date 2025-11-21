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

// Helper to convert Firestore Timestamps to ISO strings for the app
const convertDocToUser = (data: any): UserState => {
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

export const getUser = async (uid: string): Promise<UserState | null> => {
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
    try {
        const initialData = createInitialUser(onboardingData);
        
        // Note: We save dates as strings primarily to match UserState, 
        // but serverTimestamp() is useful for 'createdAt' to get server time.
        // We will convert it back on read.
        const dataToSave = {
            ...initialData,
            uid: uid,
            email: onboardingData.email || '',
            // Use serverTimestamp for truth, convert on read
            createdAt: serverTimestamp(), 
            lastLoginAt: serverTimestamp(),
            // Ensure these are set if missing
            isPro: false,
            proExpiresAt: null
        };

        await setDoc(doc(db, 'users', uid), dataToSave);
        
        // Return the object with ISO strings for immediate local state usage
        return {
            ...dataToSave,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
        };
    } catch (error) {
        console.error("Error creating user doc:", error);
        throw error;
    }
};

export const updateUser = async (uid: string, data: Partial<UserState>) => {
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
            streakLastDate: updatedUser.streakLastDate, // This is string from checkStreak
            streakFreezes: updatedUser.streakFreezes,
            lastLoginAt: serverTimestamp()
        } as any);
    } else {
        // Just update last login
         await updateUser(uid, {
            lastLoginAt: serverTimestamp()
        } as any);
    }

    let message = '';
    if (broken) message = "💔 Streak Lost! You missed a day.";
    else if (savedByFreeze) message = "❄️ Streak Frozen! Saved by item.";
    else if (updatedUser.streak > currentUserState.streak) message = "🔥 Streak Extended!";

    return { updatedUser, message };
};