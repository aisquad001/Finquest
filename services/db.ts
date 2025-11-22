
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db } from './firebase';
import * as firestore from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson, LeaderboardEntry } from './gamification';
import { generateLevelContent } from './contentGenerator';
import { logger } from './logger';

const { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    increment,
    Timestamp,
    arrayUnion,
    collection,
    onSnapshot,
    query,
    limit,
    orderBy,
    writeBatch,
    getDocs
} = firestore;

// --- MOCK DB HELPERS ---
const MOCK_STORAGE_KEY = 'racked_mock_users';
const MOCK_CONTENT_KEY = 'racked_mock_content';

const getMockDB = (): Record<string, UserState> => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
};

const getMockContent = (): { levels: LevelData[], lessons: Lesson[] } => {
    try {
        return JSON.parse(localStorage.getItem(MOCK_CONTENT_KEY) || '{"levels":[], "lessons":[]}');
    } catch {
        return { levels: [], lessons: [] };
    }
};

const saveMockDB = (data: Record<string, UserState>) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

const saveMockContent = (data: any) => {
    localStorage.setItem(MOCK_CONTENT_KEY, JSON.stringify(data));
};

const dispatchMockUpdate = (uid: string, user: UserState) => {
    window.dispatchEvent(new CustomEvent('mock-user-update', { detail: { uid, user } }));
};

// --- CONVERTER ---
export const convertDocToUser = (data: any): UserState => {
    const user = { ...data };
    if (user.createdAt instanceof Timestamp) user.createdAt = user.createdAt.toDate().toISOString();
    if (user.lastLoginAt instanceof Timestamp) user.lastLoginAt = user.lastLoginAt.toDate().toISOString();
    if (user.joinedAt instanceof Timestamp) user.joinedAt = user.joinedAt.toDate().toISOString();
    if (user.streakLastDate instanceof Timestamp) user.streakLastDate = user.streakLastDate.toDate().toISOString();
    if (user.proExpiresAt instanceof Timestamp) user.proExpiresAt = user.proExpiresAt.toDate().toISOString();
    return user as UserState;
};

// --- UTILS ---
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Database operation timed out.")), ms));

// --- USER METHODS ---

export const getUser = async (uid: string): Promise<UserState | null> => {
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        return mockDB[uid] || null;
    }
    try {
        // Race getDoc against a timeout to prevent hanging
        const userDoc: any = await Promise.race([
            getDoc(doc(db, 'users', uid)),
            timeoutPromise(15000)
        ]);
        
        if (userDoc.exists()) {
            return convertDocToUser(userDoc.data());
        }
        return null;
    } catch (error: any) {
        logger.error("Error fetching user", error);
        if (error.code === 'permission-denied') {
            logger.warn("DB Permissions missing.");
        }
        return null;
    }
};

export const createUserDoc = async (uid: string, onboardingData: any) => {
    // --- MOCK MODE HANDLER ---
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) {
             mockDB[uid].lastLoginAt = new Date().toISOString();
             saveMockDB(mockDB);
             dispatchMockUpdate(uid, mockDB[uid]);
             return mockDB[uid];
        }
        const initialData = createInitialUser(onboardingData);
        const dataToSave: UserState = {
            ...initialData,
            uid: uid,
            email: onboardingData.email || '',
            createdAt: new Date().toISOString(), 
            lastLoginAt: new Date().toISOString(),
            isAdmin: false,
            role: 'user' as const,
            loginType: 'guest' as const
        };
        mockDB[uid] = dataToSave;
        saveMockDB(mockDB);
        dispatchMockUpdate(uid, dataToSave);
        return dataToSave;
    }

    // --- REAL FIRESTORE HANDLER ---
    try {
        const userRef = doc(db, "users", uid);
        
        const userSnap: any = await Promise.race([
            getDoc(userRef),
            timeoutPromise(15000)
        ]);

        if (!userSnap.exists()) {
            logger.info("[DB] Creating new user document", { uid });
            const initialData = createInitialUser(onboardingData);
            
            // SECURITY: Explicitly set default roles
            // We store dates as timestamps in Firestore, but as strings in the returned object for the app
            const dataToSave = {
                ...initialData,
                uid: uid,
                email: onboardingData.email || '',
                photoURL: onboardingData.photoURL || null,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                isAdmin: false, 
                role: 'user' as const,
                loginType: onboardingData.authMethod || 'google'
            };
            
            await Promise.race([
                setDoc(userRef, dataToSave),
                timeoutPromise(15000)
            ]);

            logger.info("[DB] User document created successfully.");
            
            // Return the user object with ISO strings so the app can use it immediately
            // without waiting for a fetch
            return {
                ...initialData,
                uid: uid,
                email: onboardingData.email || '',
                photoURL: onboardingData.photoURL || null,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                isAdmin: false,
                role: 'user',
                loginType: onboardingData.authMethod || 'google'
            } as UserState;

        } else {
            logger.info("[DB] User exists, updating login time.");
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
            return convertDocToUser(userSnap.data());
        }
    } catch (error: any) {
        logger.error("Error creating/fetching user doc", error);
        if (error.code === 'permission-denied') {
            const msg = "Sign in failed. Profile creation failed. Missing or insufficient permissions.\n\nFIX: Go to Firebase Console > Firestore > Rules and change to 'allow read, write: if request.auth != null;'";
            logger.error(msg);
            throw new Error(msg);
        }
        throw error;
    }
};

// CRITICAL: Guest -> Real Migration
export const migrateGuestToReal = async (guestUid: string, realUid: string, realEmail: string) => {
    logger.info(`[MIGRATION] Starting migration from ${guestUid} to ${realUid}`);
    
    // 1. Fetch Guest Data
    let guestData: UserState | null = null;
    
    if (guestUid.startsWith('mock_')) {
        const mockDB = getMockDB();
        guestData = mockDB[guestUid];
        if (guestData) {
            delete mockDB[guestUid];
            saveMockDB(mockDB);
        }
    } else {
        const guestDoc = await getDoc(doc(db, 'users', guestUid));
        if (guestDoc.exists()) {
            guestData = convertDocToUser(guestDoc.data());
            // Delete old doc
            await deleteDoc(doc(db, 'users', guestUid));
        }
    }

    // 2. Check if Target User Already Exists (Merge strategy)
    const realRef = doc(db, 'users', realUid);
    const realSnap = await getDoc(realRef);

    if (realSnap.exists()) {
        logger.info("Target user exists, merging stats if guest has significant progress...");
        if (guestData) {
            await updateDoc(realRef, {
                coins: increment(guestData.coins),
                xp: increment(guestData.xp),
                inventory: arrayUnion(...guestData.inventory)
            });
        }
    } else {
        // Target is new, create it with guest data
        if (!guestData) {
             logger.warn("No guest data found, creating fresh.");
             await createUserDoc(realUid, { email: realEmail, authMethod: 'google' });
             return;
        }

        const newUserData = {
            ...guestData,
            uid: realUid,
            email: realEmail,
            loginType: 'google',
            isAdmin: false, 
            role: 'user' as const,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp()
        };

        await setDoc(realRef, newUserData);
    }
    logger.info("[MIGRATION] Success! Guest data moved/merged to real account.");
};

export const updateUser = async (uid: string, data: Partial<UserState>) => {
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
        logger.error("Error updating user", error);
    }
};

export const handleDailyLogin = async (uid: string, currentUserState: UserState): Promise<{ updatedUser: UserState, message?: string }> => {
    const { updatedUser, savedByFreeze, broken } = checkStreak(currentUserState);
    
    const updatePayload: any = {
        lastLoginAt: uid.startsWith('mock_') ? new Date().toISOString() : serverTimestamp()
    };

    if (updatedUser.streak !== currentUserState.streak || updatedUser.streakFreezes !== currentUserState.streakFreezes) {
        updatePayload.streak = updatedUser.streak;
        updatePayload.streakLastDate = updatedUser.streakLastDate;
        updatePayload.streakFreezes = updatedUser.streakFreezes;
    }

    await updateUser(uid, updatePayload);

    let message = '';
    if (broken) message = "💔 Streak Lost! You missed a day.";
    else if (savedByFreeze) message = "❄️ Streak Frozen! Saved by item.";
    else if (updatedUser.streak > currentUserState.streak) message = "🔥 Streak Extended!";

    return { updatedUser, message };
};

export const saveLevelProgress = async (uid: string, worldId: string, levelId: string, xpEarned: number, completed: boolean) => {
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) {
            const user = mockDB[uid];
            if (completed) {
                if (!user.completedLevels.includes(levelId)) {
                    user.completedLevels.push(levelId);
                }
                if (!user.progress) user.progress = {};
                if (!user.progress[worldId]) {
                    user.progress[worldId] = { level: 1, lessonsCompleted: {}, score: 0 };
                }
                user.progress[worldId].score += xpEarned;
                user.progress[worldId].lessonsCompleted[levelId] = true;
            }
            saveMockDB(mockDB);
            dispatchMockUpdate(uid, user);
        }
        return;
    }

    try {
        const userRef = doc(db, 'users', uid);
        const updatePayload: any = { lastActive: serverTimestamp() };
        if (completed) {
             updatePayload.completedLevels = arrayUnion(levelId);
             updatePayload[`progress.${worldId}.score`] = increment(xpEarned);
             updatePayload[`progress.${worldId}.lessonsCompleted.${levelId}`] = true;
        }
        await setDoc(userRef, updatePayload, { merge: true });
    } catch (error) {
        logger.error("Error saving progress", error);
    }
};

// --- LEADERBOARD ---
export const subscribeToLeaderboard = (callback: (entries: LeaderboardEntry[]) => void) => {
    // Query top 50 users by net worth (calculated as coins roughly or if portfolio value is stored)
    // Since netWorth in portfolio is inside an object, sorting by it directly in Firestore requires an index on `portfolio.history` or `portfolio.netWorth`
    // For now, we'll sort by XP/Level as a proxy for "Racked" success, OR if we sync netWorth to root.
    // Let's assume we want XP for now as it's most reliable without complex indexing on sub-objects.
    
    const q = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(50));

    return onSnapshot(q, (snapshot) => {
        const entries: LeaderboardEntry[] = snapshot.docs.map((doc, index) => {
            const u = doc.data() as UserState;
            
            // Calculate Net Worth dynamically for display
            let netWorth = u.coins;
            if (u.portfolio?.cash) {
                netWorth = u.portfolio.cash; // Approximation if real-time calculation is client-side
                // Note: Accurate net worth requires stock prices. We just use cash + stored history value here.
                if (u.portfolio.history?.length) {
                    netWorth = u.portfolio.history[u.portfolio.history.length - 1].netWorth;
                }
            }

            return {
                rank: index + 1,
                name: u.nickname || 'Anonymous',
                xp: u.xp,
                avatar: u.avatar?.emoji || '👤',
                country: 'Global',
                netWorth: netWorth
            };
        });
        callback(entries);
    }, (err) => {
        logger.error("Leaderboard Error", err);
        callback([]);
    });
};

// --- ADMIN GENERIC CRUD HELPERS ---

export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
    const q = query(collection(db, colName));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
    }, (error) => {
        logger.error(`Error subscribing to ${colName}`, error);
        if (error.code === 'permission-denied') {
            // Return empty array to stop loading states in UI
            callback([]);
        }
    });
};

export const saveDoc = async (colName: string, id: string, data: any) => {
    try {
        const ref = doc(db, colName, id);
        await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) {
        logger.error(`Error saving to ${colName}`, e);
        throw e;
    }
};

export const deleteDocument = async (colName: string, id: string) => {
    try {
        await deleteDoc(doc(db, colName, id));
    } catch (e) {
        logger.error(`Error deleting from ${colName}`, e);
        throw e;
    }
};

export const batchWrite = async (colName: string, items: any[]) => {
    const batch = writeBatch(db);
    items.forEach(item => {
        const ref = doc(db, colName, item.id || doc(collection(db, colName)).id);
        batch.set(ref, { ...item, updatedAt: serverTimestamp() }, { merge: true });
    });
    await batch.commit();
};

// --- FETCH HELPERS (Dynamic vs Generated) ---

export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    // 1. Check Firestore for custom levels
    // (In a real app, we'd check DB first. For hybrid approach, we generate then override)
    
    // Generate baseline
    const generated = Array.from({ length: 8 }, (_, i) => {
         const { level } = generateLevelContent(worldId, i + 1);
         return level;
    });

    // For now, we return generated. 
    // Admin dashboard implementation will allow writing to 'levels' collection
    // which could be merged here in future iterations.
    return generated; 
};

export const fetchLessonsForLevel = async (levelId: string): Promise<Lesson[]> => {
    const [worldId, levelNumStr] = levelId.split('_l');
    const levelNum = parseInt(levelNumStr);
    const { lessons } = generateLevelContent(worldId, levelNum);
    return lessons;
};

export const seedGameData = async () => {
    logger.info("Seeding DB...");
    localStorage.removeItem(MOCK_CONTENT_KEY);
    localStorage.removeItem(MOCK_STORAGE_KEY);
    // No-op in real DB mode, but useful for clearing cache
};

// --- ADMIN REAL-TIME USER DATA ---
export const subscribeToAllUsers = (callback: (users: UserState[]) => void) => {
    logger.info("[ADMIN] Subscribing to ALL users...");
    const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => convertDocToUser(doc.data()));
        callback(users);
    }, (error) => {
        logger.error("Admin Sub Error", error);
        // Call with empty list to resolve loading state in UI
        callback([]);
    });
};

export const adminUpdateUser = async (uid: string, data: Partial<UserState>) => {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, data);
};

export const adminMassUpdate = async (action: 'give_coins' | 'reset' | 'reward_all') => {
    const snapshot = await getDocs(query(collection(db, 'users'), limit(100)));
    const batch = writeBatch(db);

    snapshot.docs.forEach(doc => {
        if (action === 'give_coins') {
            batch.update(doc.ref, { coins: increment(1000) });
        } else if (action === 'reset') {
            batch.update(doc.ref, { coins: 500, level: 1, xp: 0, inventory: [] });
        } else if (action === 'reward_all') {
             batch.update(doc.ref, { lastDailyChestClaim: '' }); // Reset chest
        }
    });

    await batch.commit();
};
