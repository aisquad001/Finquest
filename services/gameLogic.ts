/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { UserState, SHOP_ITEMS, WORLDS_METADATA, getXpForNextLevel, checkStreak, EarnedBadge } from './gamification';
import { playSound } from './audio';
import { updateUser, getUser } from './db';
import * as firestore from 'firebase/firestore';

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

// --- CASINO CELEBRATION ---
const triggerCasinoEffect = () => {
    // 1. Instant Blast
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio: number, opts: any) {
        (window as any).confetti(Object.assign({}, defaults, opts, {
            particleCount: Math.floor(count * particleRatio)
        }));
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
    
    // 2. Sustained Gold Rain (3 Seconds)
    const end = Date.now() + 3000;
    const colors = ['#FFD700', '#FFA500', '#FFFFFF', '#00FF88'];

    (function frame() {
        (window as any).confetti({
            particleCount: 3,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors,
            zIndex: 9999
        });
        (window as any).confetti({
            particleCount: 3,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors,
            zIndex: 9999
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
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
                // Secondary confetti for level up
                (window as any).confetti({ particleCount: 100, spread: 100, origin: { y: 0.6 } });
            }, 800);
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
    let badgeToUnlock: string | null = null;

    // Only calculate rewards if streak INCREASED (not broken/frozen)
    if (updatedUser.streak > user.streak) {
        message = `🔥 ${updatedUser.streak} Day Streak!`;
        
        if (updatedUser.streak === 3) { rewards = { coins: 1500, xp: 500 }; message += " (Bonus!)"; }
        else if (updatedUser.streak === 7) { rewards = { coins: 5000, xp: 1000 }; message += " (EPIC!)"; }
        else if (updatedUser.streak === 30) { 
            rewards = { coins: 50000, xp: 10000 }; 
            message += " (GODLIKE!)"; 
            // Check if badge already owned by ID
            if (!user.badges?.some(b => b.id === 'badge_streak_30')) badgeToUnlock = 'badge_streak_30';
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
            const newBadge: EarnedBadge = { id: badgeToUnlock, earned: new Date().toISOString() };
            updatePayload.badges = [...(user.badges || []), newBadge];
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
        
        // World is complete if 8 levels are done
        if (completedInWorld >= 8) {
             const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
             
             if (worldMeta) {
                 const newBadges = [...(user.badges || [])];
                 let badgeAdded = false;
                 
                 // Check if badge is already earned by looking up ID in the array of objects
                 if (worldMeta.badgeId && !newBadges.some(b => b.id === worldMeta.badgeId)) {
                     newBadges.push({
                         id: worldMeta.badgeId,
                         earned: new Date().toISOString()
                     });
                     badgeAdded = true;
                 }

                 // ALSO update masteredWorlds list for unlocking next world
                 const newMastered = [...(user.masteredWorlds || [])];
                 if (!newMastered.includes(worldMeta.id)) {
                     newMastered.push(worldMeta.id);
                 }
                 
                 // Only award coins/xp if this is the FIRST time mastering (detected via badge or mastered list update)
                 if (badgeAdded || newMastered.length > (user.masteredWorlds?.length || 0)) {
                     const bonusCoins = 2000; 
                     const bonusXP = 1000; 

                     await updateUser(uid, {
                         badges: newBadges,
                         coins: user.coins + bonusCoins,
                         masteredWorlds: newMastered
                     });

                     await addXP(uid, bonusXP);

                     // 4. CASINO CELEBRATION SEQUENCE
                     setTimeout(() => {
                         triggerCasinoEffect();
                         playSound('fanfare');
                         triggerVisualEffect(`WORLD COMPLETE!`, 'level');
                         
                         setTimeout(() => {
                             playSound('kaching');
                             triggerVisualEffect(`+${bonusCoins} Coins`, 'coin');
                         }, 500);

                         if (badgeAdded) {
                             setTimeout(() => {
                                 triggerVisualEffect(`BADGE UNLOCKED: ${worldMeta.title}`, 'level');
                             }, 1500);
                         }
                     }, 600); 
                 }
             }
        }
    } catch (e) {
        console.error("Badge check failed", e);
    }
};