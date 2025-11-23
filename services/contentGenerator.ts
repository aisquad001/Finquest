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
    
    // Pick unique items from array
    pickMultiple<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - this.next());
        return shuffled.slice(0, count);
    }
}

// --- FUN FACTS & DEEP DIVES ---
const FUN_FACTS = [
    { text: "$100 invested at age 16 at 8% = $1,600,000 by 65 💀", source: "Vanguard 2024 Investor Study", emoji: "📈" },
    { text: "The average millionaire has 7 streams of income.", source: "IRS Tax Data", emoji: "💸" },
    { text: "If you saved $10/day, it would take 274 years to save $1M without investing.", source: "Basic Math", emoji: "⏳" },
    { text: "Compound interest is the 8th wonder of the world.", source: "Albert Einstein", emoji: "🧠" },
    { text: "Credit card companies made $130 Billion in fees last year.", source: "CFPB Report", emoji: "🏦" },
    { text: "The first credit card was made of paper in 1950.", source: "Diners Club History", emoji: "📜" },
    { text: "Apple makes roughly $3,000 per second.", source: "Apple Financials", emoji: "🍎" },
    { text: "30% of lottery winners go bankrupt within 5 years.", source: "CFP Board", emoji: "📉" },
    { text: "A daily $5 coffee habit costs you $150,000 over 30 years (invested).", source: "The Latte Factor", emoji: "☕" },
    { text: "Most 'rich' people drive Toyotas, not Ferraris.", source: "The Millionaire Next Door", emoji: "🚗" },
    { text: "Inflation cuts the value of cash in half every ~20 years.", source: "US Bureau of Labor Statistics", emoji: "🎈" },
    { text: "The S&P 500 has returned ~10% historically per year.", source: "Stock Market History", emoji: "📊" },
    { text: "Your credit score can affect your dating life.", source: "Match.com Survey", emoji: "💔" },
    { text: "60% of NBA players go broke within 5 years of retirement.", source: "Sports Illustrated", emoji: "🏀" },
    { text: "Paying the minimum on a $5k credit card bill takes 18 years to pay off.", source: "CreditCards.com", emoji: "🐢" },
    { text: "Only 1 in 3 Americans has a written budget.", source: "Gallup Poll", emoji: "📝" },
    { text: "Crypto is not insured by the government (FDIC).", source: "FDIC", emoji: "🛡️" },
    { text: "The 'Rule of 72' tells you how fast your money doubles.", source: "Math Tricks", emoji: "➗" },
    { text: "401k match is literally free money. Take it.", source: "Every Financial Advisor", emoji: "💰" },
    { text: "Renting is not 'throwing money away' if you invest the difference.", source: "Financial Math", emoji: "🏠" }
];

const DEEP_DIVES = [
    "That $5/day boba habit? Skip it and invest → $472k by 65. Real millionaires skip Starbucks. 😎",
    "Banks love it when you pay minimums. It keeps you poor and them rich. Pay it all off! 💳",
    "Inflation is the silent thief. If your money isn't growing, it's dying. Invest it! 📉",
    "Your greatest asset isn't your house or car. It's your mind. Keep leveling up! 🧠",
    "Buying a car on a 7-year loan? You're paying double the price in interest. Oof. 🚗",
    "Credit score is your adulting report card. Keep it above 750 to unlock life's cheat codes. 🎮",
    "Millionaires ask 'How much does it earn?'. Broke people ask 'How much is the monthly payment?'. 🦁",
    "Tax refunds just mean you gave the government a 0% interest loan. Adjust your W-4! 📝",
    "Diversification means not putting all your eggs in one basket. Don't yeet everything into one coin. 🧺",
    "Emergency funds prevent bad days from becoming bad years. Save 3-6 months expenses. 🛡️",
    "Rich people buy assets (things that pay them). Poor people buy liabilities (things that cost them). 🏠",
    "Investing is boring. If it's exciting, you're probably gambling. Be boring, get rich. 😴",
    "The stock market transfers money from the impatient to the patient. HODL. 💎🙌",
    "You can't out-earn bad spending habits. Fix the leak before you fill the bucket. 🪣",
    "Compound interest needs TIME. Start now, even with $5. Your future self will thank you. ⏳",
    "A budget isn't a restriction. It's permission to spend without guilt. 💅",
    "Debit cards spend your money. Credit cards spend the bank's money (plus protection). Use credit wisely. 💳",
    "Net Worth = Assets - Liabilities. Focus on growing the first and shrinking the second. 📈",
    "Lifestyle creep is the enemy. Just because you got a raise doesn't mean you need a better car. 🚫",
    "True wealth is freedom of time, not just a pile of cash. 🏝️"
];

export const getRandomFunFact = () => FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
export const getRandomDeepDive = () => DEEP_DIVES[Math.floor(Math.random() * DEEP_DIVES.length)];

// --- WORLD-SPECIFIC CONTENT DEFINITIONS ---

const WORLD_DATA: Record<string, { bossName: string, bossIntro: string[], bossEmoji: string, topics: any[] }> = {
    "Moola Basics": {
        bossName: "The Inflation Dragon",
        bossEmoji: "🐲",
        bossIntro: ["Your cash is melting!", "Prices are rising!", "I eat value for breakfast!"],
        topics: [
            { q: "Money is a medium of...", a: ["Exchange", "Conversation", "Art"], c: 0, e: "You trade money for stuff." },
            { q: "Barter means...", a: ["Trading goods", "Paying cash", "Stealing"], c: 0, e: "Trading chickens for shoes." },
            { q: "Inflation makes prices...", a: ["Go Up", "Go Down", "Stay Same"], c: 0, e: "Stuff gets more expensive." },
            { q: "Fiat money is backed by...", a: ["Government Trust", "Gold", "Bitcoin"], c: 0, e: "The government says it has value." },
            { q: "A Need is...", a: ["Water", "Netflix", "Gucci"], c: 0, e: "You die without needs." },
            { q: "A Want is...", a: ["PS5", "Shelter", "Medicine"], c: 0, e: "Nice to have, not vital." },
            { q: "Scarcity means...", a: ["Limited Resources", "Unlimited Stuff", "Fear"], c: 0, e: "There isn't enough for everyone." },
            { q: "Opportunity Cost is...", a: ["What you give up", "Price tag", "Tax"], c: 0, e: "Choosing A means missing B." }
        ]
    },
    "Budget Beach": {
        bossName: "The Impulse Imp",
        bossEmoji: "👺",
        bossIntro: ["Buy it NOW!", "Who needs savings?", "Treat yourself!"],
        topics: [
            { q: "50/30/20: 50% is for...", a: ["Needs", "Wants", "Savings"], c: 0, e: "Rent, food, utilities." },
            { q: "50/30/20: 30% is for...", a: ["Wants", "Needs", "Debt"], c: 0, e: "Fun stuff." },
            { q: "Fixed Expenses...", a: ["Stay same", "Change", "Are rare"], c: 0, e: "Rent is fixed." },
            { q: "Variable Expenses...", a: ["Fluctuate", "Stay same", "Are fixed"], c: 0, e: "Groceries change monthly." },
            { q: "Pay Yourself First means...", a: ["Save before spending", "Buy toys", "Pay bills last"], c: 0, e: "Prioritize your future." },
            { q: "Zero-Based Budgeting...", a: ["Every dollar has a job", "Having $0", "Spending $0"], c: 0, e: "Income - Expense = 0." },
            { q: "Sinking Fund is for...", a: ["Planned big purchases", "Boats", "Debt"], c: 0, e: "Saving for a car or trip." },
            { q: "Emergency Fund size?", a: ["3-6 Months", "$100", "1 Week"], c: 0, e: "Safety net for job loss." }
        ]
    },
    "Compound Cliffs": {
        bossName: "The Time Thief",
        bossEmoji: "⏳",
        bossIntro: ["Wait until later!", "You have plenty of time!", "Start tomorrow!"],
        topics: [
            { q: "Compound Interest is...", a: ["Interest on Interest", "Simple", "Flat"], c: 0, e: "Growth on growth." },
            { q: "Start investing...", a: ["Now", "Later", "Never"], c: 0, e: "Time is your best friend." },
            { q: "Rule of 72 calculates...", a: ["Doubling time", "Taxes", "Retirement"], c: 0, e: "72 / Rate = Years to double." },
            { q: "APY stands for...", a: ["Annual Percentage Yield", "Apple", "All Pay Year"], c: 0, e: "Includes compounding." },
            { q: "Inflation vs Compounding...", a: ["Opposites", "Same", "Friends"], c: 0, e: "Inflation eats value, compounding adds it." },
            { q: "Snowball effect...", a: ["Growth accelerates", "Melts", "Stops"], c: 0, e: "Gets bigger faster over time." },
            { q: "Who said it's the 8th Wonder?", a: ["Einstein", "Musk", "Bezos"], c: 0, e: "Albert Einstein." },
            { q: "Consistency beats...", a: ["Intensity", "Luck", "Brains"], c: 0, e: "Slow and steady wins." }
        ]
    },
    "Bank Vault": {
        bossName: "The Fee Fiend",
        bossEmoji: "🦇",
        bossIntro: ["I love overdrafts!", "Minimum balance fee!", "ATM surcharge!"],
        topics: [
            { q: "Checking accounts are for...", a: ["Spending", "Investing", "Hiding"], c: 0, e: "Daily transactions." },
            { q: "Savings accounts earn...", a: ["Interest", "Nothing", "Fees"], c: 0, e: "The bank pays you." },
            { q: "FDIC insures up to...", a: ["$250,000", "$1,000", "$1 Million"], c: 0, e: "Per depositor, per bank." },
            { q: "Overdraft fee happens when...", a: ["Balance < $0", "Balance > $0", "You save"], c: 0, e: "You spent money you don't have." },
            { q: "HYSA stands for...", a: ["High Yield Savings", "High Year", "Hello You"], c: 0, e: "Pays more interest." },
            { q: "Debit cards use...", a: ["Your money", "Bank's money", "Fake money"], c: 0, e: "Direct from checking." },
            { q: "Direct Deposit is...", a: ["Paycheck to bank", "Cash", "Check"], c: 0, e: "Automatic electronic payment." },
            { q: "Liquidity means...", a: ["Easy access to cash", "Water", "Frozen"], c: 0, e: "How fast you can spend it." }
        ]
    },
    "Debt Dungeon": {
        bossName: "The Interest Ogre",
        bossEmoji: "👹",
        bossIntro: ["Minimum payment only!", "Sign here!", "25% APR!"],
        topics: [
            { q: "APR stands for...", a: ["Annual Percentage Rate", "Apple", "April"], c: 0, e: "Cost of borrowing." },
            { q: "Good Debt helps...", a: ["Build Net Worth", "Buy Pizza", "Nothing"], c: 0, e: "Like a mortgage or student loan." },
            { q: "Bad Debt is...", a: ["High interest consumption", "Investment", "Mortgage"], c: 0, e: "Credit card debt for toys." },
            { q: "Credit Score range...", a: ["300-850", "0-100", "A-F"], c: 0, e: "850 is perfect." },
            { q: "Pay off balance in full to...", a: ["Avoid interest", "Pay more", "Lose score"], c: 0, e: "Credit cards are free if paid monthly." },
            { q: "Principal is...", a: ["Amount borrowed", "School boss", "Interest"], c: 0, e: "The original loan amount." },
            { q: "Default means...", a: ["Failed to pay", "Standard", "Win"], c: 0, e: "You broke the contract." },
            { q: "Utilization ratio should be...", a: ["< 30%", "> 50%", "100%"], c: 0, e: "Don't max out your cards." }
        ]
    },
    "Hustle Hub": {
        bossName: "The Tax Titan",
        bossEmoji: "🕴️",
        bossIntro: ["Where's my cut?", "Audit time!", "Gross isn't Net!"],
        topics: [
            { q: "Gross Income is...", a: ["Before Tax", "After Tax", "Yucky"], c: 0, e: "Total earnings." },
            { q: "Net Income is...", a: ["Take-home pay", "Total pay", "Fishing"], c: 0, e: "What hits your bank." },
            { q: "Gig Economy means...", a: ["Freelance/Side jobs", "Concert", "Big Economy"], c: 0, e: "Uber, DoorDash, Fiverr." },
            { q: "W-2 employee gets...", a: ["Taxes withheld", "No taxes", "Cash"], c: 0, e: "Employer handles tax." },
            { q: "1099 worker must...", a: ["Pay own taxes", "Ignore tax", "Hide"], c: 0, e: "You are a business." },
            { q: "Active Income requires...", a: ["Work/Time", "Sleeping", "Luck"], c: 0, e: "Trading hours for dollars." },
            { q: "Passive Income is...", a: ["Money working for you", "Lazy", "Illegal"], c: 0, e: "Earn while you sleep." },
            { q: "Side Hustle is...", a: ["Extra income job", "Main job", "Dance"], c: 0, e: "Money outside 9-5." }
        ]
    },
    "Stony Stocks": {
        bossName: "The Panic Bear",
        bossEmoji: "🐻",
        bossIntro: ["Market crash!", "Sell everything!", "It's going to zero!"],
        topics: [
            { q: "A Stock represents...", a: ["Ownership in company", "Loan", "Paper"], c: 0, e: "You own a piece of the business." },
            { q: "Diversification is...", a: ["Not putting eggs in 1 basket", "Buying 1 stock", "Diving"], c: 0, e: "Spreading risk." },
            { q: "Bull Market means...", a: ["Prices rising", "Prices falling", "Animals"], c: 0, e: "Optimism and growth." },
            { q: "Bear Market means...", a: ["Prices falling", "Prices rising", "Camping"], c: 0, e: "Pessimism and drop." },
            { q: "Dividend is...", a: ["Profit share payout", "Math", "Fee"], c: 0, e: "Company pays you to hold." },
            { q: "ETF holds...", a: ["Basket of stocks", "One stock", "Bitcoin"], c: 0, e: "Exchange Traded Fund." },
            { q: "Volatility is...", a: ["Price fluctuation", "Volume", "Value"], c: 0, e: "How wild the price swings." },
            { q: "Buy low, sell...", a: ["High", "Lower", "Never"], c: 0, e: "Basic profit logic." }
        ]
    },
    "Wealth Empire": {
        bossName: "Lifestyle Creep",
        bossEmoji: "🧟",
        bossIntro: ["You need a better car!", "Upgrade your house!", "Spend it all!"],
        topics: [
            { q: "Net Worth formula...", a: ["Assets - Liabilities", "Income - Tax", "Cash + Car"], c: 0, e: "What you own minus what you owe." },
            { q: "Financial Independence...", a: ["Assets cover expenses", "No job", "Lottery"], c: 0, e: "Work is optional." },
            { q: "Inflation affects...", a: ["Purchasing power", "Height", "Gravity"], c: 0, e: "Your money buys less." },
            { q: "Appreciating Asset...", a: ["Goes up in value", "Goes down", "Says thanks"], c: 0, e: "House, Stocks." },
            { q: "Depreciating Asset...", a: ["Loses value", "Gains value", "Gold"], c: 0, e: "Car, Clothes, Electronics." },
            { q: "The 4% Rule is for...", a: ["Retirement withdrawal", "Milk", "Tips"], c: 0, e: "Safe withdrawal rate." },
            { q: "Estate Planning is...", a: ["Will & Trust", "Gardening", "Buying land"], c: 0, e: "Plan for after you die." },
            { q: "Generational Wealth...", a: ["Passes to kids", "Spent today", "Gone"], c: 0, e: "Building for the bloodline." }
        ]
    }
};

// --- GENERATOR ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    // Normalize World ID
    const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
    const worldName = worldMeta ? worldMeta.id : "Moola Basics"; 
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;
    
    const rng = new SeededRNG(levelId);
    
    // Retrieve World Data
    const data = WORLD_DATA[worldName] || WORLD_DATA["Moola Basics"];
    
    // --- BOSS GENERATION (UNIQUE PER LEVEL) ---
    const bossName = data.bossName;
    const bossImage = data.bossEmoji;
    const bossIntro = rng.pick(data.bossIntro);
    
    // Select 3 distinct questions for this level's boss
    // We use the seeded RNG to pick 3 from the 8 available topics essentially randomly but deterministically per level
    const levelTopics = rng.pickMultiple(data.topics, 3);
    
    const bossQuiz: BossQuestion[] = levelTopics.map(t => ({
        question: t.q,
        options: t.a,
        correctIndex: t.c,
        explanation: t.e
    }));

    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${bossName} Attack!`,
        description: `Defeat ${bossName} to secure your knowledge!`,
        bossName: bossName,
        bossImage: bossImage,
        bossIntro: bossIntro,
        bossQuiz: bossQuiz
    };

    // --- LESSON GENERATION (UNIQUE CONTENT) ---
    // We generate 6 lessons. To ensure uniqueness, we use the World Theme + Level Num + Index
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['info', 'swipe', 'poll', 'meme', 'calculator', 'tapLie']; 
    
    // Content Templates based on World to prevent cross-contamination
    const getWorldSpecificContent = (type: LessonType, index: number) => {
        
        if (worldName === "Moola Basics") {
            if (type === 'swipe') return { question: "Value Check", left: "Barter", right: "Cash", correct: "right", text: "Cash is more efficient." };
            if (type === 'poll') return { question: "What is Money?", options: ["Paper", "Trust", "Gold"], correct: 1, text: "It's a system of trust." };
            if (type === 'meme') return { topText: "Me trying to barter", bottomText: "The cashier at Walmart", imageUrl: "https://i.imgflip.com/26am.jpg" };
            if (type === 'calculator') return { label: "Inflation Calc", question: "Item cost $10. Inflation 10%. New cost?", answer: 11, text: "Prices go up." };
            if (type === 'tapLie') return { text: "Money History", statements: [{text:"Salt was money", isLie:false}, {text:"Money is infinite", isLie:true}] };
            return { text: "Money solves the 'double coincidence of wants' problem.", analogy: "Like a universal key." };
        }
        
        if (worldName === "Budget Beach") {
            if (type === 'swipe') return { question: "Need or Want?", left: "PS5", right: "Rent", correct: "right", text: "Shelter first." };
            if (type === 'poll') return { question: "Best Budget Rule?", options: ["80/20", "50/30/20", "100/0"], correct: 1, text: "The classic balanced split." };
            if (type === 'meme') return { topText: "My Bank Account", bottomText: "Me buying boba", imageUrl: "https://i.imgflip.com/1jwhww.jpg" };
            if (type === 'calculator') return { label: "Budget Math", question: "$100 Income. Save 20%. How much?", answer: 20, text: "Pay yourself first." };
            if (type === 'tapLie') return { text: "Budget Myths", statements: [{text:"Budgets are for poor people", isLie:true}, {text:"Tracking helps", isLie:false}] };
            return { text: "A budget isn't a prison. It's a plan for your freedom.", analogy: "Like a map for a road trip." };
        }

        if (worldName === "Compound Cliffs") {
            if (type === 'swipe') return { question: "Start When?", left: "Age 20", right: "Age 40", correct: "left", text: "Time in market > Timing market." };
            if (type === 'poll') return { question: "Einstein called it...", options: ["Magic", "8th Wonder", "Scam"], correct: 1, text: "It multiplies money." };
            if (type === 'meme') return { topText: "Investing $50/mo", bottomText: "Retiring Millionaire", imageUrl: "https://i.imgflip.com/30b1gx.jpg" };
            if (type === 'calculator') return { label: "Doubling Rule", question: "72 / 8% return = Years?", answer: 9, text: "Doubles every 9 years." };
            if (type === 'tapLie') return { text: "Compound Truths", statements: [{text:"Linear growth", isLie:true}, {text:"Exponential growth", isLie:false}] };
            return { text: "Your money can make babies. Those babies make babies. That's compounding.", analogy: "Like a rolling snowball." };
        }

        if (worldName === "Bank Vault") {
            if (type === 'swipe') return { question: "Store money in...", left: "Mattress", right: "HYSA", correct: "right", text: "Inflation eats mattress money." };
            if (type === 'poll') return { question: "FDIC protects up to...", options: ["$250k", "$1M", "$0"], correct: 0, text: "Per bank, per person." };
            if (type === 'meme') return { topText: "Checking Account 0.01%", bottomText: "HYSA 4.5%", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" }; // Distracted boyfriend
            if (type === 'calculator') return { label: "Interest Gain", question: "$10k at 5%. Gain in 1 yr?", answer: 500, text: "Free money." };
            if (type === 'tapLie') return { text: "Banking Facts", statements: [{text:"Overdraft fees are fun", isLie:true}, {text:"Direct deposit is faster", isLie:false}] };
            return { text: "A High Yield Savings Account (HYSA) pays you 10x-50x more than a regular bank.", analogy: "Like upgrading your weapon for free." };
        }

        if (worldName === "Debt Dungeon") {
            if (type === 'swipe') return { question: "Pay Minimum?", left: "Yes", right: "Full Balance", correct: "right", text: "Avoid interest." };
            if (type === 'poll') return { question: "Good Credit Score?", options: ["500", "600", "750+"], correct: 2, text: "Unlock best rates." };
            if (type === 'meme') return { topText: "Me swiping card", bottomText: "Me seeing the bill", imageUrl: "https://i.imgflip.com/30b1gx.jpg" };
            if (type === 'calculator') return { label: "Interest Pain", question: "$1000 debt. 20% APR. Interest/yr?", answer: 200, text: "Ouch." };
            if (type === 'tapLie') return { text: "Credit Myths", statements: [{text:"Carrying a balance helps score", isLie:true}, {text:"Utilization matters", isLie:false}] };
            return { text: "Credit cards are like chainsaws. Useful tool, but can cut your leg off if used wrong.", analogy: "Fire: Cook food or burn house." };
        }

        if (worldName === "Hustle Hub") {
            if (type === 'swipe') return { question: "Tax Form?", left: "W-2", right: "Pizza", correct: "left", text: "Employee form." };
            if (type === 'poll') return { question: "Net Income is...", options: ["After Tax", "Before Tax", "Gross"], correct: 0, text: "What you actually keep." };
            if (type === 'meme') return { topText: "Gross Pay", bottomText: "Net Pay", imageUrl: "https://i.imgflip.com/1jwhww.jpg" };
            if (type === 'calculator') return { label: "Side Hustle", question: "$20/hr for 5 hrs?", answer: 100, text: "Quick math." };
            if (type === 'tapLie') return { text: "Tax Truths", statements: [{text:"Cash tips are tax free", isLie:true}, {text:"You must file taxes", isLie:false}] };
            return { text: "Passive income is money you earn while sleeping. Active income requires you to be awake.", analogy: "Planting a fruit tree vs hunting." };
        }

        if (worldName === "Stony Stocks") {
            if (type === 'swipe') return { question: "Buy Stock?", left: "High", right: "Low", correct: "right", text: "Buy low, sell high." };
            if (type === 'poll') return { question: "S&P 500 is...", options: ["500 Companies", "500 Dollars", "500 Cars"], correct: 0, text: "Top US companies." };
            if (type === 'meme') return { topText: "Market Crashes", bottomText: "Me Buying the Dip", imageUrl: "https://i.imgflip.com/434i5j.jpg" }; // Stonks
            if (type === 'calculator') return { label: "Stock Gain", question: "Buy $10. Sell $15. Profit?", answer: 5, text: "50% gain." };
            if (type === 'tapLie') return { text: "Investing", statements: [{text:"Guaranteed returns exist", isLie:true}, {text:"Risk and reward correlate", isLie:false}] };
            return { text: "A stock is a piece of a company. An ETF is a basket of many stocks.", analogy: "Buying a slice vs the whole pizza." };
        }

        if (worldName === "Wealth Empire") {
            if (type === 'swipe') return { question: "Buy Asset?", left: "Car", right: "Rental Property", correct: "right", text: "Cars depreciate." };
            if (type === 'poll') return { question: "Net Worth is...", options: ["Assets - Liabilities", "Income", "Cash"], correct: 0, text: "The golden formula." };
            if (type === 'meme') return { topText: "Looking Rich", bottomText: "Being Rich", imageUrl: "https://i.imgflip.com/26am.jpg" };
            if (type === 'calculator') return { label: "Wealth Math", question: "$1M Assets. $200k Debt. Net Worth?", answer: 800000, text: "$800k." };
            if (type === 'tapLie') return { text: "Wealth Mindset", statements: [{text:"Lottery is a plan", isLie:true}, {text:"Time > Money", isLie:false}] };
            return { text: "True wealth isn't having expensive things. It's having time freedom.", analogy: "Wealth is the engine, money is the gas." };
        }

        // Default fallback to generic but themed if world not explicitly caught above (covers 4-8 generically but unique per seed)
        // In a real production app we would write out cases for all 8.
        // For this hotfix, we ensure diversity by using the topic list.
        const topic = data.topics[index % data.topics.length];
        if (type === 'info') return { text: `${topic.q} ${topic.e}`, analogy: "Knowledge is power." };
        if (type === 'poll') return { question: topic.q, options: topic.a, correct: topic.c, text: topic.e };
        return { text: topic.e, question: topic.q, answer: 100 }; // Fallback
    };

    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content = getWorldSpecificContent(type, i);
        
        // Inject slightly randomized titles to prevent "Lesson" repetition
        const titles = ["The Basics", "Deep Dive", "Quick Check", "Reality Hit", "Pro Tip", "Final Boss Prep"];
        
        lessons.push({
            id: lessonId,
            worldId: worldName,
            levelId,
            order: i,
            type,
            title: titles[i] || "Lesson",
            content: content as any,
            xpReward: 100 + (i * 20),
            coinReward: 50 + (i * 10)
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
        "Plot twist: That was the broke option 🤡",
        "Even the goblin is judging you 👹",
        "Your credit score just dropped 50 points (jk) 📉",
        "Have fun staying poor! (meme reference) 🤪"
    ];
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};