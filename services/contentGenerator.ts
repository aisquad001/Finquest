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

// --- FINAL CONTENT PACK DATA ---
// This variable holds the high-quality manually crafted lessons.
const TEEN_CONTENT_PACK: any = {
  "lessons": [
    {"id":"w1l1_01","world":"Moola Basics","level":1,"type":"swipe","title":"Food or Skin?","content":{"question":"Need or Want?","left":"Food","right":"Fortnite Skin","correct":"left","text":"Skin can wait. Hunger hits different 😤"},"xp":150,"coins":100},
    {"id":"w1l1_02","world":"Moola Basics","level":1,"type":"tapLie","title":"Tap the LIE","content":{"options":["Money grows on trees","Inflation exists","Banks are your friend","Savings matter"],"correct":0,"text":"Parents lied about the tree part 💀"},"xp":200,"coins":120},
    {"id":"w1l1_03","world":"Moola Basics","level":1,"type":"meme","title":"Drake on Money","content":{"caption":"Rejecting savings → Chasing TikTok trends","text":"Save first, scroll second.","imageUrl":"https://i.imgflip.com/30b1gx.jpg"},"xp":180,"coins":110},
    {"id":"w1l1_04","world":"Moola Basics","level":1,"type":"calculator","title":"$10 Allowance Magic","content":{"question":"$10/month at 8% from 14 → 18 = ?","answer":720,"text":"$720 from lunch money. Prom paid for."},"xp":220,"coins":130},
    {"id":"w1l1_05","world":"Moola Basics","level":1,"type":"info","title":"Inflation Sneak Attack","content":{"text":"Your $10 boba was $5 in 2020. Blame inflation 🥷"},"xp":140,"coins":90},
    {"id":"w1l1_06","world":"Moola Basics","level":1,"type":"poll","title":"What is money?","content":{"options":["Paper that buys stuff","Evil","Magic","Your parents’ problem"],"correct":0,"text":"It’s paper… until compound interest turns it into a Lambo fund 🤡"},"xp":160,"coins":105},
    
    {"id":"w1l2_01","world":"Moola Basics","level":2,"type":"swipe","title":"AirPods or Rent?","content":{"question":"Need or Want?","left":"Rent","right":"AirPods Pro 2","correct":"left","text":"Flex later, have a roof first 😂"},"xp":170,"coins":110},
    {"id":"w1l2_02","world":"Moola Basics","level":2,"type":"tapLie","title":"Tap the LIE","content":{"options":["Credit cards are free money","Debit cards are safer","Interest exists","FDIC protects you"],"correct":0,"text":"Free money? That’s how you get broke 💀"},"xp":210,"coins":130},
    {"id":"w1l2_03","world":"Moola Basics","level":2,"type":"meme","title":"SpongeBob on Allowance","content":{"caption":"Me watching my allowance burn on DoorDash","text":"Every $15 order = future you crying","imageUrl":"https://i.imgflip.com/1ur9b0.jpg"},"xp":190,"coins":115},
    {"id":"w1l2_04","world":"Moola Basics","level":2,"type":"calculator","title":"$5/week from 14 → 18","content":{"question":"$5/week at 8% = ?","answer":1350,"text":"That’s a PS5 from chores"},"xp":230,"coins":140},
    {"id":"w1l2_05","world":"Moola Basics","level":2,"type":"info","title":"Your parents lied","content":{"text":"Money doesn’t grow on trees… but compound interest kinda does 🌱"},"xp":150,"coins":100},
    {"id":"w1l2_06","world":"Moola Basics","level":2,"type":"scenario","title":"Friend wants $20","content":{"question":"Lend it or nah?","correct":"Think twice","text":"Helping is cool, but your emergency fund comes first"},"xp":200,"coins":130},

    {"id":"w1l3_01","world":"Moola Basics","level":3,"type":"swipe","title":"Boba or Books?","content":{"question":"Need or Want?","left":"Textbooks","right":"$12 boba","correct":"left","text":"Boba hits different… but failing class hits harder"},"xp":180,"coins":115},
    {"id":"w1l3_02","world":"Moola Basics","level":3,"type":"tapLie","title":"Tap the LIE","content":{"options":["Inflation is fake","Your $10 was worth more 5 years ago","Prices only go down","Money printer go brrr"],"correct":0,"text":"Your boba used to be $5 😭 Inflation is real"},"xp":220,"coins":140},
    {"id":"w1l3_03","world":"Moola Basics","level":3,"type":"meme","title":"This Is Fine","content":{"caption":"My bank account during Shein sale","text":"Everything is fine. Totally fine.","imageUrl":"https://i.imgflip.com/24y43o.jpg"},"xp":200,"coins":125},
    {"id":"w1l3_04","world":"Moola Basics","level":3,"type":"calculator","title":"$20/week from 14 → 18","content":{"question":"$20/week at 8% = ?","answer":4500,"text":"That’s a used car from chores"},"xp":250,"coins":160},
    {"id":"w1l3_05","world":"Moola Basics","level":3,"type":"info","title":"The Silent Thief","content":{"text":"Inflation = your money slowly disappearing. That’s why your $5 Roblox card now costs $10"},"xp":160,"coins":100},
    {"id":"w1l3_06","world":"Moola Basics","level":3,"type":"scenario","title":"Found $50 on ground","content":{"question":"Keep it or turn in?","correct":"Your call","text":"No one’s watching… but karma is 😏"},"xp":210,"coins":135},
    
    {"id":"w1l4_01","world":"Moola Basics","level":4,"type":"drag_drop","title":"Needs vs Wants Sort","content":{"items":["Rent","Stanley cup","Netflix","Emergency fund","Phone bill","New hoodie"],"buckets":["Needs","Wants"],"correct":{"Rent":"Needs","Stanley cup":"Wants","Netflix":"Wants","Emergency fund":"Needs","Phone bill":"Needs","New hoodie":"Wants"},"text":"That hoodie was cute… but rent is cuter"},"xp":260,"coins":170},
    {"id":"w1l4_02","world":"Moola Basics","level":4,"type":"tapLie","title":"Tap the LIE","content":{"options":["Compound interest is magic","Interest only helps banks","Saving $5/week matters","You need $1M to start investing"],"correct":3,"text":"You can start with $5. Facts."},"xp":230,"coins":145},
    {"id":"w1l4_03","world":"Moola Basics","level":4,"type":"meme","title":"Expanding Brain","content":{"caption":"Savings at 0.01% → Ally at 5% → Index funds at 10% → Roth IRA at 16","text":"Big brain energy","imageUrl":"https://i.imgflip.com/1jwhww.jpg"},"xp":210,"coins":130},
    {"id":"w1l4_04","world":"Moola Basics","level":4,"type":"calculator","title":"$50/month from 16 → 65","content":{"question":"At 8% return = ?","answer":838000,"text":"Almost a million from allowance. You’re welcome 🚀"},"xp":400,"coins":300},
    {"id":"w1l4_05","world":"Moola Basics","level":4,"type":"funFact","title":"Millionaire Secret","content":{"text":"Most millionaires drive Toyotas, not Lambos. The real flex is being smart with money"},"xp":180,"coins":110},
    {"id":"w1l4_06","world":"Moola Basics","level":4,"type":"poll","title":"First big purchase?","content":{"options":["PS5","Car","Invest it","Clothes"],"correct":2,"text":"Investing early = biggest W"},"xp":200,"coins":125},
    
    {"id":"w1l5_01","world":"Moola Basics","level":5,"type":"swipe","title":"Prom or Portfolio?","content":{"question":"$800 prom outfit vs invest it","left":"Invest","right":"Prom flex","correct":"left","text":"Future you wants the money more than the memories"},"xp":300,"coins":200},
    {"id":"w1l5_02","world":"Moola Basics","level":5,"type":"meme","title":"Success Kid","content":{"caption":"Started investing at 16 → Millionaire by 60","text":"While everyone else bought V-Bucks","imageUrl":"https://i.imgflip.com/2b7c.jpg"},"xp":220,"coins":140},
    {"id":"w1l5_03","world":"Moola Basics","level":5,"type":"info","title":"The 8th Wonder","content":{"text":"Albert Einstein called compound interest the 8th wonder of the world. He wasn’t wrong."},"xp":190,"coins":120},
    {"id":"w1l5_04","world":"Moola Basics","level":5,"type":"calculator","title":"$100/month from 16 → 65","content":{"question":"At 8% = ?","answer":1200000,"text":"Over a million. From allowance. Let that sink in."},"xp":500,"coins":350},
    {"id":"w1l5_05","world":"Moola Basics","level":5,"type":"scenario","title":"Graduation $5k","content":{"question":"What do you do with it?","correct":"Invest most","text":"Your future Lambo thanks you"},"xp":350,"coins":250},
    {"id":"w1l5_06","world":"Moola Basics","level":5,"type":"funFact","title":"Bezos was broke at your age","content":{"text":"Jeff Bezos was 35 when he became a millionaire. You’re already ahead if you start now"},"xp":200,"coins":130},

    // World 8 Mastery
    {"id":"w8l8_01","world":"Wealth Empire","level":8,"type":"info","title":"You Beat the Game","content":{"text":"You now know more about money than 99% of adults. Go touch grass… after buying VOO."},"xp":1000,"coins":1000},
    {"id":"w8l8_02","world":"Wealth Empire","level":8,"type":"meme","title":"Final Boss","content":{"caption":"When you finish Racked and realize you’re actually rich in 40 years","text":"Future you is sending Lambo pics","imageUrl":"https://i.imgflip.com/30b1gx.jpg"},"xp":800,"coins":700},
    {"id":"w8l8_03","world":"Wealth Empire","level":8,"type":"funFact","title":"You’re Ahead","content":{"text":"The average adult learns this stuff at 35. You just did it at 16. Legend status unlocked."},"xp":900,"coins":800},
    {"id":"w8l8_04","world":"Wealth Empire","level":8,"type":"scenario","title":"$1M at 65","content":{"question":"What do you do with it?","correct":"Whatever you want","text":"You earned it. Freedom achieved."},"xp":1200,"coins":1100},
    {"id":"w8l8_05","world":"Wealth Empire","level":8,"type":"poll","title":"Next move?","content":{"options":["Keep learning","Teach friends","Flex on TikTok","All of the above"],"correct":3,"text":"The empire grows when you spread the knowledge"},"xp":1000,"coins":900},
    {"id":"w8l8_06","world":"Wealth Empire","level":8,"type":"badge","title":"Empire Builder","content":{"text":"You completed all 8 worlds. You are now officially a Wealth Wizard."},"xp":2000,"coins":2000}
  ],
  "bosses": [
    {"id":"boss_w1l1","world":"Moola Basics","level":1,"name":"Allowance Goblin","trashTalk":["Hand over the $20!","Your skins won’t save you"],"xp":3000,"coins":1500, "img": "👺"},
    {"id":"boss_w1l8","world":"Moola Basics","level":8,"name":"Parents' Bank Account","trashTalk":["You thought it was infinite?","Time to get your own"],"xp":8000,"coins":6000, "img": "🏦"},
    {"id":"boss_w2l4","world":"Budget Beach","level":4,"name":"Black Friday Beast","trashTalk":["One click buy?","Your wallet just screamed"],"xp":7000,"coins":5000, "img": "🛍️"},
    {"id":"boss_w5l8","world":"Debt Dungeon","level":8,"name":"Credit Card Kraken","trashTalk":["29% interest tastes like freedom","Minimum payment = forever payment"],"xp":12000,"coins":9000, "img": "🐙"},
    {"id":"boss_w7l8","world":"Stony Stocks","level":8,"name":"Index Fund Angel","trashTalk":["Boring = rich","YOLO = broke"],"xp":15000,"coins":12000, "img": "🐂"},
    {"id":"boss_w8l8","world":"Wealth Empire","level":8,"name":"Retirement Reaper","trashTalk":["No Roth IRA?","I’m coming for you at 65"],"xp":25000,"coins":20000, "img": "💀"}
  ],
  "badges": [
    {"id":"basics_boss","name":"Basics Boss","icon":"gold_coin","description":"Completed Moola Basics"},
    {"id":"budget_ninja","name":"Budget Ninja","icon":"ninja","description":"Mastered Budget Beach"},
    {"id":"debt_destroyer","name":"Debt Destroyer","icon":"broken_chains","description":"100% Debt Dungeon"},
    {"id":"wealth_wizard","name":"Wealth Wizard","icon":"crown","description":"Completed all 8 worlds"}
  ]
};

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
    // 1. Map World Name to ID used in JSON (e.g. "Moola Basics" -> "Moola Basics")
    // Note: The JSON uses "Moola Basics" as world key, but the app might pass 'world1'.
    // We need to be smart about this lookup.
    
    const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
    const worldName = worldMeta ? worldMeta.id : worldId; // Prefer the ID from metadata which is now "Moola Basics" etc.
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;

    const rng = new SeededRNG(levelId);
    
    // 2. BOSS GENERATION (Look up in JSON first, then fallback)
    let bossConfig = TEEN_CONTENT_PACK.bosses.find((b: any) => b.world === worldName && b.level === levelNum);
    if (!bossConfig) {
        // Fallback Boss Generator
        const genericBossNames = ["Inflation Monster", "Tax Troll", "Impulse Imp", "Debt Dragon", "Scam Snake", "FOMO Phantom"];
        bossConfig = {
            name: genericBossNames[levelNum % genericBossNames.length],
            trashTalk: ["I'm here to take your coins!", "You can't budget this!"],
            img: "👹",
            xp: 5000 + (levelNum * 1000),
            coins: 2000 + (levelNum * 500)
        };
    }

    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${bossConfig.name}`,
        description: "Defeat the boss to advance!",
        bossName: bossConfig.name,
        bossImage: bossConfig.img,
        bossIntro: rng.pick(bossConfig.trashTalk),
        bossQuiz: [
            { question: "What creates wealth?", options: ["Spending", "Investing", "Saving"], correctIndex: 1, explanation: "Assets create wealth." },
            { question: "Inflation does what?", options: ["Increases value", "Decreases value", "Nothing"], correctIndex: 1, explanation: "Your money buys less." },
            { question: "Best friend of investing?", options: ["Time", "Money", "Luck"], correctIndex: 0, explanation: "Compound interest needs time." }
        ]
    };

    // 3. LESSON GENERATION (Look up in JSON first, then fallback)
    const lessons: Lesson[] = [];
    
    // Filter lessons from JSON that match this world and level
    const matchingLessons = TEEN_CONTENT_PACK.lessons.filter((l: any) => l.world === worldName && l.level === levelNum);

    if (matchingLessons.length > 0) {
        // Use high-quality JSON lessons
        matchingLessons.forEach((l: any, index: number) => {
            // Map JSON 'drag' to 'drag_drop' and 'tapLie' to 'tap_lie'
            let type = l.type;
            if (type === 'drag') type = 'drag_drop';

            // Standardize Content for Drag Drop from JSON simplified format
            let content = { ...l.content };
            if (type === 'drag_drop' && Array.isArray(content.items) && typeof content.items[0] === 'string') {
                content.items = content.items.map((text: string, i: number) => ({
                    id: `drag_${i}`,
                    text,
                    category: content.correct[text] // Lookup category from correct map
                }));
            }
            // Standardize Content for Tap Lie
            if (type === 'tapLie' && Array.isArray(content.options)) {
                content.statements = content.options.map((text: string, i: number) => ({
                    text,
                    isLie: i === content.correct
                }));
            }

            lessons.push({
                id: l.id,
                worldId: worldName,
                levelId,
                order: index,
                type,
                title: l.title,
                content,
                xpReward: l.xp,
                coinReward: l.coins
            });
        });
    } else {
        // PROCEDURAL GENERATION FOR MISSING LEVELS
        // This ensures we have 8 full levels even if JSON only covers some.
        const topics = ["Saving", "Investing", "Budgeting", "Earning", "Spending", "Debt"];
        const topic = topics[(levelNum - 1) % topics.length];
        
        for (let i = 0; i < 6; i++) {
             const types: LessonType[] = ['info', 'swipe', 'meme', 'funFact', 'calculator', 'scenario'];
             const type = types[i % types.length];
             
             lessons.push({
                 id: `${levelId}_gen_${i}`,
                 worldId: worldName,
                 levelId,
                 order: i,
                 type,
                 title: `${topic} Lesson ${i+1}`,
                 xpReward: 100,
                 coinReward: 50,
                 content: {
                     text: `Money tip regarding ${topic}: Save early and often.`,
                     cards: [{text: "Spend It", isRight: false, label: "Bad"}, {text: "Save It", isRight: true, label: "Good"}],
                     imageUrl: "https://i.imgflip.com/1ur9b0.jpg",
                     topText: topic.toUpperCase(),
                     bottomText: "IS IMPORTANT",
                     factSource: "Racked Finance",
                     question: `Is ${topic} good?`,
                     options: ["Yes", "No"],
                     correct: 0
                 }
             });
        }
    }

    return { level, lessons };
};

export const getRandomRoast = () => {
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};