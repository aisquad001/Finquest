
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

export interface UserState {
    uid?: string; // Firebase UID
    nickname: string;
    email?: string;
    avatar: any;
    level: number;
    xp: number;
    coins: number;
    
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

    // Progression (Legacy)
    completedLevels: string[]; 
    masteredWorlds: string[]; 
    
    // Progression (New System)
    progress: Record<string, WorldProgress>; // worldId -> data

    inventory: string[];
    joinedAt: string;
    knowledgeGems: string[]; // Collected gems IDs
    
    // Features
    portfolio: Portfolio; // Wall Street Zoo Data
    friends: string[]; // Friend IDs
    
    lastLoginAt?: string;
    lastLocation?: { lat: number, lng: number, country: string }; // For Admin Map
    createdAt?: string;
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
    category: 'pet' | 'outfit' | 'powerup';
    description: string;
    limitedTime?: boolean;
    active?: boolean;
}

export interface EconomyConfig {
    xpMultiplier: number;
    coinMultiplier: number;
    marketStatus: 'open' | 'closed' | 'crashed' | 'moon';
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

export type LessonType = 'swipe' | 'drag_drop' | 'tap_lie' | 'calculator' | 'meme' | 'video' | 'info';

// CMS Types
export interface LessonSwipeCard { text: string; isRight: boolean; label: string; }
export interface LessonDragItem { id: string; text: string; category: string; }
export interface LessonStatement { text: string; isLie: boolean; }

export interface LessonContent {
    // Swipe
    cards?: LessonSwipeCard[];
    // Drag Drop
    buckets?: string[];
    items?: LessonDragItem[];
    // Tap Lie
    statements?: LessonStatement[];
    // Meme
    imageUrl?: string;
    topText?: string;
    bottomText?: string;
    explanation?: string;
    // Calculator
    label?: string;
    formula?: string;
    resultLabel?: string;
    // Info / Video
    text?: string;
    videoUrl?: string;
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
    unlockLevel: number; // Legacy unlock check
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

export const WORLDS_METADATA: WorldData[] = [
    { id: 'world1', title: "MOOLA BASICS", icon: BanknotesIcon, color: "bg-neon-green", description: "Money isn't real bro.", unlockLevel: 1 },
    { id: 'world2', title: "BUDGET BEACH", icon: CalculatorIcon, color: "bg-neon-blue", description: "50/30/20 Rule but hot.", unlockLevel: 2 },
    { id: 'world3', title: "COMPOUND CLIFFS", icon: ScaleIcon, color: "bg-neon-purple", description: "Money making money.", unlockLevel: 3 },
    { id: 'world4', title: "BANK VAULT", icon: BuildingLibraryIcon, color: "bg-neon-pink", description: "Don't keep cash under mattress.", unlockLevel: 5 },
    { id: 'world5', title: "DEBT DUNGEON", icon: CreditCardIcon, color: "bg-orange-500", description: "Credit cards = Toxic Ex.", unlockLevel: 8 },
    { id: 'world6', title: "HUSTLE HUB", icon: BriefcaseIcon, color: "bg-yellow-400", description: "Taxation is theft (jk... unless?).", unlockLevel: 12 },
    { id: 'world7', title: "STONY STOCKS", icon: PresentationChartLineIcon, color: "bg-emerald-500", description: "Invest like a sneaker flipper.", unlockLevel: 15 },
    { id: 'world8', title: "EMPIRE CITY", icon: BuildingOffice2Icon, color: "bg-indigo-500", description: "Roth IRA = Cheat Code.", unlockLevel: 20 }
];

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'item_freeze', name: 'Streak Freeze', emoji: '🧊', cost: 500, category: 'powerup', description: 'Miss a day without losing your streak.', limitedTime: false, active: true },
    { id: 'item_boost_2x', name: '2x XP Booster', emoji: '⚡', cost: 1200, category: 'powerup', description: 'Double XP for 24 hours', limitedTime: true, active: true },
    { id: 'item_pet_lambo', name: 'Golden Lambo', emoji: '🏎️', cost: 5000, category: 'pet', description: 'Flex on them haters', limitedTime: true, active: true },
    { id: 'item_pet_doge', name: 'Doge', emoji: '🐕', cost: 800, category: 'pet', description: 'Much wow. Such finance.', active: true },
    { id: 'item_outfit_suit', name: 'CEO Suit', emoji: '👔', cost: 1500, category: 'outfit', description: 'Dress for the job you want.', active: true },
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

export const getMockLeaderboard = (): LeaderboardEntry[] => [
    { rank: 1, name: "Elon Tusk", xp: 99000, avatar: "🚀", country: "Mars", netWorth: 420000 },
    { rank: 2, name: "Jeff Bazookas", xp: 85000, avatar: "📦", country: "USA", netWorth: 380000 },
    { rank: 3, name: "CryptoKing99", xp: 72000, avatar: "💎", country: "UK", netWorth: 150000 },
    { rank: 4, name: "DiamondHands", xp: 68000, avatar: "🦍", country: "WSB", netWorth: 120000 },
    { rank: 5, name: "Satoshi", xp: 60000, avatar: "🤐", country: "JP", netWorth: 100000 },
    { rank: 6, name: "Warren Buffet", xp: 55000, avatar: "🍔", country: "USA", netWorth: 90000 },
    { rank: 7, name: "Racked God", xp: 50000, avatar: "👑", country: "App", netWorth: 85000 },
];

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

    // Generate a base random profile for defaults (ensures avatar is never undefined)
    const randomProfile = generateRandomProfile();

    let nickname = onboardingData.nickname;
    let avatar = onboardingData.avatar;
    
    // 1. Use Google Display Name if available (and not strictly guest)
    if (onboardingData.displayName && onboardingData.authMethod !== 'guest') {
        nickname = onboardingData.displayName;
    }

    // 2. If nickname is missing, use random
    if (!nickname) {
        nickname = randomProfile.nickname;
    }
    
    // 3. If avatar is missing (common for Google Auth), use random
    if (!avatar) {
        avatar = randomProfile.avatar;
    }
    
    // 4. For Guest Mode specifically...
    if (onboardingData.authMethod === 'guest' && !onboardingData.nickname) {
        nickname = randomProfile.nickname;
        avatar = randomProfile.avatar;
    }

    // FINAL SAFEGUARD: Ensure avatar is an object to prevent Firestore undefined errors
    if (!avatar || typeof avatar !== 'object' || !avatar.emoji) {
        avatar = randomProfile.avatar;
    }

    return {
        nickname: nickname,
        avatar: avatar,
        level: 1, 
        xp: onboardingData.xp || 500, 
        coins: 500,
        subscriptionStatus: 'free',
        lifetimeSpend: 0,
        
        // Security Defaults
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
