/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db, firebase } from './firebase';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson, LeaderboardEntry } from './gamification';
import { generateLevelContent } from './contentGenerator';
import { logger } from './logger';
import { getMarketData } from './stockMarket';

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

const saveMockDB = (data: Record<string, UserState>) => {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
};

const dispatchMockUpdate = (uid: string, user: UserState) => {
    window.dispatchEvent(new CustomEvent('mock-user-update', { detail: { uid, user } }));
};

// --- CONVERTER ---
export const convertDocToUser = (data: any): UserState => {
    const user = { ...data };
    if (user.createdAt && user.createdAt.toDate) user.createdAt = user.createdAt.toDate().toISOString();
    if (user.lastLoginAt && user.lastLoginAt.toDate) user.lastLoginAt = user.lastLoginAt.toDate().toISOString();
    if (user.joinedAt && user.joinedAt.toDate) user.joinedAt = user.joinedAt.toDate().toISOString();
    if (user.streakLastDate && user.streakLastDate.toDate) user.streakLastDate = user.streakLastDate.toDate().toISOString();
    if (user.proExpiresAt && user.proExpiresAt.toDate) user.proExpiresAt = user.proExpiresAt.toDate().toISOString();
    
    // SAFETY: Ensure arrays exist
    if (!user.completedLevels) user.completedLevels = [];
    if (!user.badges) user.badges = [];
    if (!user.inventory) user.inventory = [];
    if (!user.progress) user.progress = {};

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
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (userDoc.exists) {
            return convertDocToUser(userDoc.data());
        }
        return null;
    } catch (error: any) {
        logger.error("Error fetching user", error);
        return null;
    }
};

export const createUserDoc = async (uid: string, onboardingData: any) => {
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

    try {
        const userRef = db.collection('users').doc(uid);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
            logger.info("[DB] Creating new user document", { uid });
            const initialData = createInitialUser(onboardingData);
            
            const dataToSave = {
                ...initialData,
                uid: uid,
                email: onboardingData.email || '',
                photoURL: onboardingData.photoURL || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                isAdmin: false, 
                role: 'user' as const,
                loginType: onboardingData.authMethod || 'google'
            };
            
            await userRef.set(dataToSave);

            logger.info("[DB] User document created successfully.");
            
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
            await userRef.update({
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return convertDocToUser(userSnap.data());
        }
    } catch (error: any) {
        logger.error("Error creating/fetching user doc", error);
        if (error.code === 'permission-denied') {
            const msg = "Sign in failed. Profile creation failed. Missing or insufficient permissions.";
            logger.error(msg);
            throw new Error(msg);
        }
        throw error;
    }
};

export const migrateGuestToReal = async (guestUid: string, realUid: string, realEmail: string) => {
    logger.info(`[MIGRATION] Starting migration from ${guestUid} to ${realUid}`);
    
    let guestData: UserState | null = null;
    
    if (guestUid.startsWith('mock_')) {
        const mockDB = getMockDB();
        guestData = mockDB[guestUid];
        if (guestData) {
            delete mockDB[guestUid];
            saveMockDB(mockDB);
        }
    } else {
        const guestRef = db.collection('users').doc(guestUid);
        const guestDoc = await guestRef.get();
        if (guestDoc.exists) {
            guestData = convertDocToUser(guestDoc.data());
            await guestRef.delete();
        }
    }

    const realRef = db.collection('users').doc(realUid);
    const realSnap = await realRef.get();

    if (realSnap.exists) {
        logger.info("Target user exists, merging stats if guest has significant progress...");
        if (guestData) {
            await realRef.update({
                coins: firebase.firestore.FieldValue.increment(guestData.coins),
                xp: firebase.firestore.FieldValue.increment(guestData.xp),
                inventory: firebase.firestore.FieldValue.arrayUnion(...guestData.inventory)
            });
        }
    } else {
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
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await realRef.set(newUserData);
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
        await db.collection('users').doc(uid).update({
            ...data,
            lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        logger.error("Error updating user", error);
    }
};

export const updateParentCode = async (uid: string, code: string) => {
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) {
            mockDB[uid].parentCode = code;
            saveMockDB(mockDB);
            dispatchMockUpdate(uid, mockDB[uid]);
        }
        return;
    }
    await updateUser(uid, { parentCode: code });
};

export const fetchChildByCode = async (code: string): Promise<UserState | null> => {
    const mockDB = getMockDB();
    const mockUser = Object.values(mockDB).find(u => u.parentCode === code);
    if (mockUser) return mockUser;

    try {
        const snapshot = await db.collection('users').where('parentCode', '==', code).limit(1).get();
        if (!snapshot.empty) {
            return convertDocToUser(snapshot.docs[0].data());
        }
        return null;
    } catch (e) {
        logger.error("Error fetching child by code", e);
        return null;
    }
};

export const handleDailyLogin = async (uid: string, currentUserState: UserState): Promise<{ updatedUser: UserState, message?: string }> => {
    const { updatedUser, savedByFreeze, broken } = checkStreak(currentUserState);
    
    const updatePayload: any = {
        lastLoginAt: uid.startsWith('mock_') ? new Date().toISOString() : firebase.firestore.FieldValue.serverTimestamp()
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
                if (!user.completedLevels) user.completedLevels = [];
                
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
        const updatePayload: any = { lastActive: firebase.firestore.FieldValue.serverTimestamp() };
        if (completed) {
             updatePayload.completedLevels = firebase.firestore.FieldValue.arrayUnion(levelId);
             updatePayload[`progress.${worldId}.score`] = firebase.firestore.FieldValue.increment(xpEarned);
             updatePayload[`progress.${worldId}.lessonsCompleted.${levelId}`] = true;
        }
        await db.collection('users').doc(uid).set(updatePayload, { merge: true });
    } catch (error) {
        logger.error("Error saving progress", error);
    }
};

export const subscribeToLeaderboard = (callback: (entries: LeaderboardEntry[]) => void) => {
    return db.collection('users')
        .orderBy('xp', 'desc')
        .limit(50)
        .onSnapshot((snapshot) => {
            const marketData = getMarketData();
            const entries: LeaderboardEntry[] = snapshot.docs.map((doc) => {
                const u = doc.data() as UserState;
                let netWorth = u.portfolio?.cash || 0;
                if (u.portfolio?.holdings) {
                    Object.entries(u.portfolio.holdings).forEach(([symbol, qty]) => {
                        const stock = marketData.find(s => s.symbol === symbol);
                        if (stock) {
                            netWorth += stock.price * (qty as number);
                        }
                    });
                }
                return {
                    rank: 0,
                    name: u.nickname || 'Anonymous',
                    xp: u.xp,
                    avatar: u.avatar?.emoji || '👤',
                    country: 'Global',
                    netWorth: netWorth
                };
            });
            entries.sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0));
            const rankedEntries = entries.map((e, i) => ({...e, rank: i + 1}));
            callback(rankedEntries);
        }, (err) => {
            logger.error("Leaderboard Error", err);
            callback([]);
        });
};

export const subscribeToCollection = (colName: string, callback: (data: any[]) => void) => {
    return db.collection(colName).onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(items);
    }, (error) => {
        logger.error(`Error subscribing to ${colName}`, error);
        callback([]);
    });
};

export const saveDoc = async (colName: string, id: string, data: any) => {
    try {
        await db.collection(colName).doc(id).set({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    } catch (e) {
        logger.error(`Error saving to ${colName}`, e);
        throw e;
    }
};

export const deleteDocument = async (colName: string, id: string) => {
    try {
        await db.collection(colName).doc(id).delete();
    } catch (e) {
        logger.error(`Error deleting from ${colName}`, e);
        throw e;
    }
};

export const batchWrite = async (colName: string, items: any[]) => {
    const batch = db.batch();
    items.forEach(item => {
        const ref = db.collection(colName).doc(item.id || db.collection(colName).doc().id);
        batch.set(ref, { ...item, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    await batch.commit();
};

export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    const generated = Array.from({ length: 8 }, (_, i) => {
         const { level } = generateLevelContent(worldId, i + 1);
         return level;
    });
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
};

export const subscribeToAllUsers = (callback: (users: UserState[]) => void) => {
    logger.info("[ADMIN] Subscribing to ALL users...");
    return db.collection('users').orderBy('lastLoginAt', 'desc').limit(100).onSnapshot((snapshot) => {
        const users = snapshot.docs.map(doc => convertDocToUser(doc.data()));
        callback(users);
    }, (error) => {
        logger.error("Admin Sub Error", error);
        callback([]);
    });
};

export const adminUpdateUser = async (uid: string, data: Partial<UserState>) => {
    await db.collection('users').doc(uid).update(data);
};

export const adminMassUpdate = async (action: 'give_coins' | 'reset' | 'reward_all') => {
    const snapshot = await db.collection('users').limit(100).get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
        if (action === 'give_coins') {
            batch.update(doc.ref, { coins: firebase.firestore.FieldValue.increment(1000) });
        } else if (action === 'reset') {
            batch.update(doc.ref, { 
                coins: 500, 
                level: 1, 
                xp: 0, 
                inventory: [],
                completedLevels: [],
                progress: {},
                badges: []
            });
        } else if (action === 'reward_all') {
             batch.update(doc.ref, { lastDailyChestClaim: '' });
        }
    });

    await batch.commit();
};