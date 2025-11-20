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

// --- Types ---

export interface UserState {
    nickname: string;
    avatar: any;
    level: number;
    xp: number;
    coins: number;
    streak: number;
    streakLastDate: string; // ISO Date string
    completedLevels: string[]; // Format: "worldId_levelId"
    masteredWorlds: string[]; // Format: "worldId"
    inventory: string[];
    joinedAt: string;
    knowledgeGems: string[]; // Collected gems
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    rewardXp: number;
    rewardCoins: number;
    progress: number;
    total: number;
    type: 'daily' | 'weekly';
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
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    isUser?: boolean;
    country?: string;
}

// --- World Data Structure ---
export interface WorldData {
    id: string;
    title: string;
    icon: any;
    color: string;
    description: string;
    unlockLevel: number;
}

export const WORLDS_METADATA: WorldData[] = [
    { id: 'basics', title: "MOOLA BASICS", icon: BanknotesIcon, color: "bg-neon-green", description: "History of money and inflation explained simply.", unlockLevel: 1 },
    { id: 'budget', title: "BUDGET BEACH", icon: CalculatorIcon, color: "bg-neon-blue", description: "Budgeting with 50/30/20 rule.", unlockLevel: 2 },
    { id: 'savings', title: "COMPOUND CLIFFS", icon: ScaleIcon, color: "bg-neon-purple", description: "Compound interest and emergency funds.", unlockLevel: 3 },
    { id: 'banking', title: "BANK VAULT", icon: BuildingLibraryIcon, color: "bg-neon-pink", description: "Checking, savings, and safety.", unlockLevel: 5 },
    { id: 'debt', title: "DEBT DUNGEON", icon: CreditCardIcon, color: "bg-orange-500", description: "Good vs bad debt and credit scores.", unlockLevel: 8 },
    { id: 'income', title: "HUSTLE HUB", icon: BriefcaseIcon, color: "bg-yellow-400", description: "Taxes, gross vs net, side hustles.", unlockLevel: 12 },
    { id: 'investing', title: "STONY STOCKS", icon: PresentationChartLineIcon, color: "bg-emerald-500", description: "Stocks, ETFs, and risk.", unlockLevel: 15 },
    { id: 'wealth', title: "EMPIRE CITY", icon: BuildingOffice2Icon, color: "bg-indigo-500", description: "Net worth and long term wealth.", unlockLevel: 20 }
];

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'item_boost_2x', name: '2x XP Booster', emoji: '⚡', cost: 1200, category: 'powerup', description: 'Double XP for 24 hours', limitedTime: true },
    { id: 'item_pet_lambo', name: 'Golden Lambo', emoji: '🏎️', cost: 5000, category: 'pet', description: 'Flex on them haters', limitedTime: true },
    { id: 'item_pet_doge', name: 'Doge', emoji: '🐕', cost: 800, category: 'pet', description: 'Much wow. Such finance.' },
    { id: 'item_outfit_suit', name: 'CEO Suit', emoji: '👔', cost: 1500, category: 'outfit', description: 'Dress for the job you want.' },
    { id: 'item_hint', name: 'Quiz Hint', emoji: '💡', cost: 400, category: 'powerup', description: 'Reveal one answer.' },
];

// --- Logic ---

export const getXpForNextLevel = (level: number) => {
    return 100 * Math.pow(level, 2);
};

export const generateDailyQuests = (): Quest[] => [
    { id: 'q1', title: 'Daily Grind', description: 'Complete 1 lesson', rewardXp: 300, rewardCoins: 100, progress: 0, total: 1, type: 'daily', completed: false },
    { id: 'q2', title: 'Quiz Whiz', description: 'Score 100% on a boss fight', rewardXp: 500, rewardCoins: 200, progress: 0, total: 1, type: 'daily', completed: false },
    { id: 'q3', title: 'Big Spender', description: 'Buy an item from the shop', rewardXp: 200, rewardCoins: 50, progress: 0, total: 1, type: 'daily', completed: false },
];

export const getMockLeaderboard = (): LeaderboardEntry[] => [
    { rank: 1, name: "Elon Tusk", xp: 99000, avatar: "🚀", country: "Mars" },
    { rank: 2, name: "Jeff Bazookas", xp: 85000, avatar: "📦", country: "USA" },
    { rank: 3, name: "CryptoKing99", xp: 72000, avatar: "💎", country: "UK" },
    { rank: 4, name: "DiamondHands", xp: 68000, avatar: "🦍", country: "WSB" },
    { rank: 5, name: "Satoshi", xp: 60000, avatar: "🤐", country: "JP" },
];

// --- Persistence (Mock Firebase) ---

const DB_KEY = 'finquest_db_v2';

export const saveUser = (user: UserState) => {
    localStorage.setItem(DB_KEY, JSON.stringify(user));
};

export const loadUser = (): UserState | null => {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : null;
};

export const createInitialUser = (onboardingData: any): UserState => {
    return {
        nickname: onboardingData.nickname,
        avatar: onboardingData.avatar,
        level: 1,
        xp: onboardingData.xp || 0,
        coins: 500, // Bonus
        streak: 1,
        streakLastDate: new Date().toISOString(),
        completedLevels: [],
        masteredWorlds: [],
        inventory: [],
        knowledgeGems: [],
        joinedAt: new Date().toISOString()
    };
};