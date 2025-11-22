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
    writeBatch
} from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson, WORLDS_METADATA } from './gamification';
import { generateLevelContent } from './contentGenerator';

// --- MOCK DB HELPERS ---
const MOCK_STORAGE_KEY = 'finquest_mock_users';
const MOCK_CONTENT_KEY = 'finquest_mock_content';

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

// --- USER METHODS ---

export const getUser = async (uid: string): Promise<UserState | null> => {
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
        const userSnap = await getDoc(userRef);

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
            
            // 1. Create the document
            await setDoc(userRef, dataToSave);

            // 2. Apply First-Time Login Bonus (Atomic Increment)
            console.log("[DB] Applying first-time bonus...");
            await updateDoc(userRef, {
                coins: increment(500), // Total = 1000
                xp: increment(200)     // Total = 200
            });

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
        console.log(`[DB] Upserted Lesson: ${lesson.id}`);
        return;
    }
};

export const deleteLesson = async (lessonId: string) => {
    if (true) {
        const content = getMockContent();
        content.lessons = content.lessons.filter(l => l.id !== lessonId);
        saveMockContent(content);
        console.log(`[DB] Deleted Lesson: ${lessonId}`);
        return;
    }
};

export const updateLevelConfig = async (level: LevelData) => {
    if (true) {
        const content = getMockContent();
        const idx = content.levels.findIndex(l => l.id === level.id);
        if (idx >= 0) content.levels[idx] = level;
        else content.levels.push(level);
        saveMockContent(content);
        console.log(`[DB] Updated Level: ${level.id}`);
        return;
    }
};

export const seedGameData = async () => {
    console.log("SEEDING PROCEDURAL CONTENT... 🚀");
    const levels: LevelData[] = [];
    const lessons: Lesson[] = [];

    WORLDS_METADATA.forEach((world) => {
        for (let lvl = 1; lvl <= 8; lvl++) {
            const { level, lessons: levelLessons } = generateLevelContent(world.id, lvl);
            levels.push(level);
            lessons.push(...levelLessons);
        }
    });

    const isMock = true;
    if (isMock) {
        saveMockContent({ levels, lessons });
        console.log(`[SEED] Generated ${levels.length} unique levels and ${lessons.length} lessons.`);
    }
};

export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    const content = getMockContent();
    const mockLevels = content.levels.filter(l => l.worldId === worldId);
    if (mockLevels.length > 0) return mockLevels.sort((a, b) => a.levelNumber - b.levelNumber);

    return Array.from({ length: 8 }, (_, i) => ({
        id: `${worldId}_l${i + 1}`,
        worldId,
        levelNumber: i + 1,
        title: `Level ${i + 1}`,
        description: 'New Level',
        bossName: 'Boss',
        bossImage: '👹',
        bossIntro: 'Fight me!',
        bossQuiz: []
    }));
};

export const fetchLessonsForLevel = async (levelId: string): Promise<Lesson[]> => {
    const content = getMockContent();
    const mockLessons = content.lessons.filter(l => l.levelId === levelId);
    return mockLessons.sort((a, b) => a.order - b.order);
};

export const saveLevelProgress = async (uid: string, worldId: string, levelId: string, score: number, isCompleted: boolean) => {
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        const user = mockDB[uid];
        if (!user) return;
        
        if (!user.progress) user.progress = {};
        if (!user.progress[worldId]) user.progress[worldId] = { level: 0, lessonsCompleted: {}, score: 0 };
        
        const levelNum = parseInt(levelId.split('_l')[1] || '1');
        
        if (isCompleted && levelNum > user.progress[worldId].level) {
            user.progress[worldId].level = levelNum;
        }
        user.progress[worldId].score += score;
        
        if (isCompleted && !user.completedLevels.includes(levelId)) {
             user.completedLevels.push(levelId);
        }
        
        saveMockDB(mockDB);
        dispatchMockUpdate(uid, user);
        return;
    }

    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
             [`progress.${worldId}.score`]: serverTimestamp() 
        });
    } catch (e) {
        console.error("Save progress failed", e);
    }
};