
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
    uid?: string; // Firebase UID
    nickname: string;
    avatar: any;
    level: number;
    xp: number;
    coins: number;
    
    // Monetization
    subscriptionStatus: 'free' | 'pro';
    referralCount: number;

    // Streak 2.0
    streak: number;
    streakLastDate: string; // ISO Date string of last activity
    streakFreezes: number; // Mercy rule items
    
    // Challenges 2.0
    dailyChallenges: Challenge[];
    lastChallengeDate: string;

    // Progression
    completedLevels: string[]; // Format: "worldId_levelId"
    masteredWorlds: string[]; // Format: "worldId"
    inventory: string[];
    joinedAt: string;
    knowledgeGems: string[]; // Collected gems
    
    // Features
    portfolio: Portfolio; // Wall Street Zoo Data
    friends: string[]; // Friend IDs
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

export interface Stock {
    symbol: string;
    name: string;
    category: 'meme' | 'brand' | 'etf' | 'crypto';
    mascot: string; // Emoji
    price: number;
    changePercent: number;
    risk: number; // 1 (Safe) to 10 (Degen)
    description: string;
    whyMoved: string; // Funny explainer
}

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
}

export interface LeaderboardEntry {
    rank: number;
    name: string;
    xp: number;
    avatar: string;
    isUser?: boolean;
    country?: string;
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

// --- STOCK UNIVERSE ---
export const STOCK_UNIVERSE: Stock[] = [
    // MEME (Risk 8-10)
    { symbol: 'TSLA', name: 'Tesla', category: 'meme', mascot: '🐕', price: 240.50, changePercent: 4.2, risk: 8, description: "Electric cars & robot taxis.", whyMoved: "Elon tweeted a meme about tacos. Stock went up." },
    { symbol: 'GME', name: 'GameStop', category: 'meme', mascot: '🛑', price: 22.10, changePercent: -12.5, risk: 10, description: "Power to the players.", whyMoved: "Reddit decided to take a nap today." },
    { symbol: 'RBLX', name: 'Roblox', category: 'meme', mascot: '🧱', price: 38.90, changePercent: 1.5, risk: 7, description: "OOF. Digital lego metaverse.", whyMoved: "Kids spent $10M on virtual hats this weekend." },
    { symbol: 'AMC', name: 'AMC', category: 'meme', mascot: '🍿', price: 4.50, changePercent: -2.0, risk: 10, description: "Movies and popcorn.", whyMoved: "No good movies out right now. Sad." },
    
    // TEEN BRANDS (Risk 4-7)
    { symbol: 'AAPL', name: 'Apple', category: 'brand', mascot: '🍎', price: 185.00, changePercent: 0.5, risk: 4, description: "Blue bubbles & shiny metal.", whyMoved: "New iPhone leak shows... same design as last year." },
    { symbol: 'NKE', name: 'Nike', category: 'brand', mascot: '👟', price: 95.20, changePercent: 1.2, risk: 5, description: "Just Do It.", whyMoved: "Dropped a fire new Jordan colorway." },
    { symbol: 'NFLX', name: 'Netflix', category: 'brand', mascot: '🎬', price: 460.00, changePercent: -5.4, risk: 6, description: "Chill provider.", whyMoved: "They cancelled your favorite show. Again." },
    { symbol: 'SPOT', name: 'Spotify', category: 'brand', mascot: '🎧', price: 145.00, changePercent: 2.1, risk: 5, description: "Music for your ears.", whyMoved: "Taylor Swift released a 10-minute voice memo." },
    { symbol: 'DIS', name: 'Disney', category: 'brand', mascot: '🏰', price: 92.00, changePercent: 0.1, risk: 4, description: "The Mouse House.", whyMoved: "Mickey raised ticket prices by $5." },
    { symbol: 'KO', name: 'Coca-Cola', category: 'brand', mascot: '🥤', price: 58.00, changePercent: 0.2, risk: 2, description: "Sugar water.", whyMoved: "People are thirsty. Groundbreaking news." },
    { symbol: 'MCD', name: 'McDonalds', category: 'brand', mascot: '🍟', price: 290.00, changePercent: 0.8, risk: 3, description: "Golden Arches.", whyMoved: "Ice cream machine is actually working today." },
    
    // ETFs (Risk 1-3)
    { symbol: 'SPY', name: 'S&P 500', category: 'etf', mascot: '🇺🇸', price: 480.00, changePercent: 0.4, risk: 2, description: "500 biggest US companies.", whyMoved: "America is doing okay today." },
    { symbol: 'QQQ', name: 'Nasdaq', category: 'etf', mascot: '💻', price: 410.00, changePercent: 0.9, risk: 3, description: "Tech heavy top 100.", whyMoved: "Tech bros are optimizing things." },
    { symbol: 'VT', name: 'Total World', category: 'etf', mascot: '🌍', price: 105.00, changePercent: 0.1, risk: 1, description: "Every stock on Earth.", whyMoved: "Earth is still spinning." },

    // CRYPTO (Risk 10)
    { symbol: 'BTC', name: 'Bitcoin', category: 'crypto', mascot: '🪙', price: 42000.00, changePercent: 8.5, risk: 10, description: "Digital gold?", whyMoved: "CEO of Bitcoin... wait, there isn't one." },
    { symbol: 'ETH', name: 'Ethereum', category: 'crypto', mascot: '💎', price: 2300.00, changePercent: 6.2, risk: 9, description: "Programmable money.", whyMoved: "Gas fees are higher than rent." }
];

export const SHOP_ITEMS: ShopItem[] = [
    { id: 'item_freeze', name: 'Streak Freeze', emoji: '🧊', cost: 500, category: 'powerup', description: 'Miss a day without losing your streak.', limitedTime: false },
    { id: 'item_boost_2x', name: '2x XP Booster', emoji: '⚡', cost: 1200, category: 'powerup', description: 'Double XP for 24 hours', limitedTime: true },
    { id: 'item_pet_lambo', name: 'Golden Lambo', emoji: '🏎️', cost: 5000, category: 'pet', description: 'Flex on them haters', limitedTime: true },
    { id: 'item_pet_doge', name: 'Doge', emoji: '🐕', cost: 800, category: 'pet', description: 'Much wow. Such finance.' },
    { id: 'item_outfit_suit', name: 'CEO Suit', emoji: '👔', cost: 1500, category: 'outfit', description: 'Dress for the job you want.' },
];

// --- Logic ---

export const getXpForNextLevel = (level: number) => {
    return 100 * Math.pow(level, 2);
};

// CHALLENGE ENGINE 2.0
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

// STREAK LOGIC 2.0
export const checkStreak = (user: UserState): { updatedUser: UserState, savedByFreeze: boolean, broken: boolean } => {
    const today = new Date().toISOString().split('T')[0];
    
    // Ensure valid date string, fallback if Firestore timestamp issue
    const lastActiveDate = new Date(user.streakLastDate || new Date());
    const lastActive = lastActiveDate.toISOString().split('T')[0];
    
    // Already active today
    if (today === lastActive) {
        return { updatedUser: user, savedByFreeze: false, broken: false };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Streak continues
    if (lastActive === yesterdayStr) {
        return { 
            updatedUser: { ...user, streak: user.streak + 1, streakLastDate: new Date().toISOString() }, 
            savedByFreeze: false, 
            broken: false 
        };
    }

    // Streak Broken - Check Mercy
    if (user.streakFreezes > 0) {
        return {
            updatedUser: { 
                ...user, 
                streakFreezes: user.streakFreezes - 1, 
                streakLastDate: new Date().toISOString() // Keep streak alive
            },
            savedByFreeze: true,
            broken: false
        };
    }

    // Streak Lost
    return {
        updatedUser: { ...user, streak: 1, streakLastDate: new Date().toISOString() },
        savedByFreeze: false, 
        broken: true
    };
};

export const getMockLeaderboard = (): LeaderboardEntry[] => [
    { rank: 1, name: "Elon Tusk", xp: 99000, avatar: "🚀", country: "Mars" },
    { rank: 2, name: "Jeff Bazookas", xp: 85000, avatar: "📦", country: "USA" },
    { rank: 3, name: "CryptoKing99", xp: 72000, avatar: "💎", country: "UK" },
    { rank: 4, name: "DiamondHands", xp: 68000, avatar: "🦍", country: "WSB" },
    { rank: 5, name: "Satoshi", xp: 60000, avatar: "🤐", country: "JP" },
];

// --- Helpers for Zoo ---

export const generateStockHistory = (stock: Stock, days: number = 30) => {
    const data = [];
    let currentPrice = stock.price;
    // Reverse engineer history based on current price
    for (let i = 0; i < days; i++) {
        data.unshift(currentPrice);
        // Random walk backwards
        const volatility = stock.risk * 0.01; // Higher risk = more volatility
        const change = 1 + (Math.random() * volatility * 2 - volatility);
        currentPrice = currentPrice / change;
    }
    return data;
};

export const calculateRiskScore = (portfolio: Portfolio): number => {
    let totalValue = portfolio.cash;
    let weightedRisk = 0;

    Object.entries(portfolio.holdings).forEach(([symbol, qty]) => {
        const stock = STOCK_UNIVERSE.find(s => s.symbol === symbol);
        if (stock && qty > 0) {
            const value = stock.price * qty;
            totalValue += value;
            weightedRisk += value * stock.risk;
        }
    });
    
    // Base case if mostly cash
    if (totalValue === portfolio.cash) return 1;

    return Math.round(weightedRisk / (totalValue - portfolio.cash));
};

export const createInitialUser = (onboardingData: any): UserState => {
    return {
        nickname: onboardingData.nickname,
        avatar: onboardingData.avatar,
        level: 1, // Reset to 1 for real accounts
        xp: onboardingData.xp || 500, // Bonus included
        coins: 500,
        subscriptionStatus: 'free',
        referralCount: 0,
        
        streak: 1,
        streakLastDate: new Date().toISOString(),
        streakFreezes: 1, // Start with one mercy

        dailyChallenges: generateDailyChallenges(),
        lastChallengeDate: new Date().toISOString(),

        completedLevels: [],
        masteredWorlds: [],
        inventory: [],
        knowledgeGems: [],
        joinedAt: new Date().toISOString(),
        portfolio: {
            cash: 100000,
            holdings: {},
            transactions: [],
            history: [{ date: new Date().toISOString(), netWorth: 100000 }]
        },
        friends: []
    };
};
