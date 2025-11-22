
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

    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        mockDB[uid] = dataToSave;
        saveMockDB(mockDB);
        dispatchMockUpdate(uid, dataToSave);
        return dataToSave;
    }

    try {
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
    // Mock Implementation for Demo / Testing
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
    // Real Firestore Implementation
    // await setDoc(doc(db, 'lessons', lesson.id), lesson);
};

export const deleteLesson = async (lessonId: string) => {
    if (true) {
        const content = getMockContent();
        content.lessons = content.lessons.filter(l => l.id !== lessonId);
        saveMockContent(content);
        console.log(`[DB] Deleted Lesson: ${lessonId}`);
        return;
    }
    // await deleteDoc(doc(db, 'lessons', lessonId));
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
    // await setDoc(doc(db, 'levels', level.id), level);
};

export const seedGameData = async () => {
    console.log("SEEDING PROCEDURAL CONTENT... 🚀");
    const levels: LevelData[] = [];
    const lessons: Lesson[] = [];

    // Iterate through ALL worlds and ALL levels (8x8 = 64 Levels)
    WORLDS_METADATA.forEach((world) => {
        for (let lvl = 1; lvl <= 8; lvl++) {
            // Use the Variety Engine to generate unique content for this specific slot
            const { level, lessons: levelLessons } = generateLevelContent(world.id, lvl);
            
            levels.push(level);
            lessons.push(...levelLessons);
        }
    });

    const isMock = true; // For demo purposes, force mock storage
    if (isMock) {
        saveMockContent({ levels, lessons });
        console.log(`[SEED] Generated ${levels.length} unique levels and ${lessons.length} lessons.`);
    }
};

export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    // Mock
    const content = getMockContent();
    const mockLevels = content.levels.filter(l => l.worldId === worldId);
    if (mockLevels.length > 0) return mockLevels.sort((a, b) => a.levelNumber - b.levelNumber);

    // If no levels found in DB, generate placeholders so Admin UI doesn't crash
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
    // Mock
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
        
        // Logic: If completing level 1, unlock level 2.
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

    // Firestore Real Implementation
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
             [`progress.${worldId}.score`]: serverTimestamp() 
        });
    } catch (e) {
        console.error("Save progress failed", e);
    }
};
