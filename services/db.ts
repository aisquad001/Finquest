/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db } from './firebase';
import * as firestore from 'firebase/firestore';
import { UserState, checkStreak, createInitialUser, LevelData, Lesson, LeaderboardEntry, SystemConfig, WORLDS_METADATA } from './gamification';
import { generateLevelContent } from './contentGenerator';
import { logger } from './logger';
import { getMarketData } from './stockMarket';

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
    getDocs,
    where
} = firestore;

// --- UTILS & MOCK HELPERS ---
const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error("Database operation timed out.")), ms));
const MOCK_STORAGE_KEY = 'racked_mock_users';
const getMockDB = (): Record<string, UserState> => { try { return JSON.parse(localStorage.getItem(MOCK_STORAGE_KEY) || '{}'); } catch { return {}; } };
const saveMockDB = (data: Record<string, UserState>) => { localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data)); };
const dispatchMockUpdate = (uid: string, user: UserState) => { window.dispatchEvent(new CustomEvent('mock-user-update', { detail: { uid, user } })); };

// --- SYSTEM CONFIG (ADS) ---
export const subscribeToSystemConfig = (callback: (config: SystemConfig) => void) => {
    const docRef = doc(db, 'system_config', 'main');
    return onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
            callback(snap.data() as SystemConfig);
        } else {
            // Default: Ads OFF
            const defaultConfig: SystemConfig = { adsEnabled: false };
            setDoc(docRef, defaultConfig);
            callback(defaultConfig);
        }
    });
};

export const updateSystemConfig = async (updates: Partial<SystemConfig>) => {
    const docRef = doc(db, 'system_config', 'main');
    await setDoc(docRef, updates, { merge: true });
};

// --- USER CONVERTER ---
export const convertDocToUser = (data: any): UserState => {
    const user = { ...data };
    if (user.createdAt instanceof Timestamp) user.createdAt = user.createdAt.toDate().toISOString();
    if (user.lastLoginAt instanceof Timestamp) user.lastLoginAt = user.lastLoginAt.toDate().toISOString();
    if (!user.completedLevels) user.completedLevels = [];
    if (!user.badges) user.badges = [];
    if (!user.inventory) user.inventory = [];
    if (!user.progress) user.progress = {};
    return user as UserState;
};

// --- USER METHODS ---
export const getUser = async (uid: string): Promise<UserState | null> => {
    if (uid.startsWith('mock_')) return getMockDB()[uid] || null;
    try {
        const snap = await Promise.race([getDoc(doc(db, 'users', uid)), timeoutPromise(15000)]);
        return (snap as any).exists() ? convertDocToUser((snap as any).data()) : null;
    } catch (e) { return null; }
};

export const createUserDoc = async (uid: string, onboardingData: any) => {
    if (uid.startsWith('mock_')) {
        const mockDB = getMockDB();
        if (mockDB[uid]) return mockDB[uid];
        const initialData = createInitialUser(onboardingData);
        const data = { ...initialData, uid, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
        mockDB[uid] = data;
        saveMockDB(mockDB);
        return data;
    }
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        const init = createInitialUser(onboardingData);
        const data = { ...init, uid, createdAt: serverTimestamp(), lastLoginAt: serverTimestamp() };
        await setDoc(ref, data);
        return { ...init, uid, createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString() };
    }
    return convertDocToUser(snap.data());
};

export const updateUser = async (uid: string, data: any) => {
    if (uid.startsWith('mock_')) {
        const m = getMockDB();
        if (m[uid]) { m[uid] = { ...m[uid], ...data }; saveMockDB(m); dispatchMockUpdate(uid, m[uid]); }
        return;
    }
    await updateDoc(doc(db, 'users', uid), { ...data, lastSyncedAt: serverTimestamp() });
};

export const saveLevelProgress = async (uid: string, worldId: string, levelId: string, xp: number, comp: boolean) => {
    const payload: any = { lastActive: serverTimestamp() };
    if (comp) {
        payload.completedLevels = arrayUnion(levelId);
        payload[`progress.${worldId}.score`] = increment(xp);
    }
    await updateUser(uid, payload);
};

// --- CONTENT MANAGEMENT (CMS SUPPORT) ---

// 1. SEED DATABASE (For "Seed DB" button)
export const seedDatabase = async () => {
    logger.info("Seeding Database...");
    const batch = writeBatch(db);
    
    for (const world of WORLDS_METADATA) {
        for (let i = 1; i <= 8; i++) {
            const { level, lessons } = generateLevelContent(world.id, i);
            // Save everything in one doc to keep it simple and reduce reads
            const levelRef = doc(db, 'levels', level.id);
            batch.set(levelRef, { 
                ...level, 
                lessons, 
                worldId: world.id,
                updatedAt: serverTimestamp() 
            });
        }
    }
    await batch.commit();
    logger.info("Seeding Complete.");
};

// 2. FETCH LEVELS (DB -> Fallback)
export const fetchLevelsForWorld = async (worldId: string): Promise<LevelData[]> => {
    try {
        // Try DB First
        const q = query(collection(db, 'levels')); 
        const snap = await getDocs(q);
        
        if (!snap.empty) {
            const levels = snap.docs.map(d => d.data() as LevelData);
            const cleanTarget = worldId.replace(/\s+/g, '').toLowerCase();
            
            const matched = levels.filter(l => {
                const lWorld = l.worldId?.replace(/\s+/g, '').toLowerCase();
                return lWorld === cleanTarget;
            }).sort((a, b) => a.levelNumber - b.levelNumber);

            if (matched.length > 0) return matched;
        }
    } catch (e) {
        console.warn("DB Fetch Levels failed, using generator fallback", e);
    }

    // Fallback to Generator
    return Array.from({ length: 8 }, (_, i) => generateLevelContent(worldId, i + 1).level);
};

// 3. FETCH LESSONS (DB -> Fallback)
export const fetchLessonsForLevel = async (levelId: string): Promise<Lesson[]> => {
    try {
        const snap = await getDoc(doc(db, 'levels', levelId));
        if (snap.exists()) {
            const data = snap.data();
            if (data.lessons && Array.isArray(data.lessons)) {
                return data.lessons;
            }
        }
    } catch (e) {
        console.warn("DB Fetch Lessons failed, using generator fallback", e);
    }

    // Fallback
    const parts = levelId.split('_l');
    if (parts.length === 2) {
        const { lessons } = generateLevelContent(parts[0], parseInt(parts[1]));
        return lessons;
    }
    return [];
};

// 4. SAVE LEVEL (For CMS Editor)
export const saveLevelData = async (level: LevelData) => {
    await setDoc(doc(db, 'levels', level.id), { ...level, updatedAt: serverTimestamp() }, { merge: true });
};

// --- OTHER EXPORTS ---
export const subscribeToAllUsers = (cb: any) => onSnapshot(query(collection(db, 'users'), limit(50)), (s) => cb(s.docs.map(d=>convertDocToUser(d.data()))), () => cb([]));
export const adminUpdateUser = (uid: string, d: any) => updateDoc(doc(db, 'users', uid), d);
export const adminMassUpdate = async (action: string) => { 
    const s = await getDocs(query(collection(db, 'users'), limit(100)));
    const b = writeBatch(db);
    s.docs.forEach(d => {
        if(action==='give_coins') b.update(d.ref, {coins: increment(1000)});
        if(action==='reset') b.update(d.ref, {coins:500, xp:0, level:1, completedLevels:[]});
    });
    await b.commit();
};
export const subscribeToCollection = (col: string, cb: any) => onSnapshot(collection(db, col), (s) => cb(s.docs.map(d=>({id:d.id, ...d.data()}))), () => cb([]));
export const saveDoc = (col: string, id: string, d: any) => setDoc(doc(db, col, id), d, {merge:true});
export const deleteDocument = (col: string, id: string) => deleteDoc(doc(db, col, id));
export const fetchChildByCode = async (code: string) => null; 
export const updateParentCode = async (uid: string, code: string) => {};
export const subscribeToLeaderboard = (cb: any) => cb([]); 
export const migrateGuestToReal = async (g: string, r: string, e: string) => {};