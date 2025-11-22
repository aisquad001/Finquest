
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
    deleteDoc,
    serverTimestamp,
    increment,
    Timestamp,
    collection,
    getDocs,
    query,
    where,
    writeBatch,
    arrayUnion
} from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson, WORLDS_METADATA } from './gamification';
import { generateLevelContent } from './contentGenerator';

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
    } catch (error) {
        console.error("Error fetching user:", error);
        return null;
    }
};

export const createUserDoc = async (uid: string, onboardingData: any) => {
    // --- MOCK MODE HANDLER ---
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) {
             // User Exists
             mockDB[uid].lastLoginAt = new Date().toISOString();
             saveMockDB(mockDB);
             dispatchMockUpdate(uid, mockDB[uid]);
             return mockDB[uid];
        }
        
        // New User
        const initialData = createInitialUser(onboardingData);
        const dataToSave = {
            ...initialData,
            uid: uid,
            email: onboardingData.email || '',
            createdAt: new Date().toISOString(), 
            lastLoginAt: new Date().toISOString(),
            isPro: false,
            proExpiresAt: null,
            // Bonus applied directly for mock
            coins: (initialData.coins || 500) + 500,
            xp: (initialData.xp || 0) + 200
        };
        mockDB[uid] = dataToSave;
        saveMockDB(mockDB);
        dispatchMockUpdate(uid, dataToSave);
        return dataToSave;
    }

    // --- REAL FIRESTORE HANDLER ---
    try {
        const userRef = doc(db, "users", uid);
        
        // Race the check against timeout
        const userSnap: any = await Promise.race([
            getDoc(userRef),
            timeoutPromise(15000)
        ]);

        if (!userSnap.exists()) {
            // Create New User Document
            console.log("[DB] Creating new user document for:", uid);
            const initialData = createInitialUser(onboardingData);
            
            // Prepare base data
            const dataToSave = {
                ...initialData,
                uid: uid,
                email: onboardingData.email || '',
                photoURL: onboardingData.photoURL || null,
                createdAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                isPro: false,
                // Ensure these fields are exactly as requested
                level: 1,
                streak: 1,
                streakLastDate: new Date().toISOString().split('T')[0],
                coins: 500, // Base coins
                xp: 0       // Base XP
            };
            
            // 1. Create the document with TIMEOUT protection
            await Promise.race([
                setDoc(userRef, dataToSave),
                timeoutPromise(15000)
            ]);

            // 2. Apply First-Time Login Bonus (Atomic Increment)
            console.log("[DB] Applying first-time bonus...");
            // This is non-blocking for UI return, but good to await to ensure consistency
            updateDoc(userRef, {
                coins: increment(500), // Total = 1000
                xp: increment(200)     // Total = 200
            }).catch(e => console.warn("Bonus apply failed (minor)", e));

            // Return the object with estimated bonus for immediate UI update (optimistic)
            return { ...dataToSave, coins: 1000, xp: 200 };

        } else {
            // Existing User
            console.log("[DB] User exists, updating login time.");
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
            return convertDocToUser(userSnap.data());
        }
    } catch (error) {
        console.error("Error creating/fetching user doc:", error);
        throw error;
    }
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
                
                // Update World Progress
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
             // Also update the nested progress object for granular tracking
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
    
    // Real DB Implementation for later:
    // await setDoc(doc(db, 'lessons', lesson.id), lesson);
};

export const deleteLesson = async (lessonId: string) => {
    if (true) {
        const content = getMockContent();
        content.lessons = content.lessons.filter(l => l.id !== lessonId);
        saveMockContent(content);
        return;
    }
    // await deleteDoc(doc(db, 'lessons', lessonId));
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
    // In mock mode or hybrid mode, we return generated levels based on metadata
    // This prevents the map from being empty if DB is empty
    // Real DB fetch would go here
    
    const generated = Array.from({ length: 8 }, (_, i) => {
         const { level } = generateLevelContent(worldId, i + 1);
         return level;
    });
    
    // Merge with any CMS overrides (mock for now)
    const overrides = getMockContent().levels.filter(l => l.worldId === worldId);
    
    return generated.map(gen => overrides.find(o => o.id === gen.id) || gen);
};

export const fetchLessonsForLevel = async (levelId: string): Promise<Lesson[]> => {
    // Hybrid: Generated defaults + CMS overrides
    const [worldId, levelNumStr] = levelId.split('_l');
    const levelNum = parseInt(levelNumStr);
    
    const { lessons } = generateLevelContent(worldId, levelNum);
    
    // Merge CMS
    const overrides = getMockContent().lessons.filter(l => l.levelId === levelId);
    
    // Simple merge: If CMS has lessons for this level, favor them, but fill gaps if needed
    // For simplicity, if CMS has any lessons, use ONLY CMS lessons + generated to fill up to 6 if needed
    if (overrides.length > 0) {
        // If CMS has lessons, return them sorted by order
        return overrides.sort((a, b) => a.order - b.order);
    }
    
    return lessons;
};

// Seed data for God Mode
export const seedGameData = async () => {
    console.log("Seeding DB...");
    // Clear mock
    localStorage.removeItem(MOCK_CONTENT_KEY);
    localStorage.removeItem(MOCK_STORAGE_KEY);
    
    // Generate fresh content for World 1
    const w1l1 = generateLevelContent('world1', 1);
    
    const content = {
        levels: [w1l1.level],
        lessons: w1l1.lessons
    };
    saveMockContent(content);
    console.log("Seeded World 1 Level 1");
};
