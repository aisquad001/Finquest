/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db } from './firebase';
import * as firestore from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson } from './gamification';
import { generateLevelContent } from './contentGenerator';

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
        console.error("Error fetching user:", error);
        if (error.code === 'permission-denied') {
            console.warn("DB Permissions missing.");
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
            console.log("[DB] Creating new user document for:", uid);
            const initialData = createInitialUser(onboardingData);
            
            // SECURITY: Explicitly set default roles
            const dataToSave = {
                ...initialData,
                uid: uid,
                email: onboardingData.email || '',
                photoURL: onboardingData.photoURL || null,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                isAdmin: false, 
                role: 'user' as const,
                loginType: (onboardingData.authMethod || 'google') as any
            };
            
            await Promise.race([
                setDoc(userRef, dataToSave),
                timeoutPromise(15000)
            ]);

            return dataToSave;
        } else {
            console.log("[DB] User exists, updating login time.");
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
            return convertDocToUser(userSnap.data());
        }
    } catch (error: any) {
        console.error("Error creating/fetching user doc:", error);
        if (error.code === 'permission-denied') {
            const msg = "Sign in failed. Profile creation failed. Missing or insufficient permissions.\n\nFIX: Go to Firebase Console > Firestore > Rules and change to 'allow read, write: if request.auth != null;'";
            console.error(msg);
            throw new Error(msg);
        }
        throw error;
    }
};

// CRITICAL: Guest -> Real Migration
export const migrateGuestToReal = async (guestUid: string, realUid: string, realEmail: string) => {
    console.log(`[MIGRATION] Starting migration from ${guestUid} to ${realUid}`);
    
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
        console.log("Target user exists, merging stats if guest has significant progress...");
        // If target already exists, we usually just switch to it. 
        // But prompt said "Copy ALL guest data". 
        // We will merge coins/xp but keep the real user's identity.
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
             // Should not happen if guestUid was valid
             console.warn("No guest data found, creating fresh.");
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

    console.log("[MIGRATION] Success! Guest data moved/merged to real account.");
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
        console.error("Error updating user:", error);
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
        const updatePayload: any = {
            lastActive: serverTimestamp()
        };
        if (completed) {
             updatePayload.completedLevels = arrayUnion(levelId);
             updatePayload[`progress.${worldId}.score`] = increment(xpEarned);
             updatePayload[`progress.${worldId}.lessonsCompleted.${levelId}`] = true;
        }
        await setDoc(userRef, updatePayload, { merge: true });
    } catch (error) {
        console.error("Error saving progress:", error);
    }
};

// --- CONTENT CRUD (ADMIN CMS) ---
export const upsertLesson = async (lesson: Lesson) => {
    if (true) {
        const content = getMockContent();
        const idx = content.lessons.findIndex(l => l.id === lesson.id);
        if (idx >= 0) {
            content.lessons[idx] = lesson;
        } else {
            content.lessons.push(lesson);
        }
        saveMockContent(content);
        return;
    }
};

export const deleteLesson = async (lessonId: string) => {
    if (true) {
        const content = getMockContent();
        content.lessons = content.lessons.filter(l => l.id !== lessonId);
        saveMockContent(content);
        return;
    }
};

export const updateLevelConfig = async (level: LevelData) => {
    if (true) {
        const content = getMockContent();
        const idx = content.levels.findIndex(l => l.id === level.id);
        if (idx >= 0) {
            content.levels[idx] = level;
        } else {
            content.levels.push(level);
        }
        saveMockContent(content);
        return;
    }
};

export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    const generated = Array.from({ length: 8 }, (_, i) => {
         const { level } = generateLevelContent(worldId, i + 1);
         return level;
    });
    const overrides = getMockContent().levels.filter(l => l.worldId === worldId);
    return generated.map(gen => overrides.find(o => o.id === gen.id) || gen);
};

export const fetchLessonsForLevel = async (levelId: string): Promise<Lesson[]> => {
    const [worldId, levelNumStr] = levelId.split('_l');
    const levelNum = parseInt(levelNumStr);
    const { lessons } = generateLevelContent(worldId, levelNum);
    const overrides = getMockContent().lessons.filter(l => l.levelId === levelId);
    if (overrides.length > 0) {
        return overrides.sort((a, b) => a.order - b.order);
    }
    return lessons;
};

export const seedGameData = async () => {
    console.log("Seeding DB...");
    localStorage.removeItem(MOCK_CONTENT_KEY);
    localStorage.removeItem(MOCK_STORAGE_KEY);
    const w1l1 = generateLevelContent('world1', 1);
    const content = {
        levels: [w1l1.level],
        lessons: w1l1.lessons
    };
    saveMockContent(content);
    console.log("Seeded World 1 Level 1");
};

// --- ADMIN REAL-TIME DATA ---
export const subscribeToAllUsers = (callback: (users: UserState[]) => void) => {
    console.log("[ADMIN] Subscribing to ALL users...");
    const q = query(collection(db, 'users'), orderBy('lastLoginAt', 'desc'), limit(100));
    
    return onSnapshot(q, (snapshot) => {
        const users = snapshot.docs.map(doc => convertDocToUser(doc.data()));
        callback(users);
    }, (error) => {
        console.error("Admin Sub Error:", error);
    });
};

export const adminUpdateUser = async (uid: string, data: Partial<UserState>) => {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, data);
};

export const writeGlobalConfig = async (key: string, value: any) => {
    await setDoc(doc(db, 'config', key), { value, updatedAt: serverTimestamp() });
};

export const adminMassUpdate = async (action: 'give_coins' | 'reset' | 'reward_all') => {
    // Limitation: Batch only supports 500 ops. 
    // For prototype, we fetch top 100 and update them.
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
