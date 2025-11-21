
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData, BossQuestion, LessonType } from './gamification';

// --- DETERMINISTIC RNG ---
// Ensures that "World 1 Level 1" always generates the same unique content
// for every user, but is different from "World 1 Level 2"
class SeededRNG {
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
        const shuffled = [...array].sort(() => 0.5 - this.next());
        return shuffled.slice(0, count);
    }

    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
}

// --- CONTENT LIBRARIES ---

const BOSS_NAMES: Record<string, string[]> = {
    world1: ["The Inflation Monster", "Dr. Devaluation", "The Cash Burner", "ATM Goblin", "The Shrinkflator", "Zero-Balance Zombie", "The Price Hiker", "Fiat Phantom"],
    world2: ["Budget Beach Bum", "Impulse Buy Kraken", "Subscription Sea Monster", "Prom Night Predator", "The Frappuccino Fiend", "Sale Siren", "One-Click Clicker", "Overdraft Orca"],
    world3: ["Compound Interest Crusher", "The Late Starter", "Savings Saboteur", "The Daily Spender", "Emergency Fund Eater", "Yield Yapper", "The Uninvested", "Cash Drag Dragon"],
    world4: ["Bank Fee Bandit", "Identity Thief", "The Phisher", "Minimum Balance Minotaur", "Direct Deposit Demon", "Overdraft Ogre", "Check Fraud Chimp", "The Uninsured"],
    world5: ["The Credit Demon", "Payday Loan Shark", "Maxed-Out Mummy", "APR Assassin", "Minimum Payment Mantis", "Collection Agent Chaos", "Credit Score Crusher", "Debt Snowball Yeti"],
    world6: ["Taxman Titan", "Side Hustle Hater", "Gross Income Ghoul", "Deduction Destroyer", "Audit Alien", "W-2 Wraith", "The Unpaid Intern", "Gig Economy Gargoyle"],
    world7: ["Meme Stock Casino Dealer", "The Bear Market", "Crypto Casino Pit Boss", "Panic Seller", "FOMO Phantom", "Rug Pull Rex", "Day Trade Dino", "Margin Call Marauder"],
    world8: ["The Retirement Reaper", "Inflation Inquisitor", "Social Security Skeleton", "The 401k Killer", "Estate Tax Evil", "Lifestyle Creep", "Golden Handcuff Golem", "The Unprepared"]
};

const BOSS_EMOJIS: Record<string, string[]> = {
    world1: ["🎈", "📉", "💸", "🏦", "🔥"],
    world2: ["🐙", "🏖️", "☕", "🛍️", "📱"],
    world3: ["❄️", "⏳", "🧱", "🪵", "🐖"],
    world4: ["🔓", "🧛", "🕵️", "🕸️", "🐀"],
    world5: ["👹", "🦈", "💳", "⛓️", "🩸"],
    world6: ["👨‍💼", "🧛‍♂️", "📝", "🔨", "💼"],
    world7: ["🎰", "🐻", "📉", "🚽", "🤡"],
    world8: ["💀", "🕰️", "📉", "🏚️", "🕯️"]
};

const BOSS_TRASH_TALK: Record<string, string[]> = {
    world1: ["Your dollar is worth nothing here!", "I eat purchasing power for breakfast!", "Try saving now, loser!", "Prices just went up 10%!", "Money is an illusion!"],
    world2: ["But it's on sale!", "Treat yourself... to poverty!", "You NEED that $8 coffee!", "Budgeting is for nerds!", "One more swipe won't hurt!"],
    world3: ["Time is running out!", "0.01% interest is plenty!", "Why save when you can spend?", "Future you can deal with being broke!", "Compound interest is a myth!"],
    world4: ["I see your password is 'password123'!", "Your identity is mine!", "Monthly maintenance fees engaged!", "Where's your FDIC insurance now?", "Account frozen!"],
    world5: ["29% APR activates now!", "Minimum payments forever!", "Your credit score is dropping!", "I own your future income!", "You can't escape the compound debt!"],
    world6: ["The IRS is watching!", "That's not a deductible!", "Work harder, earn less!", "Taxes take half!", "Your side hustle is a joke!"],
    world7: ["Buy high, sell low!", "It's going to the moon, trust me!", "Rug pull incoming!", "Diamond hands? More like paper hands!", "This isn't investment, it's a casino!"],
    world8: ["You'll work until you're 90!", "Social Security is empty!", "Inflation ate your nest egg!", "Too late to start now!", "Welcome to the poor house!"]
};

// Templates for lesson content to ensure variety
const SCENARIOS = [
    { text: "Spending $50 on Doordash", isRight: false, label: "L" },
    { text: "Cooking at home", isRight: true, label: "W" },
    { text: "Buying V-Bucks on sale", isRight: false, label: "Bait" },
    { text: "Investing birthday money", isRight: true, label: "Smart" },
    { text: "Lending money to a broke friend", isRight: false, label: "Gone" },
    { text: "Using a student discount", isRight: true, label: "Hack" },
    { text: "Buying brand new textbooks", isRight: false, label: "Ripoff" },
    { text: "Renting textbooks", isRight: true, label: "Savvy" },
    { text: "Impulse buying at 2AM", isRight: false, label: "Regret" },
    { text: "Waiting 24h before buying", isRight: true, label: "Control" }
];

const MEME_TEMPLATES = [
    { url: "https://i.imgflip.com/1ur9b0.jpg", top: "ME CHECKING BANK ACCOUNT", bottom: "AFTER THE WEEKEND" },
    { url: "https://i.imgflip.com/4t0m5.jpg", top: "ME EXPLAINING STOCKS", bottom: "TO MY MOM" },
    { url: "https://i.imgflip.com/2wifvo.jpg", top: "USING CREDIT CARD", bottom: "FUTURE ME'S PROBLEM" },
    { url: "https://i.imgflip.com/26am.jpg", top: "WAITING FOR PAYDAY", bottom: "LIKE..." },
    { url: "https://i.imgflip.com/1jwhww.jpg", top: "WHEN THE DIP", bottom: "KEEPS DIPPING" }
];

// --- GENERATION LOGIC ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    const levelId = `${worldId}_l${levelNum}`;
    const rng = new SeededRNG(levelId);

    // 1. BOSS GENERATION
    // Pick a unique boss name for this world/level combo
    const worldBossNames = BOSS_NAMES[worldId] || BOSS_NAMES['world1'];
    const bossName = worldBossNames[(levelNum - 1) % worldBossNames.length]; // Cycle through names deterministically
    
    const worldBossEmojis = BOSS_EMOJIS[worldId] || BOSS_EMOJIS['world1'];
    const bossImage = rng.pick(worldBossEmojis);

    const worldTrashTalk = BOSS_TRASH_TALK[worldId] || BOSS_TRASH_TALK['world1'];
    const bossIntro = rng.pick(worldTrashTalk);

    // Generate Boss Quiz
    const bossQuiz: BossQuestion[] = [];
    for (let i = 0; i < 5; i++) { // 5 Questions per boss
        bossQuiz.push({
            question: generateBossQuestion(worldId, rng),
            options: ["Yes", "No", "Maybe"],
            correctIndex: rng.int(0, 2),
            explanation: "Financial wisdom goes here." // Placeholder for brevity, in real app would be mapped
        });
    }

    const level: LevelData = {
        id: levelId,
        worldId,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${bossName}`,
        description: `Defeat ${bossName} to advance!`,
        bossName,
        bossImage,
        bossIntro,
        bossQuiz
    };

    // 2. LESSON GENERATION
    const lessons: Lesson[] = [];
    const lessonTypes: LessonType[] = ['swipe', 'meme', 'tap_lie', 'drag_drop', 'calculator', 'info'];
    
    // Shuffle types for this level so order is unique
    const shuffledTypes = [...lessonTypes].sort(() => 0.5 - rng.next());

    for (let i = 0; i < 6; i++) {
        const type = shuffledTypes[i % shuffledTypes.length];
        const popularity = (rng.next() * 30 + 5).toFixed(1) + "k";
        
        lessons.push({
            id: `${levelId}_les${i}`,
            worldId,
            levelId,
            order: i,
            type,
            title: generateLessonTitle(type, rng),
            xpReward: 100 + (i * 10),
            coinReward: 50 + (i * 5),
            popularity,
            content: generateLessonContent(type, worldId, rng)
        });
    }

    return { level, lessons };
};

// --- CONTENT HELPERS ---

const generateBossQuestion = (worldId: string, rng: SeededRNG): string => {
    const templates = [
        "Is this a smart money move?",
        "Should you buy this?",
        "Will this make you rich?",
        "Is this inflation?",
        "Does this lower your credit score?"
    ];
    return rng.pick(templates);
};

const generateLessonTitle = (type: LessonType, rng: SeededRNG): string => {
    const titles = {
        swipe: ["Swipe the Truth", "Left or Right?", "Pick the Winner", "Decision Time"],
        meme: ["Vibe Check", "Meme Review", "Reality Check", "True Story"],
        tap_lie: ["Spot the Cap", "Find the Lie", "Truth Bomb", "Fact or Fiction"],
        drag_drop: ["Sort It Out", "Bucket Challenge", "Organize Your Life", "Money Flow"],
        calculator: ["Do the Math", "Rich Calculator", "Future You", "Number Crunch"],
        info: ["Knowledge Drop", "Listen Up", "The Secret", "Game Alpha"],
        video: ["Watch This", "Pro Tip", "Visual Proof", "How To"]
    };
    return rng.pick(titles[type] || titles['info']);
};

const generateLessonContent = (type: LessonType, worldId: string, rng: SeededRNG): any => {
    switch (type) {
        case 'swipe':
            return { cards: rng.pickSubset(SCENARIOS, 3) };
        case 'meme':
            const tmpl = rng.pick(MEME_TEMPLATES);
            return { 
                imageUrl: tmpl.url, 
                topText: tmpl.top, 
                bottomText: tmpl.bottom, 
                explanation: "This meme explains why being broke costs money." 
            };
        case 'tap_lie':
            return { 
                statements: [
                    { text: "Credit cards are free money", isLie: true },
                    { text: "Compound interest takes time", isLie: false },
                    { text: "You need a budget", isLie: false }
                ].sort(() => 0.5 - rng.next()) 
            };
        case 'calculator':
            const amount = rng.pick([50, 100, 200, 500]);
            return { 
                label: `If you invest $${amount}/mo...`, 
                formula: "auto", 
                resultLabel: "You'll be a millionaire." 
            };
        default:
            return { text: "Financial literacy is the meta. **Compound Interest** is OP. Don't get rugged by **Inflation**." };
    }
};
