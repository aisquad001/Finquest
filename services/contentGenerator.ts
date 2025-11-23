/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData, BossQuestion, LessonType, WORLDS_METADATA } from './gamification';

// --- DETERMINISTIC RNG ---
// Ensures everyone gets the same "random" questions for the same level ID
export class SeededRNG {
    private seed: number;
    constructor(seedStr: string) {
        let h = 0x811c9dc5;
        for (let i = 0; i < seedStr.length; i++) {
            h ^= seedStr.charCodeAt(i);
            h = Math.imul(h, 0x01000193);
        }
        this.seed = h >>> 0;
    }

    next(): number {
        this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
        return this.seed / 4294967296;
    }

    pick<T>(array: T[]): T {
        return array[Math.floor(this.next() * array.length)];
    }
}

// --- BOSS BATTLES DATA ---
const BOSS_BATTLES: Record<string, BossQuestion[]> = {
    "Moola Basics": [
        { question: "Money allows you to...", options: ["Eat dirt", "Trade value", "Fly"], correctIndex: 1, explanation: "It's a medium of exchange." },
        { question: "Before money, people used...", options: ["Telepathy", "Barter", "Internet"], correctIndex: 1, explanation: "Trading goods for goods." },
        { question: "The double coincidence of wants is a problem with...", options: ["Cash", "Barter", "Credit"], correctIndex: 1, explanation: "You need what I have, I need what you have." },
        { question: "Which is a NEED?", options: ["PS5", "Water", "Gucci"], correctIndex: 1, explanation: "Survival first." },
        { question: "Which is a WANT?", options: ["Shelter", "Netflix", "Medicine"], correctIndex: 1, explanation: "Nice to have, not vital." },
        { question: "Opportunity Cost is...", options: ["The price tag", "What you give up", "Tax"], correctIndex: 1, explanation: "The value of the next best alternative." },
        { question: "Inflation makes money...", options: ["Worth less", "Worth more", "Blue"], correctIndex: 0, explanation: "Purchasing power drops." },
        { question: "Who tracks inflation?", options: ["NASA", "The Fed / BLS", "Burger King"], correctIndex: 1, explanation: "Central banks monitor it." },
        { question: "If bread cost $1 in 1990 and $5 now, that's...", options: ["Deflation", "Inflation", "Magic"], correctIndex: 1, explanation: "Prices rising over time." },
    ],
    // Fallback for other worlds to prevent crashes
    "default": [
        { question: "What is an Asset?", options: ["Puts money in pocket", "Takes money out", "A toy"], correctIndex: 0, explanation: "Assets make you rich." },
        { question: "What is a Liability?", options: ["Makes you money", "Costs you money", "A friend"], correctIndex: 1, explanation: "Liabilities drain your wallet." },
        { question: "Compound Interest is...", options: ["Boring", "Magic math", "A bank fee"], correctIndex: 1, explanation: "Money making money." }
    ]
};

// --- CONTENT DB ---
const CONTENT_DB: Record<string, any> = {
    "Moola Basics": {
        swipes: [
            { q: "Found $20", left: "Save", right: "Spend", correct: "left", text: "Start the E-Fund." },
            { q: "New Phone", left: "Buy Now", right: "Wait 30 Days", correct: "right", text: "Price often drops." },
            { q: "Lend Friend $50?", left: "No", right: "Yes", correct: "left", text: "Don't lend what you can't lose." },
            { q: "Daily Latte", left: "Buy", right: "Make at Home", correct: "right", text: "Saves $1000/yr." }
        ],
        lies: [
            { text: "Money Origins", options: ["Barter came first", "Coins always existed"], correct: 1, exp: "Barter was first." },
            { text: "Inflation", options: ["Prices go down", "Prices go up"], correct: 0, exp: "Inflation raises prices." }
        ],
        math: [
            { q: "$100 + 3% inflation?", a: 103, t: "Cost next year." },
            { q: "Hours to earn $100 at $10/hr?", a: 10, t: "Time is money." }
        ],
        memes: [
            { cap: "Me expecting wealth", text: "Spending $0", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation", text: "$10 is now $5", img: "https://i.imgflip.com/1ur9b0.jpg" }
        ]
    }
};

// --- GENERATOR ---
export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    // 1. Normalize Inputs to handle "Moola Basics" vs "MoolaBasics"
    const cleanInputId = worldId.replace(/\s+/g, '').toLowerCase();
    
    const worldMeta = WORLDS_METADATA.find(w => {
        const cleanId = w.id.replace(/\s+/g, '').toLowerCase();
        const cleanTitle = w.title.replace(/\s+/g, '').toLowerCase();
        return cleanId === cleanInputId || cleanTitle === cleanInputId;
    });
    
    const worldName = worldMeta ? worldMeta.id : "Moola Basics"; 
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;
    
    const rng = new SeededRNG(levelId);
    const worldDB = CONTENT_DB[worldName] || CONTENT_DB["Moola Basics"];

    // 2. Generate Boss
    const bossNames = ["Goblin", "Troll", "Dragon", "Vampire", "Reaper", "Titan", "Golem", "Wizard"];
    const bossName = `${worldName.split(' ')[1] || "Money"} ${bossNames[(levelNum - 1) % bossNames.length]}`;
    
    // Get questions (cyclic)
    const questionsPool = BOSS_BATTLES[worldName] || BOSS_BATTLES["default"];
    const startIndex = ((levelNum - 1) * 3) % questionsPool.length;
    let levelBossQuestions = questionsPool.slice(startIndex, startIndex + 3);
    
    // Fill if not enough
    if (levelBossQuestions.length < 3) {
        levelBossQuestions = [...levelBossQuestions, ...questionsPool.slice(0, 3 - levelBossQuestions.length)];
    }

    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: The ${bossName}`,
        description: "Defeat the boss to advance!",
        bossName: bossName,
        bossImage: ["👺", "👹", "👻", "👽", "🤖", "👾", "💀", "🤡"][(levelNum - 1) % 8],
        bossIntro: rng.pick(["I'm here to take your coins!", "You can't budget this!", "Your credit score is mine!"]),
        bossQuiz: levelBossQuestions
    };

    // 3. Generate Lessons
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['swipe', 'tapLie', 'meme', 'calculator', 'poll']; 
    
    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content: any = {};
        let title = "Lesson";

        const pick = (pool: any[]) => pool ? pool[(levelNum + i) % pool.length] : null;

        if (type === 'swipe') {
            const item = pick(worldDB?.swipes) || { q: "Save?", left: "No", right: "Yes", correct: "right", text: "Save." };
            title = "Swipe Right";
            content = { question: item.q, left: item.left, right: item.right, correct: item.correct, text: item.text };
        } else if (type === 'tapLie') {
            const item = pick(worldDB?.lies) || { text: "Lie?", options: ["True", "False"], correct: 1, exp: "False." };
            title = "Spot the Lie";
            content = { text: item.text, statements: item.options.map((opt: string, idx: number) => ({ text: opt, isLie: idx === item.correct })) };
        } else if (type === 'meme') {
            const item = pick(worldDB?.memes) || { cap: "Stonks", text: "Up", img: "" };
            title = "Vibe Check";
            content = { imageUrl: item.img, topText: item.cap, bottomText: item.text };
        } else if (type === 'calculator') {
            const item = pick(worldDB?.math) || { q: "1+1", a: 2, t: "Math." };
            title = "Quick Math";
            content = { label: "Solve", question: item.q, answer: item.a, text: item.t };
        } else {
            title = "Your Vote";
            content = { question: "Save or Spend?", options: ["Save", "Spend"], correct: 0, text: "Saving wins." };
        }

        lessons.push({
            id: lessonId,
            worldId: worldName,
            levelId,
            order: i,
            type,
            title,
            content,
            xpReward: 100,
            coinReward: 50
        });
    });

    return { level, lessons };
};

export const getRandomRoast = () => {
    const ROASTS = [
        "Your wallet just filed a restraining order 💀",
        "Financial Advisor has left the chat ✌️",
        "Bro, did you learn finance from TikTok? 😂",
        "Oof. The debt collectors are calling 📞",
        "My calculator just exploded 💥"
    ];
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};