
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
    subtitle?: string; 
    icon: string; 
    unlockCondition: string; 
    color: string;
}

export interface SystemConfig {
    adsEnabled: boolean;
    maintenanceMode?: boolean;
    minVersion?: string;
}

export interface UserState {
    uid?: string; 
    nickname: string;
    email?: string;
    avatar: any;
    level: number;
    xp: number;
    coins: number;
    
    // COPPA Compliance
    ageConfirmed?: boolean;
    birthYear?: number;

    isProfileComplete?: boolean;

    isAdmin: boolean; 
    role: 'user' | 'admin' | 'mod';
    loginType: 'guest' | 'google' | 'apple' | 'email';

    // Legacy fields kept for type safety but UI will ignore real money status
    subscriptionStatus: 'free' | 'pro';
    lifetimeSpend: number; 
    
    referralCode: string;
    referredBy?: string;
    referralCount: number;
    
    proExpiresAt?: string | null;

    streak: number;
    streakLastDate: string; 
    streakFreezes: number; 
    
    dailyChallenges: Challenge[];
    lastChallengeDate: string;
    lastDailyChestClaim?: string; 

    completedLevels: string[]; 
    masteredWorlds: string[]; 
    
    progress: Record<string, WorldProgress>; 

    inventory: string[];
    badges: string[]; 
    
    joinedAt: string;
    knowledgeGems: string[]; 
    
    portfolio: Portfolio; 
    friends: string[]; 
    
    parentCode?: string; 

    lastLoginAt?: string;
    lastLocation?: { lat: number, lng: number, country: string };
    createdAt?: string;
    lastSyncedAt?: any;
}

export interface WorldProgress {
    level: number; 
    lessonsCompleted: Record<string, boolean>; 
    score: number; 
}

export interface Portfolio {
    cash: number; 
    holdings: Record<string, number>; 
    transactions: Transaction[];
    history: { date: string; netWorth: number }[];
}

export interface Transaction {
    id: string;
    symbol: string;
    type: 'buy' | 'sell';
    amount: number; 
    price: number;
    quantity: number;
    date: string;
}

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
    category: 'pet' | 'outfit' | 'powerup' | 'aura' | 'accessory' | 'emoji' | 'background';
    description: string;
    limitedTime?: boolean;
    active?: boolean;
    // Mapping to Avatar Config
    avatarPart?: 'emoji' | 'outfit' | 'accessory' | 'bg';
    avatarValue?: string; // The CSS class or String value
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

export interface LessonSwipeCard { text: string; isRight: boolean; label: string; }
export interface LessonDragItem { id: string; text: string; category: string; }
export interface LessonStatement { text: string; isLie: boolean; }

export interface LessonContent {
    cards?: LessonSwipeCard[];
    buckets?: string[];
    items?: LessonDragItem[] | string[]; 
    statements?: LessonStatement[];
    imageUrl?: string;
    topText?: string;
    bottomText?: string;
    caption?: string; 
    explanation?: string;
    label?: string;
    formula?: string;
    resultLabel?: string;
    text?: string;
    videoUrl?: string;
    factSource?: string;
    question?: string;
    options?: string[];
    correct?: string | number;
    left?: string; 
    right?: string;
    answer?: number; 
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
    popularity?: string; 
    tags?: string[];
    world?: string; 
    level?: number; 
}

export interface LevelData {
    id: string;
    worldId: string;
    levelNumber: number;
    title: string;
    description: string;
    bossName: string;
    bossImage: string; 
    bossIntro: string; 
    bossQuiz: BossQuestion[];
    lessons?: Lesson[]; 
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

// --- DEFAULTS ---
export const DEFAULT_AVATAR_ITEMS = {
    emojis: ['😎', '🤠', '👽', '👻', '🤖', '😼', '🦁', '💀', '💩', '🤓'],
    outfits: ['👕', '🧥', '👗', '🥋', '🦺', '👔', '👚'],
    backgrounds: ['bg-neon-blue', 'bg-neon-green', 'bg-neon-pink', 'bg-neon-purple', 'bg-yellow-400', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500']
};

// --- ITEM SHOP ---

export const SHOP_ITEMS: ShopItem[] = [
    // Powerups
    { id: 'item_freeze', name: 'Streak Freeze', emoji: '🧊', cost: 500, category: 'powerup', description: 'Miss a day without losing your streak.', active: true },
    { id: 'item_boost_2x', name: '2x XP Booster', emoji: '⚡', cost: 1200, category: 'powerup', description: 'Double XP for 24 hours', limitedTime: true, active: true },

    // CHEAP (500 - 2000)
    { id: 'item_bg_green', name: 'Green Glow', emoji: '🟢', cost: 800, category: 'background', description: 'Radiate success.', avatarPart: 'bg', avatarValue: 'bg-gradient-to-br from-green-400 to-green-900 border-green-400' },
    { id: 'item_acc_cap', name: 'Blue Cap', emoji: '🧢', cost: 600, category: 'accessory', description: 'Classic look.', avatarPart: 'accessory', avatarValue: '🧢' },
    { id: 'item_acc_cat', name: 'Money Cat', emoji: '🐱', cost: 1200, category: 'accessory', description: 'Purrs in rich.', avatarPart: 'accessory', avatarValue: '🐱' },
    { id: 'item_acc_chain', name: 'Basic Chain', emoji: '⛓️', cost: 1000, category: 'accessory', description: 'Start of the drip.', avatarPart: 'accessory', avatarValue: '⛓️' },
    { id: 'item_outfit_hoodie', name: 'Hustle Hoodie', emoji: '🧥', cost: 500, category: 'outfit', description: 'Comfy grinder.', avatarPart: 'outfit', avatarValue: '🧥' },
    
    // MEDIUM (3000 - 10000)
    { id: 'item_acc_wings', name: 'Neon Wings', emoji: '🧚', cost: 5000, category: 'accessory', description: 'Fly high.', avatarPart: 'accessory', avatarValue: '🧚' },
    { id: 'item_acc_lambo', name: 'Lambo Pet', emoji: '🏎️', cost: 8000, category: 'pet', description: 'Vroom vroom.', avatarPart: 'accessory', avatarValue: '🏎️' },
    { id: 'item_bg_rain', name: 'Money Rain', emoji: '💸', cost: 6000, category: 'background', description: 'Make it rain.', avatarPart: 'bg', avatarValue: 'bg-[url("https://www.transparenttextures.com/patterns/diagmonds-light.png")] bg-green-600' },
    { id: 'item_acc_diamond', name: 'Diamond Chain', emoji: '💎', cost: 7500, category: 'accessory', description: 'Ice cold.', avatarPart: 'accessory', avatarValue: '💎' },
    { id: 'item_acc_shades', name: 'Rich Shades', emoji: '😎', cost: 4000, category: 'accessory', description: 'Block the haters.', avatarPart: 'accessory', avatarValue: '😎' },
    { id: 'item_outfit_suit', name: 'CEO Suit', emoji: '👔', cost: 4500, category: 'outfit', description: 'Strictly business.', avatarPart: 'outfit', avatarValue: '👔' },
    { id: 'item_emoji_robot', name: 'Algo Bot', emoji: '🤖', cost: 3000, category: 'emoji', description: 'Beep boop profit.', avatarPart: 'emoji', avatarValue: '🤖' },

    // EXPENSIVE (15000 - 40000)
    { id: 'item_bg_jet', name: 'Private Jet', emoji: '✈️', cost: 20000, category: 'background', description: 'Cloud nine living.', avatarPart: 'bg', avatarValue: 'bg-slate-800 border-4 border-white' },
    { id: 'item_acc_ceo', name: 'CEO Sign', emoji: '💼', cost: 18000, category: 'accessory', description: 'Boss level.', avatarPart: 'accessory', avatarValue: '💼' },
    { id: 'item_acc_gun', name: 'Money Gun', emoji: '🔫', cost: 25000, category: 'accessory', description: 'Pew pew cash.', avatarPart: 'accessory', avatarValue: '🔫' },
    { id: 'item_acc_watch', name: 'Rol-X Watch', emoji: '⌚', cost: 30000, category: 'accessory', description: 'Time is money.', avatarPart: 'accessory', avatarValue: '⌚' },
    { id: 'item_acc_crown', name: 'King Crown', emoji: '👑', cost: 35000, category: 'accessory', description: 'Rule the empire.', avatarPart: 'accessory', avatarValue: '👑' },
    { id: 'item_outfit_tux', name: 'Gala Tux', emoji: '🤵', cost: 20000, category: 'outfit', description: 'Fancy fancy.', avatarPart: 'outfit', avatarValue: '🤵' },
    { id: 'item_emoji_alien', name: 'Market Alien', emoji: '👽', cost: 15000, category: 'emoji', description: 'Out of this world.', avatarPart: 'emoji', avatarValue: '👽' },

    // LEGENDARY (50000+)
    { id: 'item_bg_diamond_aura', name: 'Diamond Aura', emoji: '💠', cost: 60000, category: 'background', description: 'Pure net worth energy.', avatarPart: 'bg', avatarValue: 'bg-cyan-200 border-4 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.8)]' },
    { id: 'item_acc_carpet', name: 'Magic Carpet', emoji: '🧞', cost: 80000, category: 'accessory', description: 'A whole new world.', avatarPart: 'accessory', avatarValue: '🧞' },
    { id: 'item_outfit_god', name: 'Wealth God', emoji: '👘', cost: 100000, category: 'outfit', description: 'Ascended.', avatarPart: 'outfit', avatarValue: '👘' },
    { id: 'item_pet_dragon', name: 'Gold Dragon', emoji: '🐲', cost: 75000, category: 'pet', description: 'Hoarding gold.', avatarPart: 'accessory', avatarValue: '🐲' },
    { id: 'item_emoji_ghost', name: 'Ghost of Debt', emoji: '👻', cost: 50000, category: 'emoji', description: 'Scary rich.', avatarPart: 'emoji', avatarValue: '👻' },
];

export const BADGES: Badge[] = [
    { id: 'badge_basics', name: 'Money Baby', subtitle: 'Started from the bottom', description: 'Completed Moola Basics', icon: '🐷', unlockCondition: 'Complete World 1', color: 'bg-pink-500' },
    { id: 'badge_budget', name: 'Budget Chad', subtitle: 'Spreadsheets obey you', description: 'Mastered Budget Beach', icon: '😎', unlockCondition: 'Complete World 2', color: 'bg-blue-500' },
    { id: 'badge_savings', name: 'Snowball God', subtitle: 'Compound interest goes brrr', description: 'Conquered Compound Cliffs', icon: '❄️', unlockCondition: 'Complete World 3', color: 'bg-cyan-400' },
    { id: 'badge_banking', name: 'Vault Breaker', subtitle: 'Open sesame', description: 'Opened the Bank Vault', icon: '🔓', unlockCondition: 'Complete World 4', color: 'bg-purple-600' },
    { id: 'badge_debt', name: 'Debt Slayer', subtitle: 'Klarna fears you', description: 'Escaped Debt Dungeon', icon: '⚔️', unlockCondition: 'Complete World 5', color: 'bg-red-600' },
    { id: 'badge_taxes', name: 'Hustle Wolf', subtitle: 'Awoooo (Tax Free)', description: 'Survived Hustle Hub', icon: '🐺', unlockCondition: 'Complete World 6', color: 'bg-yellow-500' },
    { id: 'badge_invest', name: 'Market Bull', subtitle: 'Green candles only', description: 'Dominated Stony Stocks', icon: '🐂', unlockCondition: 'Complete World 7', color: 'bg-green-500' },
    { id: 'badge_wealth', name: 'Empire Crown', subtitle: 'King of the castle', description: 'Ruled Empire City', icon: '👑', unlockCondition: 'Complete World 8', color: 'bg-indigo-500' },
    { id: 'badge_streak_30', name: 'Diamond Hands', subtitle: 'Unbreakable', description: '30 Day Streak', icon: '💎', unlockCondition: 'Login 30 days in a row', color: 'bg-blue-400' },
    { id: 'badge_zoo_win', name: 'Wolf of Wall St', subtitle: 'Alpha moves', description: 'Made profit in the Zoo', icon: '🐺', unlockCondition: 'Trade a stock for profit', color: 'bg-gray-800' },
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

// --- Logic Helpers ---

export const getXpForNextLevel = (level: number) => {
    return 100 * Math.pow(level, 2);
};

export const generateDailyChallenges = (): Challenge[] => [
    { id: `daily_easy_${Date.now()}`, title: 'Show Up', description: 'Log in to the app (Easy W)', difficulty: 'easy', rewardXp: 50, rewardCoins: 100, progress: 1, total: 1, completed: true },
    { id: `daily_med_${Date.now()}`, title: 'Brain Gainz', description: 'Complete 1 lesson or quiz', difficulty: 'medium', rewardXp: 300, rewardCoins: 500, progress: 0, total: 1, completed: false },
    { id: `daily_hard_${Date.now()}`, title: 'Wolf of Wall St', description: 'Execute a trade in the Zoo', difficulty: 'hard', rewardXp: 1000, rewardCoins: 2000, progress: 0, total: 1, completed: false },
];

export const getMockLeaderboard = (): LeaderboardEntry[] => [];

export const calculateRiskScore = (portfolio: Portfolio): number => {
    const memeStocks = ['GME', 'AMC', 'DOGE', 'RBLX', 'TSLA', 'BTC'];
    let riskPoints = 0;
    let totalInvested = 0;
    Object.entries(portfolio.holdings).forEach(([sym, qty]) => {
        if (qty > 0) {
            totalInvested += 100; 
            if (memeStocks.includes(sym)) riskPoints += 100;
        }
    });
    if (totalInvested === 0) return 1;
    const score = Math.ceil((riskPoints / totalInvested) * 10);
    return Math.max(1, Math.min(10, score));
};

export const generateRandomProfile = () => {
    const nicknames = ["MoneyNinja", "CashKing", "ProfitPro", "StonksMaster", "WealthWiz", "CryptoKid", "BudgetBoss", "SavingsSquad"];
    const randomName = `${nicknames[Math.floor(Math.random() * nicknames.length)]}${Math.floor(Math.random() * 999)}`;
    
    return {
        nickname: randomName,
        avatar: {
            emoji: DEFAULT_AVATAR_ITEMS.emojis[Math.floor(Math.random() * DEFAULT_AVATAR_ITEMS.emojis.length)],
            outfit: DEFAULT_AVATAR_ITEMS.outfits[Math.floor(Math.random() * DEFAULT_AVATAR_ITEMS.outfits.length)],
            accessory: '',
            bg: DEFAULT_AVATAR_ITEMS.backgrounds[Math.floor(Math.random() * DEFAULT_AVATAR_ITEMS.backgrounds.length)]
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
        
        // COPPA
        ageConfirmed: onboardingData.ageConfirmed || false,
        birthYear: onboardingData.birthYear,

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
    
    if (lastActive === today) return { updatedUser: user, savedByFreeze: false, broken: false };

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
