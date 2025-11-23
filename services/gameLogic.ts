
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { UserState, SHOP_ITEMS, WORLDS_METADATA, getXpForNextLevel, checkStreak } from './gamification';
import { playSound } from './audio';
import { updateUser, getUser } from './db';
import * as firestore from 'firebase/firestore'; // Keep for specific types if needed

const { serverTimestamp } = firestore;

// --- UTILS ---
const getTodayStr = () => new Date().toLocaleDateString('en-CA');
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

export const addXP = async (uid: string, amount: number) => {
    try {
        const user = await getUser(uid);
        if (!user) return;

        let newXp = user.xp + amount;
        let newLevel = user.level;
        let leveledUp = false;

        // Calculate if Level Up occurred
        // We loop in case a large XP amount jumps multiple levels
        let xpNeeded = getXpForNextLevel(newLevel);
        while (newXp >= xpNeeded) {
            newLevel++;
            xpNeeded = getXpForNextLevel(newLevel);
            leveledUp = true;
        }

        await updateUser(uid, {
            xp: newXp,
            level: newLevel
        });

        triggerVisualEffect(`+${amount} XP`, 'xp');

        if (leveledUp) {
            setTimeout(() => {
                playSound('levelup');
                triggerVisualEffect(`LEVEL UP! ${newLevel}`, 'level');
                (window as any).confetti({ particleCount: 200, spread: 100 });
            }, 500);
        }
    } catch (e) {
        console.error("Failed to add XP", e);
    }
};

export const addCoins = async (uid: string, amount: number, reason: string) => {
    try {
        const user = await getUser(uid);
        if (!user) return;

        await updateUser(uid, {
            coins: user.coins + amount
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
        const user = await getUser(uid);
        if (!user) return false;

        // Optimistic inventory update
        const newInventory = [...(user.inventory || []), itemId];

        await updateUser(uid, {
            coins: user.coins - cost,
            inventory: newInventory
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
        await updateUser(uid, { lastDailyChestClaim: today });
        // Add rewards (will handle DB updates internally)
        await addXP(uid, rewards.xp);
        await addCoins(uid, rewards.coins, 'Daily Chest');

        playSound('chest');
        (window as any).confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch (e) {
        console.error("Chest claim failed", e);
    }
};

export const processDailyStreak = async (uid: string, user: UserState) => {
    const { updatedUser, savedByFreeze, broken } = checkStreak(user);
    
    // If nothing changed (already logged in today), stop
    if (updatedUser.streak === user.streak && updatedUser.streakLastDate === user.streakLastDate && !broken && !savedByFreeze) return;

    let message = '';
    let rewards = { coins: 0, xp: 0 };
    let badgeToUnlock = null;

    // Only calculate rewards if streak INCREASED (not broken/frozen)
    if (updatedUser.streak > user.streak) {
        message = `🔥 ${updatedUser.streak} Day Streak!`;
        
        if (updatedUser.streak === 3) { rewards = { coins: 1500, xp: 500 }; message += " (Bonus!)"; }
        else if (updatedUser.streak === 7) { rewards = { coins: 5000, xp: 1000 }; message += " (EPIC!)"; }
        else if (updatedUser.streak === 30) { 
            rewards = { coins: 50000, xp: 10000 }; 
            message += " (GODLIKE!)"; 
            if (!user.badges?.includes('badge_streak_30')) badgeToUnlock = 'badge_streak_30';
        }
        else { rewards = { coins: 100, xp: 50 }; }
    } else if (savedByFreeze) {
        message = "❄️ Streak Frozen! Saved by item.";
    } else if (broken) {
        message = "Streak Reset 😭";
        rewards = { coins: 50, xp: 50 }; // Pity reward
    }

    try {
        const updatePayload: any = {
            streak: updatedUser.streak,
            streakLastDate: updatedUser.streakLastDate,
            streakFreezes: updatedUser.streakFreezes,
            lastLoginAt: new Date().toISOString() // Use string for universal compatibility
        };
        
        if (badgeToUnlock) {
            updatePayload.badges = [...(user.badges || []), badgeToUnlock];
        }

        await updateUser(uid, updatePayload);
        
        // Grant rewards
        if (rewards.coins > 0) await addCoins(uid, rewards.coins, 'Streak Reward');
        if (rewards.xp > 0) await addXP(uid, rewards.xp);

        if (message) {
            if (broken || savedByFreeze) playSound('error');
            else playSound('fanfare');
            
            triggerVisualEffect(message, broken || savedByFreeze ? 'error' : 'level');
            
            if (badgeToUnlock) setTimeout(() => triggerVisualEffect("NEW BADGE UNLOCKED! 💎", 'level'), 2000);
        }
    } catch (e) {
        console.error("Streak processing failed", e);
    }
};

// Check and Award Badges for World Completion
export const checkWorldCompletion = async (uid: string, worldId: string) => {
    try {
        const user = await getUser(uid);
        if (!user) return;

        // Normalize ID to match level IDs (e.g., "Moola Basics" -> "MoolaBasics")
        const normalizedWorldId = worldId.replace(/\s+/g, '');
        const completedInWorld = user.completedLevels.filter(lvl => lvl.startsWith(normalizedWorldId)).length;
        
        // Check if all 8 levels are done
        if (completedInWorld >= 8) {
             const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
             
             if (worldMeta && worldMeta.badgeId && !user.badges?.includes(worldMeta.badgeId)) {
                 const newBadges = [...(user.badges || []), worldMeta.badgeId];
                 
                 await updateUser(uid, {
                     badges: newBadges
                 });

                 // Delay slightly to avoid clashing with Level Up animation
                 setTimeout(() => {
                     playSound('fanfare');
                     triggerVisualEffect(`BADGE UNLOCKED: ${worldMeta.title}`, 'level');
                     (window as any).confetti({ particleCount: 300, spread: 180 });
                 }, 1500);
             }
        }
    } catch (e) {
        console.error("Badge check failed", e);
    }
};
