/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MicroLesson {
    id: string;
    type: 'swipe' | 'drag_drop' | 'tap_lie' | 'meme' | 'video' | 'calculator' | 'stock_sim' | 'story' | 'info';
    title: string;
    content: any; // Structure depends on type
    xpReward: number;
}

export interface BossQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface GameLevel {
    id: string; // Format: worldId_levelNumber
    title: string;
    description: string;
    lessons: MicroLesson[];
    bossQuiz: BossQuestion[];
    bossName: string;
    rewards: { xp: number; coins: number; badge?: string };
}

// --- MICRO-EXPLAINER DICTIONARY ---
// When these words appear in text, they become tappable "Knowledge Gems"
export const KNOWLEDGE_GEMS: Record<string, { title: string; video?: string; text: string; emoji: string }> = {
    "Inflation": {
        title: "Inflation",
        emoji: "🎈",
        text: "Imagine your favorite pizza costs $10 today. Next year, it's $10.50. That's inflation! Your money buys slightly less stuff over time.",
    },
    "Compound Interest": {
        title: "Compound Interest",
        emoji: "❄️",
        text: "It's like a snowball rolling down a hill. You earn interest on your money, AND interest on your interest. It gets huge!",
    },
    "Diversification": {
        title: "Diversification",
        emoji: "🧺",
        text: "Don't put all your eggs in one basket! If you drop the basket, you lose everything. Spread your money out to stay safe.",
    },
    "Asset": {
        title: "Asset",
        emoji: "💰",
        text: "Anything that puts money IN your pocket (like stocks or a rental house).",
    },
    "Liability": {
        title: "Liability",
        emoji: "💸",
        text: "Anything that takes money OUT of your pocket (like a fancy car that loses value).",
    },
    "Opportunity Cost": {
        title: "Opportunity Cost",
        emoji: "🤔",
        text: "What you give up when you choose something. Buying a $50 game means giving up $50 that could have grown to $500.",
    }
};

// --- CONTENT DATA ---

const WORLD_1_LEVELS: GameLevel[] = [
    {
        id: 'basics_1',
        title: "Money vs. Barter",
        description: "Why we don't pay in chickens anymore.",
        bossName: "The Barter Barbarian",
        rewards: { xp: 500, coins: 200 },
        lessons: [
            {
                id: 'l1_swipe',
                type: 'swipe',
                title: "Trade or Fade?",
                xpReward: 50,
                content: {
                    cards: [
                        { text: "Trading a cow for 500 eggs", isRight: true, label: "Inconvenient (Barter)" },
                        { text: "Using a $20 bill", isRight: false, label: "Convenient (Money)" },
                        { text: "Carrying 50 gold bars to the store", isRight: true, label: "Inconvenient" },
                    ]
                }
            },
            {
                id: 'l1_meme',
                type: 'meme',
                title: "Why Money Wins",
                xpReward: 50,
                content: {
                    imageUrl: "https://i.imgflip.com/1ur9b0.jpg", // Placeholder meme
                    topText: "TRYING TO BUY A PS5",
                    bottomText: "BUT THE STORE ONLY ACCEPTS GOATS",
                    explanation: "Money is a 'Medium of Exchange'. It solves the problem of needing to carry goats around."
                }
            },
            {
                id: 'l1_info',
                type: 'info',
                title: "The 3 Rules of Money",
                xpReward: 50,
                content: {
                    text: "Money must be: \n1. **Store of Value** (It doesn't rot like a banana)\n2. **Unit of Account** (We can measure price with it)\n3. **Medium of Exchange** (Everyone accepts it)"
                }
            }
        ],
        bossQuiz: [
            { question: "Why did humans stop using barter?", options: ["It was too efficient", "Carrying cows is hard", "Gold looked cooler", "Aliens told us to"], correctIndex: 1, explanation: "Barter relies on 'Double Coincidence of Wants'. Money fixes that." },
            { question: "Which is a store of value?", options: ["A banana", "Ice cream", "A Gold Coin", "A tweet"], correctIndex: 2, explanation: "Gold lasts forever. Bananas rot." },
            { question: "What gives fiat money (paper cash) value?", options: ["Government trust", "It's made of gold", "Magic spells", "Nothing"], correctIndex: 0, explanation: "Fiat money is valuable because the government says it is and we trust them." }
        ]
    },
    {
        id: 'basics_2',
        title: "The Inflation Monster",
        description: "Why your candy costs more now.",
        bossName: "Inflata-Bloat",
        rewards: { xp: 600, coins: 250 },
        lessons: [
            {
                id: 'l2_video',
                type: 'video',
                title: "The Pizza Problem",
                xpReward: 50,
                content: {
                    animation: 'inflation',
                    text: "In 1980, a slice was $0.50. Now it's $3.00. Did the pizza get bigger? No. The money got weaker. That's **Inflation**."
                }
            },
            {
                id: 'l2_calc',
                type: 'calculator',
                title: "Time Machine Wallet",
                xpReward: 100,
                content: {
                    type: 'inflation',
                    label: "See how much $100 is worth in 20 years at 3% inflation."
                }
            }
        ],
        bossQuiz: [
            { question: "What is inflation?", options: ["Prices going down", "Prices going up", "Getting richer", "Free money"], correctIndex: 1, explanation: "Inflation is the general increase in prices over time." },
            { question: "If inflation is 10%, what happens to your savings?", options: ["They grow", "They lose buying power", "Nothing", "They double"], correctIndex: 1, explanation: "Your money buys 10% less stuff." }
        ]
    }
];

// ... (We would populate other worlds similarly) ...
// For brevity in this file, I'll mock the structure for the other levels but ensure they work.

const createMockLevel = (id: string, title: string): GameLevel => ({
    id,
    title,
    description: "Locked and loaded with knowledge.",
    bossName: "Generic Boss",
    rewards: { xp: 500, coins: 200 },
    lessons: [
        { id: `${id}_1`, type: 'meme', title: 'Meme Intro', xpReward: 50, content: { topText: "FINANCE", bottomText: "IS EASY", explanation: "Just kidding, but we make it easier.", imageUrl: "https://i.imgflip.com/1g8my4.jpg" } },
        { id: `${id}_2`, type: 'info', title: 'The Concept', xpReward: 50, content: { text: "This is a placeholder for **Compound Interest** or similar concepts." } }
    ],
    bossQuiz: [
        { question: "Is this a placeholder?", options: ["Yes", "No"], correctIndex: 0, explanation: "Yes it is." }
    ]
});

// Populating World Data
export const GET_WORLD_LEVELS = (worldId: string): GameLevel[] => {
    if (worldId === 'basics') return [...WORLD_1_LEVELS, ...Array(6).fill(null).map((_, i) => createMockLevel(`basics_${i+3}`, `Level ${i+3}`))];
    
    if (worldId === 'budget') return Array(8).fill(null).map((_, i) => createMockLevel(`budget_${i+1}`, `Budget Level ${i+1}`));
    
    return Array(8).fill(null).map((_, i) => createMockLevel(`${worldId}_${i+1}`, `Level ${i+1}`));
};