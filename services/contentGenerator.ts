
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData, BossQuestion, LessonType } from './gamification';

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

// --- FINAL CONTENT PACK DATA (IMPORTED FROM JSON) ---
const STATIC_LESSONS: Record<string, any> = {
    // World 1 Level 1
    "w1l1_01": {"id":"w1l1_01","world":"world1","level":1,"type":"swipe","title":"Food or Skin?","content":{"question":"Need or Want?","left":"Food","right":"Fortnite Skin","correct":"left","text":"Skin can wait. Hunger hits different 😤"},"xp":150,"coins":100},
    "w1l1_02": {"id":"w1l1_02","world":"world1","level":1,"type":"tap_lie","title":"Tap the LIE","content":{"options":["Money grows on trees","Inflation exists","Banks are your friend","Savings matter"],"correct":0,"text":"Parents lied about the tree part 💀"},"xp":200,"coins":120},
    "w1l1_03": {"id":"w1l1_03","world":"world1","level":1,"type":"meme","title":"Drake on Money","content":{"caption":"Rejecting savings → Chasing TikTok trends","text":"Save first, scroll second.","imageUrl": "https://i.imgflip.com/30b1gx.jpg"},"xp":180,"coins":110},
    "w1l1_04": {"id":"w1l1_04","world":"world1","level":1,"type":"calculator","title":"$10 Allowance Magic","content":{"question":"$10/month at 8% from 14 → 18 = ?","answer":720,"text":"$720 from lunch money. Prom paid for.","label":"Allowance investing"},"xp":220,"coins":130},
    "w1l1_05": {"id":"w1l1_05","world":"world1","level":1,"type":"info","title":"Inflation Sneak Attack","content":{"text":"Your $10 boba was $5 in 2020. Blame inflation 🥷"},"xp":140,"coins":90},
    "w1l1_06": {"id":"w1l1_06","world":"world1","level":1,"type":"poll","title":"What is money?","content":{"options":["Paper that buys stuff","Evil","Magic","Your parents’ problem"],"correct":0,"text":"It’s paper… until compound interest turns it into a Lambo fund 🤡"},"xp":160,"coins":105},
    
    // World 1 Level 2
    "w1l2_01": {"id":"w1l2_01","world":"world1","level":2,"type":"swipe","title":"AirPods or Rent?","content":{"question":"Need or Want?","left":"Rent","right":"AirPods Pro 2","correct":"left","text":"Flex later, have a roof first 😂"},"xp":170,"coins":110},
    "w1l2_02": {"id":"w1l2_02","world":"world1","level":2,"type":"tap_lie","title":"Tap the LIE","content":{"options":["Credit cards are free money","Debit cards are safer","Interest exists","FDIC protects you"],"correct":0,"text":"Free money? That’s how you get broke 💀"},"xp":210,"coins":130},
    "w1l2_03": {"id":"w1l2_03","world":"world1","level":2,"type":"meme","title":"SpongeBob on Allowance","content":{"caption":"Me watching my allowance burn on DoorDash","text":"Every $15 order = future you crying"},"xp":190,"coins":115},
    "w1l2_04": {"id":"w1l2_04","world":"world1","level":2,"type":"calculator","title":"$5/week from 14 → 18","content":{"question":"$5/week at 8% = ?","answer":1350,"text":"That’s a PS5 from chores"},"xp":230,"coins":140},
    "w1l2_05": {"id":"w1l2_05","world":"world1","level":2,"type":"info","title":"Your parents lied","content":{"text":"Money doesn’t grow on trees… but compound interest kinda does 🌱"},"xp":150,"coins":100},
    "w1l2_06": {"id":"w1l2_06","world":"world1","level":2,"type":"scenario","title":"Friend wants $20","content":{"question":"Lend it or nah?","correct":"Think twice","text":"Helping is cool, but your emergency fund comes first"},"xp":200,"coins":130},

    // World 1 Level 3
    "w1l3_01": {"id":"w1l3_01","world":"world1","level":3,"type":"swipe","title":"Boba or Books?","content":{"question":"Need or Want?","left":"Textbooks","right":"$12 boba","correct":"left","text":"Boba hits different… but failing class hits harder"},"xp":180,"coins":115},
    "w1l3_02": {"id":"w1l3_02","world":"world1","level":3,"type":"tap_lie","title":"Tap the LIE","content":{"options":["Inflation is fake","Your $10 was worth more 5 years ago","Prices only go down","Money printer go brrr"],"correct":0,"text":"Your boba used to be $5 😭 Inflation is real"},"xp":220,"coins":140},
    "w1l3_03": {"id":"w1l3_03","world":"world1","level":3,"type":"meme","title":"This Is Fine","content":{"caption":"My bank account during Shein sale","text":"Everything is fine. Totally fine."},"xp":200,"coins":125},
    "w1l3_04": {"id":"w1l3_04","world":"world1","level":3,"type":"calculator","title":"$20/week from 14 → 18","content":{"question":"$20/week at 8% = ?","answer":4500,"text":"That’s a used car from chores"},"xp":250,"coins":160},
    "w1l3_05": {"id":"w1l3_05","world":"world1","level":3,"type":"info","title":"The Silent Thief","content":{"text":"Inflation = your money slowly disappearing. That’s why your $5 Roblox card now costs $10"},"xp":160,"coins":100},
    "w1l3_06": {"id":"w1l3_06","world":"world1","level":3,"type":"scenario","title":"Found $50 on ground","content":{"question":"Keep it or turn in?","correct":"Your call","text":"No one’s watching… but karma is 😏"},"xp":210,"coins":135},

    // World 1 Level 4
    "w1l4_01": {"id":"w1l4_01","world":"world1","level":4,"type":"drag_drop","title":"Needs vs Wants Sort","content":{"items":[{"id":"1","text":"Rent","category":"Needs"},{"id":"2","text":"Stanley cup","category":"Wants"},{"id":"3","text":"Netflix","category":"Wants"},{"id":"4","text":"Emergency fund","category":"Needs"}],"buckets":["Needs","Wants"],"text":"That hoodie was cute… but rent is cuter"},"xp":260,"coins":170},
    "w1l4_02": {"id":"w1l4_02","world":"world1","level":4,"type":"tap_lie","title":"Tap the LIE","content":{"options":["Compound interest is magic","Interest only helps banks","Saving $5/week matters","You need $1M to start investing"],"correct":3,"text":"You can start with $5. Facts."},"xp":230,"coins":145},
    "w1l4_03": {"id":"w1l4_03","world":"world1","level":4,"type":"meme","title":"Expanding Brain","content":{"caption":"Savings at 0.01% → Ally at 5% → Index funds at 10% → Roth IRA at 16","text":"Big brain energy"},"xp":210,"coins":130},
    "w1l4_04": {"id":"w1l4_04","world":"world1","level":4,"type":"calculator","title":"$50/month from 16 → 65","content":{"question":"At 8% return = ?","answer":838000,"text":"Almost a million from allowance. You’re welcome 🚀"},"xp":400,"coins":300},
    "w1l4_05": {"id":"w1l4_05","world":"world1","level":4,"type":"fun_fact","title":"Millionaire Secret","content":{"text":"Most millionaires drive Toyotas, not Lambos. The real flex is being smart with money"},"xp":180,"coins":110},
    "w1l4_06": {"id":"w1l4_06","world":"world1","level":4,"type":"poll","title":"First big purchase?","content":{"options":["PS5","Car","Invest it","Clothes"],"correct":2,"text":"Investing early = biggest W"},"xp":200,"coins":125},
};

const BOSSES: Record<string, { name: string; trashTalk: string[]; xp: number; coins: number; img: string }> = {
    "world1": { name: "Allowance Goblin", trashTalk: ["Hand over the $20!", "Your skins won’t save you"], xp: 3000, coins: 1500, img: "👺" },
    "world2": { name: "Black Friday Beast", trashTalk: ["One click buy?", "Your wallet just screamed"], xp: 7000, coins: 5000, img: "🛍️" },
    "world3": { name: "Time Wizard", trashTalk: ["You started too late!", "Compound interest is MY magic!"], xp: 10000, coins: 7000, img: "⏳" },
    "world4": { name: "The Fee Collector", trashTalk: ["Overdraft fees incoming!", "I eat minimum balances!"], xp: 8000, coins: 6000, img: "🧛" },
    "world5": { name: "Credit Card Kraken", trashTalk: ["29% interest tastes like freedom", "Minimum payment = forever payment"], xp: 12000, coins: 9000, img: "🐙" },
    "world6": { name: "Taxman Titan", trashTalk: ["Gross pay? I only care about NET!", "W-2 or jail!"], xp: 11000, coins: 8500, img: "🕴️" },
    "world7": { name: "Index Fund Angel", trashTalk: ["Boring = rich", "YOLO = broke"], xp: 15000, coins: 12000, img: "🐂" },
    "world8": { name: "Retirement Reaper", trashTalk: ["No Roth IRA?", "I’m coming for you at 65"], xp: 25000, coins: 20000, img: "💀" }
};

const FUN_FACTS = [
    "$100/month from age 16 at 8% = $1M+ by 65. Lunch money = house fund!",
    "Millionaires drive Toyotas, not Lambos. Flex smart.",
    "Roth IRA = government pays you to get rich.",
    "Index funds beat 90% of pro investors. Copy the smart kids.",
    "Jeff Bezos was 35 when he became a millionaire — you’re already ahead.",
    "Inflation eats 3% of your money's value every year on average.",
    "The first credit card was invented because a guy forgot his wallet at dinner.",
    "Compound interest is the 8th wonder of the world. He who understands it, earns it."
];

const ROASTS = [
    "Your wallet just filed a restraining order 💀",
    "That answer cost you a fictional Lambo 📉",
    "Financial Advisor has left the chat ✌️",
    "Bro, did you learn finance from TikTok? 😂",
    "Oof. The debt collectors are calling 📞",
    "My calculator just exploded 💥",
    "Plot twist: That was the broke option 🤡"
];

// --- GENERATOR LOGIC ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    const levelId = `${worldId}_l${levelNum}`;
    const rng = new SeededRNG(levelId);
    
    // 1. BOSS GENERATION
    const bossData = BOSSES[worldId] || BOSSES["world1"];
    
    const level: LevelData = {
        id: levelId,
        worldId,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${bossData.name}`,
        description: "Defeat the boss to advance!",
        bossName: bossData.name,
        bossImage: bossData.img,
        bossIntro: rng.pick(bossData.trashTalk),
        bossQuiz: [
            { question: "What creates wealth?", options: ["Spending", "Investing", "Saving"], correctIndex: 1, explanation: "Assets create wealth." },
            { question: "Inflation does what?", options: ["Increases value", "Decreases value", "Nothing"], correctIndex: 1, explanation: "Your money buys less." },
            { question: "Best friend of investing?", options: ["Time", "Money", "Luck"], correctIndex: 0, explanation: "Compound interest needs time." }
        ]
    };

    // 2. LESSON GENERATION
    const lessons: Lesson[] = [];
    
    // If we have static lessons defined for this specific level in the Final Pack, use them.
    // We check for indices 01 through 06 (standard pack size)
    const staticKeys = [1,2,3,4,5,6].map(i => `${worldId.replace('world','w')}l${levelNum}_0${i}`);
    const hasStaticContent = staticKeys.some(k => STATIC_LESSONS[k]);

    if (hasStaticContent) {
        staticKeys.forEach((key, index) => {
            const staticLesson = STATIC_LESSONS[key];
            if (staticLesson) {
                lessons.push({
                    ...staticLesson,
                    id: `${levelId}_${index}`,
                    worldId,
                    levelId,
                    order: index,
                    content: {
                        ...staticLesson.content,
                        // Standardize field names for the UI components
                        cards: staticLesson.type === 'swipe' ? [
                            { text: staticLesson.content.left, isRight: false, label: 'Left' },
                            { text: staticLesson.content.right, isRight: true, label: 'Right' }
                        ] : undefined,
                        statements: staticLesson.type === 'tap_lie' ? staticLesson.content.options.map((opt: string, i: number) => ({
                             text: opt, isLie: i === staticLesson.content.correct
                        })) : undefined
                    }
                });
            }
        });
    } else {
        // Fallback Generator for levels 5-8 not explicitly in snippet
        for (let i = 0; i < 6; i++) {
             const types: LessonType[] = ['info', 'swipe', 'meme', 'fun_fact', 'calculator', 'scenario'];
             const type = types[i % types.length];
             lessons.push({
                 id: `${levelId}_gen_${i}`,
                 worldId,
                 levelId,
                 order: i,
                 type,
                 title: `Lesson ${i+1}: Wealth Building`,
                 xpReward: 100,
                 coinReward: 50,
                 content: {
                     text: "Money is a tool. Use it wisely.",
                     cards: [{text: "Spend", isRight: false, label: "Bad"}, {text: "Invest", isRight: true, label: "Good"}],
                     imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
                     topText: "ME SAVING",
                     bottomText: "$1 DOLLAR",
                     factSource: "Common Sense"
                 }
             });
        }
    }

    return { level, lessons };
};

export const getRandomRoast = () => {
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};
