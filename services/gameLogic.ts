
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { db } from './firebase';
import * as firestore from 'firebase/firestore';
import { UserState, SHOP_ITEMS, WORLDS_METADATA } from './gamification';
import { playSound } from './audio';

const { doc, updateDoc, increment, arrayUnion, serverTimestamp, runTransaction, getDoc } = firestore;

// --- UTILS ---
const getTodayStr = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local time approximation for streaks
const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-CA');
};

export const triggerVisualEffect = (text: string, type: 'xp' | 'coin' | 'level' | 'error') => {
    const event = new CustomEvent('game-effect', { detail: { text, type } });
    window.dispatchEvent(event);
};

// --- ACTIONS ---

export const addXP = async (uid: string, amount: number, currentLevel: number) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            xp: increment(amount)
        });
        triggerVisualEffect(`+${amount} XP`, 'xp');
    } catch (e) {
        console.error("Failed to add XP", e);
    }
};

export const addCoins = async (uid: string, amount: number, reason: string) => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            coins: increment(amount)
        });
        playSound('coin');
        triggerVisualEffect(`+${amount} Coins`, 'coin');
    } catch (e) {
        console.error("Failed to add Coins", e);
    }
};

export const purchaseItem = async (uid: string, itemId: string, cost: number, currentCoins: number) => {
    if (currentCoins < cost) {
        playSound('error');
        triggerVisualEffect("Not enough coins!", "error");
        return false;
    }

    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            coins: increment(-cost),
            inventory: arrayUnion(itemId)
        });
        playSound('kaching');
        triggerVisualEffect(`Bought Item!`, 'coin');
        return true;
    } catch (e) {
        console.error("Purchase failed", e);
        return false;
    }
};

export const claimDailyChest = async (uid: string, user: UserState) => {
    const today = getTodayStr();
    if (user.lastDailyChestClaim === today) {
        triggerVisualEffect("Already claimed today!", "error");
        return;
    }

    const rewards = { xp: 200, coins: 500 };
    
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, {
            lastDailyChestClaim: today,
            xp: increment(rewards.xp),
            coins: increment(rewards.coins)
        });
        playSound('chest');
        triggerVisualEffect(`+${rewards.xp} XP`, 'xp');
        setTimeout(() => triggerVisualEffect(`+${rewards.coins} Coins`, 'coin'), 200);
        (window as any).confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
        console.error("Chest claim failed", e);
    }
};

export const processDailyStreak = async (uid: string, user: UserState) => {
    const today = getTodayStr();
    const lastActive = user.streakLastDate;
    
    if (lastActive === today) return; // Already processed today

    const yesterday = getYesterdayStr();
    let newStreak = user.streak;
    let message = '';
    let rewards = { coins: 0, xp: 0 };
    let badgeToUnlock = null;

    if (lastActive === yesterday) {
        // Streak Continues
        newStreak += 1;
        message = `🔥 ${newStreak} Day Streak!`;
        
        // Streak Milestones
        if (newStreak === 3) { rewards = { coins: 1500, xp: 500 }; message += " (Bonus!)"; }
        else if (newStreak === 7) { rewards = { coins: 5000, xp: 1000 }; message += " (EPIC!)"; }
        else if (newStreak === 30) { 
            rewards = { coins: 50000, xp: 10000 }; 
            message += " (GODLIKE!)"; 
            if (!user.badges?.includes('badge_streak_30')) badgeToUnlock = 'badge_streak_30';
        }
        else { rewards = { coins: 100, xp: 50 }; } // Base reward

    } else {
        // Streak Broken? Check Freeze
        if (user.streakFreezes > 0) {
            await updateDoc(doc(db, 'users', uid), {
                streakFreezes: increment(-1),
                streakLastDate: today
            });
            triggerVisualEffect("Streak Frozen ❄️", "error");
            return;
        } else {
            // Reset
            newStreak = 1;
            message = "Streak Reset 😭";
            rewards = { coins: 50, xp: 50 }; // Pity reward
        }
    }

    try {
        const userRef = doc(db, 'users', uid);
        const updates: any = {
            streak: newStreak,
            streakLastDate: today,
            coins: increment(rewards.coins),
            xp: increment(rewards.xp),
            lastLoginAt: serverTimestamp()
        };
        if (badgeToUnlock) updates.badges = arrayUnion(badgeToUnlock);

        await updateDoc(userRef, updates);
        
        if (newStreak > 1) {
            playSound('fanfare');
            triggerVisualEffect(message, 'level');
            if (rewards.coins > 0) setTimeout(() => triggerVisualEffect(`+${rewards.coins} Coins`, 'coin'), 800);
            if (badgeToUnlock) setTimeout(() => triggerVisualEffect("NEW BADGE UNLOCKED! 💎", 'level'), 2000);
        }
    } catch (e) {
        console.error("Streak processing failed", e);
    }
};

// NEW: Check for World Completion Badges
export const checkWorldCompletion = async (uid: string, worldId: string, levelCount: number) => {
    try {
        const userRef = doc(db, 'users', uid);
        const snap = await getDoc(userRef);
        if(!snap.exists()) return;
        const user = snap.data() as UserState;

        // Count completed levels in this world
        const completedInWorld = user.completedLevels.filter(lvl => lvl.startsWith(worldId.replace(/\s+/g, ''))).length;
        
        // If all 8 levels are done (or close to it, keeping it loose for now)
        if (completedInWorld >= 7) {
             const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
             if (worldMeta && worldMeta.badgeId && !user.badges?.includes(worldMeta.badgeId)) {
                 await updateDoc(userRef, {
                     badges: arrayUnion(worldMeta.badgeId)
                 });
                 setTimeout(() => {
                     playSound('fanfare');
                     triggerVisualEffect(`BADGE UNLOCKED: ${worldMeta.title}`, 'level');
                     (window as any).confetti({ particleCount: 300, spread: 180 });
                 }, 1000);
             }
        }
    } catch (e) {
        console.error("Badge check failed", e);
    }
};
