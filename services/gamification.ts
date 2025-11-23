
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
    BanknotesIcon, 
    CalculatorIcon, 
    ScaleIcon, 
    BuildingLibraryIcon, 
    CreditCardIcon, 
    BriefcaseIcon, 
    PresentationChartLineIcon, 
    BuildingOffice2Icon 
} from '@heroicons/react/24/solid';
import { StockAsset, ASSET_LIST } from './stockMarket';

// --- Types ---

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji name or string
    unlockCondition: string; // Description of how to unlock
    color: string;
}

export interface EarnedBadge {
    id: string;
    earned: string; // ISO Timestamp
}

export interface UserState {
    uid?: string; // Firebase UID
    nickname: string;
    email?: string;
    avatar: any;
    level: number;
    xp: number;
    coins: number;
    
    // Profile Status
    isProfileComplete?: boolean;

    // Security & Auth
    isAdmin: boolean; 
    role: 'user' | 'admin' | 'mod';
    loginType: 'guest' | 'google' | 'apple' | 'email';

    // Monetization
    subscriptionStatus: 'free' | 'pro';
    lifetimeSpend: number; // REAL REVENUE TRACKING
    
    // Referrals
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    
    proExpiresAt?: string | null;

    // Streak 2.0
    streak: number;
    streakLastDate: string; // ISO Date string YYYY-MM-DD
    streakFreezes: number; // Mercy rule items
    
    // Challenges & Rewards
    dailyChallenges: Challenge[];
    lastChallengeDate: string;
    lastDailyChestClaim?: string; // ISO Date string YYYY-MM-DD

    // Progression
    completedLevels: string[]; 
    masteredWorlds: string[]; 
    
    // Progression (New System)
    progress: Record<string, WorldProgress>; // worldId -> data

    inventory: string[];
    badges: EarnedBadge[]; // List of badge objects
    
    joinedAt: string;
    knowledgeGems: string[]; // Collected gems IDs
    
    // Features
    portfolio: Portfolio; // Wall Street Zoo Data
    friends: string[]; // Friend IDs
    
    // Parent Portal
    parentCode?: string; // 6-digit code for parent access

    lastLoginAt?: string;
    lastLocation?: { lat: number, lng: number, country: string };
    createdAt?: string;
    lastSyncedAt?: any;
}

export interface WorldProgress {
    level: number; // Highest level unlocked/completed
    lessonsCompleted: Record<string, boolean>; // lessonId -> true
    score: number; // Total score for world
}

export interface Portfolio {
    cash: number; // Fake $100k
    holdings: Record<string, number>; // Symbol -> Quantity
    transactions: Transaction[];
    history: { date: string; netWorth: number }[];
}

export interface Transaction {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    amount: number; // Dollar amount
    price: number;
    quantity: number;
    date: string;
}

// Re-export Stock type for compatibility
export type Stock = StockAsset;
export const STOCK_UNIVERSE = ASSET_LIST;

export interface Challenge {
    id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    rewardXp: number;
    rewardCoins: number;
    progress: number;
    total: number;
    completed: boolean;
}

export interface ShopItem {
    id: string;
    name: string;
    emoji: string;
    cost: number;
    category: 'powerup' | 'cosmetic'; 
    description: string;
    limitedTime?: boolean;
    active?: boolean;
    tier: 1 | 2 | 3 | 4; // 1 (<5k), 2 (5k-10k), 3 (15k-40k), 4 (50k+)
    
    // For profile integration
    cosmeticType?: 'emoji' | 'outfit' | 'bg' | 'accessory';
    cosmeticValue?: string; // The actual emoji char or css class
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    isUser?: boolean;
    country?: string;
    netWorth?: number;
}

// --- Content Types for Firestore ---

export type LessonType = 'swipe' | 'drag_drop' | 'tapLie' | 'calculator' | 'meme' | 'video' | 'info' | 'funFact' | 'poll' | 'scenario' | 'badge';

// CMS Types
export interface LessonSwipeCard { text: string; isRight: boolean; label: string; }
export interface LessonDragItem { id: string; text: string; category: string; }
export interface LessonStatement { text: string; isLie: boolean; }

export interface LessonContent {
    // Swipe / Scenario
    cards?: LessonSwipeCard[];
    // Drag Drop
    buckets?: string[];
    items?: LessonDragItem[] | string[]; // string[] for compatibility with simpler JSON
    // Tap Lie
    statements?: LessonStatement[];
    // Meme
    imageUrl?: string;
    topText?: string;
    bottomText?: string;
    caption?: string; // From new JSON
    explanation?: string;
    // Calculator
    label?: string;
    formula?: string;
    resultLabel?: string;
    // Info / Video / Fun Fact
    text?: string;
    videoUrl?: string;
    factSource?: string;
    // Poll / Scenario specific
    question?: string;
    options?: string[];
    correct?: string | number;
    left?: string; // For binary swipe in JSON
    right?: string;
    answer?: number; // For calculator answer
    // Extra
    analogy?: string;
}

export interface Lesson {
    id: string;
    worldId: string;
    levelId: string;
    order: number;
    type: LessonType;
    title: string;
    content: LessonContent; 
    xpReward: number;
    coinReward: number;
    likes?: number;
    popularity?: string; // e.g. "12.4k"
    tags?: string[];
    world?: string; // From JSON import
    level?: number; // From JSON import
}

export interface LevelData {
    id: string;
    worldId: string;
    levelNumber: number;
    title: string;
    description: string;
    bossName: string;
    bossImage: string; // Emoji or URL
    bossIntro: string; // Trash talk line
    bossQuiz: BossQuestion[];
    lessons?: Lesson[]; // Legacy/Pre-loaded support
}

export interface BossQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface WorldData {
    id: string;
    title: string;
    icon: any;
    color: string;
    description: string;
    unlockLevel: number; 
    badgeId: string;
}

export const SEASONAL_EVENTS = {
    active: true,
    id: 'black_friday_2025',
    title: 'Black Friday Survivor',
    description: 'Survive the sales! 2x XP on Budgeting lessons.',
    themeColor: 'from-black via-red-900 to-black',
    accentColor: 'text-red-500',
    icon: '🛍️'
};

// --- CURRICULUM DEFINITION (FINAL PACK) ---

export const BADGES: Badge[] = [
    { id: 'badge_basics', name: 'Basics Boss', description: 'Mastered Moola Basics', icon: '🐷👑', unlockCondition: 'Complete World 1', color: 'bg-neon-green' },
    { id: 'badge_budget', name: 'Budget Ninja', description: 'Mastered Budget Beach', icon: '🥷📊', unlockCondition: 'Complete World 2', color: 'bg-neon-blue' },
    { id: 'badge_savings', name: 'Snowball God', description: 'Conquered Compound Cliffs', icon: '❄️✨', unlockCondition: 'Complete World 3', color: 'bg-neon-purple' },
    { id: 'badge_banking', name: 'Vault Breaker', description: 'Opened the Bank Vault', icon: '🏦🔨', unlockCondition: 'Complete World 4', color: 'bg-neon-pink' },
    { id: 'badge_debt', name: 'Debt Slayer', description: 'Escaped Debt Dungeon', icon: '⚔️💳', unlockCondition: 'Complete World 5', color: 'bg-orange-500' },
    { id: 'badge_taxes', name: 'Hustle Wolf', description: 'Survived Hustle Hub', icon: '🐺💼', unlockCondition: 'Complete World 6', color: 'bg-yellow-400' },
    { id: 'badge_invest', name: 'Stock Bull', description: 'Dominated Stony Stocks', icon: '🐂💹', unlockCondition: 'Complete World 7', color: 'bg-emerald-500' },
    { id: 'badge_wealth', name: 'Wealth Wizard', description: 'Ruled Empire City', icon: '🧙‍♂️💎', unlockCondition: 'Complete World 8', color: 'bg-indigo-500' },
    { id: 'badge_streak_30', name: 'Diamond Hands', description: '30 Day Streak', icon: '💎🙌', unlockCondition: 'Login 30 days in a row', color: 'bg-blue-400' },
    { id: 'badge_zoo_win', name: 'Wolf of Wall St', description: 'Made profit in the Zoo', icon: '🐺', unlockCondition: 'Trade a stock for profit', color: 'bg-red-500' },
];

export const WORLDS_METADATA: WorldData[] = [
    { id: 'Moola Basics', title: "MOOLA BASICS", icon: BanknotesIcon, color: "bg-neon-green", description: "Inflation & Needs vs Wants.", unlockLevel: 1, badgeId: 'badge_basics' },
    { id: 'Budget Beach', title: "BUDGET BEACH", icon: CalculatorIcon, color: "bg-neon-blue", description: "50/30/20 Rule.", unlockLevel: 2, badgeId: 'badge_budget' },
    { id: 'Compound Cliffs', title: "COMPOUND CLIFFS", icon: ScaleIcon, color: "bg-neon-purple", description: "The Cheat Code to Wealth.", unlockLevel: 3, badgeId: 'badge_savings' },
    { id: 'Bank Vault', title: "BANK VAULT", icon: BuildingLibraryIcon, color: "bg-neon-pink", description: "HYSA vs Checking.", unlockLevel: 5, badgeId: 'badge_banking' },
    { id: 'Debt Dungeon', title: "DEBT DUNGEON", icon: CreditCardIcon, color: "bg-orange-500", description: "Credit Cards & Loans.", unlockLevel: 8, badgeId: 'badge_debt' },
    { id: 'Hustle Hub', title: "HUSTLE HUB", icon: BriefcaseIcon, color: "bg-yellow-400", description: "Taxes & Side Hustles.", unlockLevel: 12, badgeId: 'badge_taxes' },
    { id: 'Stony Stocks', title: "STONY STOCKS", icon: PresentationChartLineIcon, color: "bg-emerald-500", description: "Investing & Risk.", unlockLevel: 15, badgeId: 'badge_invest' },
    { id: 'Wealth Empire', title: "EMPIRE CITY", icon: BuildingOffice2Icon, color: "bg-indigo-500", description: "Net Worth & Freedom.", unlockLevel: 20, badgeId: 'badge_wealth' }
];

// --- SHOP ITEMS (TIERED & POPULATED) ---
export const SHOP_ITEMS: ShopItem[] = [
    // --- TIER 1: Starter (0 - 5,000 Coins) ---
    { id: 'item_freeze', name: 'Streak Freeze', emoji: '🧊', cost: 500, category: 'powerup', tier: 1, description: 'Miss a day without losing your streak.', active: true },
    { id: 'acc_iced_coffee', name: 'Iced Coffee', emoji: '🥤', cost: 450, category: 'cosmetic', tier: 1, description: 'Caffeine addiction.', cosmeticType: 'accessory', cosmeticValue: '🥤', active: true },
    { id: 'face_clown', name: 'Clown Mode', emoji: '🤡', cost: 550, category: 'cosmetic', tier: 1, description: 'Bought high, sold low.', cosmeticType: 'emoji', cosmeticValue: '🤡', active: true },
    { id: 'acc_blue_cap', name: 'No Cap', emoji: '🧢', cost: 600, category: 'cosmetic', tier: 1, description: 'Fr fr.', cosmeticType: 'accessory', cosmeticValue: '🧢', active: true },
    { id: 'bg_green_glow', name: 'Green Glow', emoji: '💚', cost: 800, category: 'cosmetic', tier: 1, description: 'Radioactive riches.', cosmeticType: 'bg', cosmeticValue: 'bg-neon-green', active: true },
    { id: 'acc_basic_chain', name: 'Silver Chain', emoji: '⛓️', cost: 1000, category: 'cosmetic', tier: 1, description: 'Started from the bottom.', cosmeticType: 'accessory', cosmeticValue: '⛓️', active: true },
    { id: 'face_money_cat', name: 'Money Cat', emoji: '🐱', cost: 1200, category: 'cosmetic', tier: 1, description: 'Meow money.', cosmeticType: 'emoji', cosmeticValue: '🐱', active: true },
    { id: 'acc_red_flag', name: 'Red Flag', emoji: '🚩', cost: 1500, category: 'cosmetic', tier: 1, description: 'Walking red flag.', cosmeticType: 'accessory', cosmeticValue: '🚩', active: true },
    { id: 'fit_hoodie', name: 'Cozy Hoodie', emoji: '🧖', cost: 2500, category: 'cosmetic', tier: 1, description: 'Remote work vibes.', cosmeticType: 'outfit', cosmeticValue: '🧖', active: true },
    { id: 'acc_shades_rich', name: 'Hater Blockers', emoji: '🕶️', cost: 4000, category: 'cosmetic', tier: 1, description: 'Can\'t see the haters.', cosmeticType: 'accessory', cosmeticValue: '🕶️', active: true },

    // --- TIER 2: Baller (5,000 - 10,000 Coins) ---
    { id: 'fit_wings', name: 'Neon Angel', emoji: '🧚', cost: 5000, category: 'cosmetic', tier: 2, description: 'Financial guardian.', cosmeticType: 'outfit', cosmeticValue: '🧚', active: true },
    { id: 'face_ghost', name: 'Ghosted', emoji: '👻', cost: 5500, category: 'cosmetic', tier: 2, description: 'Left on read.', cosmeticType: 'emoji', cosmeticValue: '👻', active: true },
    { id: 'acc_vr', name: 'Metaverse', emoji: '🥽', cost: 6000, category: 'cosmetic', tier: 2, description: 'Living in 3025.', cosmeticType: 'accessory', cosmeticValue: '🥽', active: true },
    { id: 'acc_money_rain', name: 'Money Rain', emoji: '💸', cost: 6500, category: 'cosmetic', tier: 2, description: 'Make it rain.', cosmeticType: 'accessory', cosmeticValue: '💸', active: true },
    { id: 'face_robot', name: 'AI Bot', emoji: '🤖', cost: 7000, category: 'cosmetic', tier: 2, description: 'Beep boop wealthy.', cosmeticType: 'emoji', cosmeticValue: '🤖', active: true },
    { id: 'acc_diamond_chain', name: 'Ice Chain', emoji: '💠', cost: 7500, category: 'cosmetic', tier: 2, description: 'VVS Diamonds.', cosmeticType: 'accessory', cosmeticValue: '💠', active: true },
    { id: 'acc_lambo', name: 'Gold Lambo', emoji: '🏎️', cost: 8000, category: 'cosmetic', tier: 2, description: 'Vroom vroom.', cosmeticType: 'accessory', cosmeticValue: '🏎️', active: true },
    { id: 'bg_glitch', name: 'Glitch Mode', emoji: '👾', cost: 8500, category: 'cosmetic', tier: 2, description: 'System override.', cosmeticType: 'bg', cosmeticValue: 'bg-fuchsia-900', active: true },
    { id: 'acc_verified', name: 'Verified', emoji: '☑️', cost: 9000, category: 'cosmetic', tier: 2, description: 'Blue check status.', cosmeticType: 'accessory', cosmeticValue: '☑️', active: true },
    { id: 'bg_lava', name: 'Molten Lava', emoji: '🌋', cost: 9500, category: 'cosmetic', tier: 2, description: 'Hot streak.', cosmeticType: 'bg', cosmeticValue: 'bg-red-900', active: true },

    // --- TIER 3: Empire (15,000 - 50,000 Coins) ---
    { id: 'fit_ninja', name: 'Shadow Ninja', emoji: '🥷', cost: 15000, category: 'cosmetic', tier: 3, description: 'Silent but wealthy.', cosmeticType: 'outfit', cosmeticValue: '🥷', active: true },
    { id: 'fit_ceo', name: 'CEO Title', emoji: '🕴️', cost: 18000, category: 'cosmetic', tier: 3, description: 'Boss moves only.', cosmeticType: 'outfit', cosmeticValue: '🕴️', active: true },
    { id: 'bg_jet', name: 'Private Jet', emoji: '✈️', cost: 20000, category: 'cosmetic', tier: 3, description: 'Cloud 9 living.', cosmeticType: 'bg', cosmeticValue: 'bg-slate-600', active: true },
    { id: 'fit_astro', name: 'Moon Walker', emoji: '👩‍🚀', cost: 22000, category: 'cosmetic', tier: 3, description: 'To the moon! 🚀', cosmeticType: 'outfit', cosmeticValue: '👩‍🚀', active: true },
    { id: 'acc_money_gun', name: 'Money Gun', emoji: '🔫', cost: 25000, category: 'cosmetic', tier: 3, description: 'Pew pew pay.', cosmeticType: 'accessory', cosmeticValue: '🔫', active: true },
    { id: 'bg_matrix', name: 'The Code', emoji: '📟', cost: 28000, category: 'cosmetic', tier: 3, description: 'Hack the system.', cosmeticType: 'bg', cosmeticValue: 'bg-green-900', active: true },
    { id: 'acc_rolex', name: 'Rolex Watch', emoji: '⌚', cost: 30000, category: 'cosmetic', tier: 3, description: 'Time is money.', cosmeticType: 'accessory', cosmeticValue: '⌚', active: true },
    { id: 'acc_crown', name: 'King Crown', emoji: '👑', cost: 35000, category: 'cosmetic', tier: 3, description: 'Royalty.', cosmeticType: 'accessory', cosmeticValue: '👑', active: true },
    { id: 'face_goat', name: 'The GOAT', emoji: '🐐', cost: 38000, category: 'cosmetic', tier: 3, description: 'Greatest of All Time.', cosmeticType: 'emoji', cosmeticValue: '🐐', active: true },
    { id: 'bg_gold', name: 'Solid Gold', emoji: '🏆', cost: 40000, category: 'cosmetic', tier: 3, description: 'Midas touch.', cosmeticType: 'bg', cosmeticValue: 'bg-yellow-600', active: true },

    // --- TIER 4: Legendary (50,000+ Coins) ---
    { id: 'bg_diamond_aura', name: 'Diamond Aura', emoji: '💎', cost: 60000, category: 'cosmetic', tier: 4, description: 'Unbreakable wealth.', cosmeticType: 'bg', cosmeticValue: 'bg-cyan-300', active: true },
    { id: 'face_alien', name: 'Galactic', emoji: '👽', cost: 70000, category: 'cosmetic', tier: 4, description: 'Take me to your leader.', cosmeticType: 'emoji', cosmeticValue: '👽', active: true },
    { id: 'fit_carpet', name: 'Flying Carpet', emoji: '🧞', cost: 80000, category: 'cosmetic', tier: 4, description: 'A whole new world.', cosmeticType: 'outfit', cosmeticValue: '🧞', active: true },
    { id: 'acc_rocket', name: 'Mars Rocket', emoji: '🚀', cost: 90000, category: 'cosmetic', tier: 4, description: 'Leaving orbit.', cosmeticType: 'accessory', cosmeticValue: '🚀', active: true },
    { id: 'face_god_lion', name: 'Wealth God', emoji: '🦁', cost: 100000, category: 'cosmetic', tier: 4, description: 'Apex predator.', cosmeticType: 'emoji', cosmeticValue: '🦁', active: true },
    { id: 'fit_mecha', name: 'Mecha Suit', emoji: '🦾', cost: 150000, category: 'cosmetic', tier: 4, description: 'Future tech.', cosmeticType: 'outfit', cosmeticValue: '🦾', active: true },
    { id: 'bg_void', name: 'The Void', emoji: '⬛', cost: 250000, category: 'cosmetic', tier: 4, description: 'Infinite power.', cosmeticType: 'bg', cosmeticValue: 'bg-black', active: true },
    { id: 'acc_trophy', name: 'Champion', emoji: '🏆', cost: 500000, category: 'cosmetic', tier: 4, description: 'You won the game.', cosmeticType: 'accessory', cosmeticValue: '🏆', active: true },
];

// --- Logic Helpers ---

export const getXpForNextLevel = (level: number) => {
    return 100 * Math.pow(level, 2);
};

export const generateDailyChallenges = (): Challenge[] => [
    { 
        id: `daily_easy_${Date.now()}`, 
        title: 'Show Up', 
        description: 'Log in to the app (Easy W)', 
        difficulty: 'easy',
        rewardXp: 50, 
        rewardCoins: 100, 
        progress: 1, 
        total: 1, 
        completed: true 
    },
    { 
        id: `daily_med_${Date.now()}`, 
        title: 'Brain Gainz', 
        description: 'Complete 1 lesson or quiz', 
        difficulty: 'medium',
        rewardXp: 300, 
        rewardCoins: 500, 
        progress: 0, 
        total: 1, 
        completed: false 
    },
    { 
        id: `daily_hard_${Date.now()}`, 
        title: 'Wolf of Wall St', 
        description: 'Execute a trade in the Zoo', 
        difficulty: 'hard',
        rewardXp: 1000, 
        rewardCoins: 2000, 
        progress: 0, 
        total: 1, 
        completed: false 
    },
];

export const getMockLeaderboard = (): LeaderboardEntry[] => [];

export const calculateRiskScore = (portfolio: Portfolio): number => {
    const memeStocks = ['GME', 'AMC', 'DOGE', 'RBLX', 'TSLA', 'BTC'];
    let riskPoints = 0;
    let totalInvested = 0;

    Object.entries(portfolio.holdings).forEach(([sym, qty]) => {
        if (qty > 0) {
            totalInvested += 100; // Weight
            if (memeStocks.includes(sym)) riskPoints += 100;
        }
    });

    if (totalInvested === 0) return 1;
    const score = Math.ceil((riskPoints / totalInvested) * 10);
    return Math.max(1, Math.min(10, score));
};

export const generateRandomProfile = () => {
    const nicknames = [
        "MoneyNinja", "CashKing", "ProfitPro", "StonksMaster", 
        "WealthWiz", "CryptoKid", "BudgetBoss", "SavingsSquad"
    ];
    const randomName = `${nicknames[Math.floor(Math.random() * nicknames.length)]}${Math.floor(Math.random() * 999)}`;
    
    const emojis = ['😎', '🤠', '👽', '👻', '🤖', '😼'];
    const outfits = ['👕', '🧥', '👗', '🥋', '🦺'];
    
    return {
        nickname: randomName,
        avatar: {
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            outfit: outfits[Math.floor(Math.random() * outfits.length)],
            accessory: '🧢',
            bg: 'bg-neon-blue'
        }
    };
};

export const createInitialUser = (onboardingData: any): UserState => {
    const today = new Date().toISOString().split('T')[0];
    const code = Math.random().toString(36).substring(2, 5).toUpperCase() + Math.floor(Math.random() * 900 + 100);
    const randomProfile = generateRandomProfile();

    return {
        nickname: randomProfile.nickname,
        avatar: randomProfile.avatar,
        level: 1, 
        xp: onboardingData.xp || 500, 
        coins: 500,
        subscriptionStatus: 'free',
        lifetimeSpend: 0,
        isProfileComplete: false, 
        
        isAdmin: false,
        role: 'user',
        loginType: onboardingData.authMethod || 'guest',

        referralCode: code,
        referralCount: 0,
        
        streak: 1,
        streakLastDate: today,
        streakFreezes: 1, 

        dailyChallenges: generateDailyChallenges(),
        lastChallengeDate: today,
        lastDailyChestClaim: '',

        completedLevels: [],
        masteredWorlds: [],
        progress: {}, 
        inventory: [],
        badges: [], 
        knowledgeGems: [],
        joinedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        portfolio: {
            cash: 100000, 
            holdings: {},
            transactions: [],
            history: [{ date: new Date().toISOString(), netWorth: 100000 }]
        },
        friends: []
    };
};

export const checkStreak = (user: UserState): { updatedUser: UserState; savedByFreeze: boolean; broken: boolean } => {
    const today = new Date().toLocaleDateString('en-CA');
    const lastActive = user.streakLastDate;
    
    if (lastActive === today) {
        return { updatedUser: user, savedByFreeze: false, broken: false };
    }

    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toLocaleDateString('en-CA');

    const updatedUser = { ...user };
    let savedByFreeze = false;
    let broken = false;

    if (lastActive === yesterday) {
        updatedUser.streak += 1;
        updatedUser.streakLastDate = today;
    } else {
        if (updatedUser.streakFreezes > 0) {
            updatedUser.streakFreezes -= 1;
            updatedUser.streakLastDate = today;
            savedByFreeze = true;
        } else {
            updatedUser.streak = 1;
            updatedUser.streakLastDate = today;
            broken = true;
        }
    }

    return { updatedUser, savedByFreeze, broken };
};
