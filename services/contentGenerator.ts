
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData, BossQuestion, LessonType, WORLDS_METADATA } from './gamification';

// --- DETERMINISTIC RNG ---
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

    pickSubset<T>(array: T[], count: number): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }
}

// --- CONTENT DATABASE (SIMULATING 384 LESSONS) ---
const CONTENT_DB: Record<string, any> = {
    "Moola Basics": {
        swipes: [
            { q: "Lunch money?", left: "Buy skin", right: "Buy food", correct: "right", text: "You can't eat pixels." },
            { q: "Found $20", left: "Save it", right: "Spend it", correct: "left", text: "Emergency fund starts now." },
            { q: "New iPhone drops", left: "Buy immediately", right: "Wait a year", correct: "right", text: "It's the same phone. Save $400." },
            { q: "Grandma gives $100", left: "Invest it", right: "V-Bucks", correct: "left", text: "Compound interest loves Grandma." },
            { q: "Friend asks for loan", left: "Say No", right: "Give it", correct: "left", text: "Don't lend money you can't lose." },
            { q: "Starbucks run", left: "$7 latte", right: "Make coffee", correct: "right", text: "That latte is $2,500/year." },
            { q: "Sale! 50% off", left: "Buy unneeded", right: "Ignore", correct: "right", text: "Spending $50 to save $50 is still spending $50." },
            { q: "Needs vs Wants", left: "Air Jordans", right: "Winter Coat", correct: "right", text: "Don't freeze for the drip." }
        ],
        lies: [
            { text: "Money myths", options: ["Money grows on trees", "Inflation steals value", "Banks are businesses", "Taxes are real"], correct: 0, exp: "Trees don't print cash." },
            { text: "Savings myths", options: ["Rich people save", "You need millions to start", "Time is money", "Compound interest works"], correct: 1, exp: "Start with $1. Seriously." },
            { text: "Banking myths", options: ["Banks keep your cash in a box", "Banks lend your money", "FDIC protects you", "Interest pays you"], correct: 0, exp: "They lend it out! It's not actually in the vault." }
        ],
        memes: [
            { cap: "Me expecting to be rich", text: "Without saving a dollar", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation hitting my wallet", text: "My $10 is now $5", img: "https://i.imgflip.com/1ur9b0.jpg" }
        ],
        math: [
            { q: "$10/mo at 8% for 40 years?", a: 35000, t: "That's a car for skipping one snack." },
            { q: "Inflation at 3%. $100 becomes?", a: 97, t: "You lose money by holding cash." }
        ]
    },
    "Budget Beach": {
        swipes: [
            { q: "50/30/20 Rule", left: "50% Wants", right: "50% Needs", correct: "right", text: "Needs come first. Always." },
            { q: "Paycheck hits", left: "Transfer to Savings", right: "Leave in Checking", correct: "left", text: "Pay yourself first." },
            { q: "Subscription check", left: "Cancel unused", right: "Keep 'em all", correct: "left", text: "You haven't watched Hulu in 6 months." },
            { q: "Grocery shopping", left: "Go hungry", right: "Eat first", correct: "right", text: "Hungry shopping = buying junk." }
        ],
        lies: [
            { text: "Budgeting myths", options: ["Budgets are for poor people", "Budgets equal freedom", "Tracking helps", "Rich people budget"], correct: 0, exp: "The richest people budget the hardest." }
        ],
        memes: [
            { cap: "Checking account: $0.50", text: "Me: I deserve a treat", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        math: [
            { q: "$1000 income. How much for Needs?", a: 500, t: "50% for rent/food." }
        ]
    },
    "Compound Cliffs": {
        swipes: [
            { q: "Start investing?", left: "At 18", right: "At 30", correct: "left", text: "Time is your best friend." },
            { q: "Compound Frequency", left: "Yearly", right: "Daily", correct: "right", text: "More frequent = more money." }
        ],
        lies: [
            { text: "Interest facts", options: ["Simple is better than Compound", "Einstein loved Compound", "Time matters more than amount", "Rate matters"], correct: 0, exp: "Simple interest is for losers. Compound is for winners." }
        ],
        memes: [
            { cap: "Me at 60", text: "Thanks to 18-year-old me", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        math: [
            { q: "Rule of 72. 8% return. Years to double?", a: 9, t: "72 divided by 8 = 9 years." }
        ]
    },
    // ... (We define generic pools for others to simulate the full pack)
};

const GENERIC_SWIPES = [
    { q: "Side Hustle?", left: "Sleep in", right: "Mow lawns", correct: "right", text: "Grind now, chill later." },
    { q: "Credit Card Bill", left: "Minimum Pay", right: "Full Balance", correct: "right", text: "Interest rates are scams. Pay full." },
    { q: "Stock Market drops", left: "Panic Sell", right: "Buy the Dip", correct: "right", text: "Stocks are on sale!" },
    { q: "Tax Return", left: "Party", right: "Invest", correct: "right", text: "Boring answer, rich result." },
    { q: "Car Buying", left: "New Luxury", right: "Used Reliable", correct: "right", text: "Cars lose value fast." }
];

// --- GENERATOR ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    // Normalize World ID
    const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
    const worldName = worldMeta ? worldMeta.id : "Moola Basics"; 
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;
    
    const rng = new SeededRNG(levelId);
    const worldDB = CONTENT_DB[worldName] || {};

    // 1. BOSS GENERATION
    const bossNames = ["Goblin", "Troll", "Dragon", "Vampire", "Reaper", "Titan", "Golem", "Wizard"];
    const bossName = `${worldName.split(' ')[1]} ${bossNames[levelNum - 1] || "Boss"}`;
    
    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: The ${bossName}`,
        description: "Defeat the boss to advance!",
        bossName: bossName,
        bossImage: ["👺", "👹", "👻", "👽", "🤖", "👾", "💀", "🤡"][levelNum - 1],
        bossIntro: rng.pick(["I'm here to take your coins!", "You can't budget this!", "Your credit score is mine!", "Interest rates are rising!"]),
        bossQuiz: [
            { question: "What creates wealth?", options: ["Spending", "Assets", "Liabilities"], correctIndex: 1, explanation: "Assets put money in your pocket." },
            { question: "Inflation means?", options: ["Prices up", "Prices down", "More money"], correctIndex: 0, explanation: "Things cost more over time." },
            { question: "Best time to start?", options: ["Tomorrow", "Never", "Now"], correctIndex: 2, explanation: "Yesterday was better, but today is good." }
        ]
    };

    // 2. LESSON GENERATION (6 Unique Lessons)
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['swipe', 'tapLie', 'meme', 'calculator', 'info', 'poll']; // Fixed order for variety
    
    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content: any = {};
        let title = "Lesson";
        let xp = 100 + (i * 20);
        let coins = 50 + (i * 10);

        // PULL FROM DB OR FALLBACK
        if (type === 'swipe') {
            const pool = [...(worldDB.swipes || []), ...GENERIC_SWIPES];
            const item = pool[Math.abs(rng.next() * pool.length) | 0];
            title = item.q;
            content = {
                question: item.q,
                left: item.left,
                right: item.right,
                correct: item.correct,
                text: item.text
            };
        } else if (type === 'tapLie') {
            const pool = worldDB.lies || [{text: "General Lie", options: ["Sky is green", "Water is wet"], correct: 0, exp: "Obvious."}];
            const item = pool[Math.abs(rng.next() * pool.length) | 0];
            title = "Spot the Fake";
            content = {
                text: item.text,
                statements: item.options.map((opt: string, idx: number) => ({ text: opt, isLie: idx === item.correct }))
            };
        } else if (type === 'meme') {
            const pool = worldDB.memes || [{cap: "Stonks", text: "Up only", img: "https://i.imgflip.com/30b1gx.jpg"}];
            const item = pool[Math.abs(rng.next() * pool.length) | 0];
            title = "Vibe Check";
            content = { imageUrl: item.img, topText: item.cap, bottomText: item.text, caption: "Meme Logic" };
        } else if (type === 'calculator') {
            const pool = worldDB.math || [{q: "1 + 1?", a: 2, t: "Basic math."}];
            const item = pool[Math.abs(rng.next() * pool.length) | 0];
            title = "Quick Math";
            content = { label: "Solve", question: item.q, answer: item.a, text: item.t };
        } else {
            title = "Knowledge Drop";
            content = { text: `Tip regarding ${worldName}: Master the basics to rule the game.` };
        }

        lessons.push({
            id: lessonId,
            worldId: worldName,
            levelId,
            order: i,
            type,
            title,
            content,
            xpReward: xp,
            coinReward: coins
        });
    });

    return { level, lessons };
};

export const getRandomRoast = () => {
    const ROASTS = [
        "Your wallet just filed a restraining order 💀",
        "That answer cost you a fictional Lambo 📉",
        "Financial Advisor has left the chat ✌️",
        "Bro, did you learn finance from TikTok? 😂",
        "Oof. The debt collectors are calling 📞",
        "My calculator just exploded 💥",
        "Plot twist: That was the broke option 🤡"
    ];
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};
