
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Lesson, LevelData, BossQuestion, LessonType } from './gamification';

// --- DETERMINISTIC RNG ---
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
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    }
}

// --- CONTENT LIBRARIES ---

const FUN_FACTS = [
    { text: "Investing $100/mo at 8% from age 16 = $1.5 Million by age 65.", source: "Compound Interest Math" },
    { text: "Most millionaires drive Toyotas and Hondas, not Lambos.", source: "The Millionaire Next Door" },
    { text: "Jeff Bezos didn't become a millionaire until 33. You're early.", source: "History" },
    { text: "If you buy a $5 coffee daily, that's $1,825 a year. That's a vacation.", source: "Math" },
    { text: "Credit Card companies make money when you fail to pay.", source: "Facts" },
    { text: "The S&P 500 has returned ~10% per year on average for 100 years.", source: "Market History" },
    { text: "Inflation eats your cash. $100 in 2020 is worth ~$82 in 2024.", source: "Bureau of Labor Statistics" },
    { text: "You can open a Roth IRA as soon as you have earned income (a job).", source: "IRS Rules" },
    { text: "The average car payment in the USA is over $700. Invest that instead.", source: "Edmunds" },
    { text: "NFTs are not an asset class. They are a casino.", source: "Common Sense" }
];

// BOSS ROASTS FOR WRONG ANSWERS
const ROASTS = [
    "Your wallet just filed a restraining order 💀",
    "That answer cost you a fictional Lambo 📉",
    "Financial Advisor has left the chat ✌️",
    "Bro, did you learn finance from TikTok? 😂",
    "Oof. The debt collectors are calling 📞",
    "My calculator just exploded 💥",
    "Plot twist: That was the broke option 🤡",
    "Even the IRS feels bad for you now 😬",
    "We're deducting 50 aura points for that one.",
    "Don't quit your day job... yet."
];

interface ThemeQuestion {
    q: string;
    o: string[];
    a: number;
    e: string;
}

interface ThemeLessonTemplate {
    type: LessonType;
    title: string;
    content?: any; // Optional override
}

interface WorldThemeData {
    boss: string;
    bossImg: string;
    questions: ThemeQuestion[];
    lessons: ThemeLessonTemplate[];
}

// FINAL CONTENT PACK DATA (Simulated Import)
const WORLD_THEMES: Record<string, WorldThemeData> = {
    world1: { // BASICS
        boss: "The Inflation Monster",
        bossImg: "👺",
        questions: [
            { q: "You find $20. Smartest move?", o: ["Spend it", "Save/Invest", "Burn it"], a: 1, e: "Money grows if you let it." },
            { q: "Inflation makes your money:", o: ["Worth less", "Worth more", "Stay same"], a: 0, e: "Prices go up, value goes down." },
            { q: "Needs vs Wants: Water is?", o: ["Need", "Want", "Luxury"], a: 0, e: "You die without it." },
            { q: "Needs vs Wants: Netflix is?", o: ["Need", "Want", "Right"], a: 1, e: "You can survive without Stranger Things." },
            { q: "Opportunity Cost means:", o: ["What you give up", "Price tag", "Discount"], a: 0, e: "Choosing A means losing B." },
            { q: "What is a liability?", o: ["Takes money OUT", "Puts money IN", "A lie"], a: 0, e: "Liabilities cost you money." },
            { q: "Best way to get rich?", o: ["Lottery", "Skills + Assets", "Inheritance"], a: 1, e: "Build value, own things." },
            { q: "Money is primarily a tool for:", o: ["Flexing", "Freedom", "Stress"], a: 1, e: "Money buys options, not just stuff." }
        ],
        lessons: [
            { type: 'swipe', title: "Needs vs Wants" },
            { type: 'info', title: "What is Money?" },
            { type: 'fun_fact', title: "Did you know?" },
            { type: 'tap_lie', title: "Spot the Cap" },
            { type: 'meme', title: "Reality Check" },
            { type: 'fun_fact', title: "Mind Blown" },
            { type: 'drag_drop', title: "Asset vs Liability" },
            { type: 'scenario', title: "Found Wallet" }
        ]
    },
    world2: { // BUDGETING
        boss: "The Impulse Buyer",
        bossImg: "🛍️",
        questions: [
            { q: "50/30/20 Rule: 50% goes to?", o: ["Needs", "Wants", "Savings"], a: 0, e: "Essentials first." },
            { q: "A budget is:", o: ["A plan for money", "A restriction", "Useless"], a: 0, e: "Tell your money where to go." },
            { q: "You want a $100 jacket. You have $50. You:", o: ["Buy with credit", "Save up", "Steal it"], a: 1, e: "Don't spend money you don't have." },
            { q: "The 'Latte Factor' proves:", o: ["Small spends add up", "Coffee is bad", "Milk is expensive"], a: 0, e: "Daily habits drain wealth." },
            { q: "Emergency Fund is for:", o: ["Hospital/Car fix", "New PS5", "Sale"], a: 0, e: "Unexpected disasters only." },
            { q: "Impulse buying usually leads to:", o: ["Regret", "Wealth", "Joy"], a: 0, e: "Wait 24 hours before buying." },
            { q: "Which is a 'Want'?", o: ["Rent", "Groceries", "Concert Tix"], a: 2, e: "Entertainment is a want." },
            { q: "Tracking expenses helps you:", o: ["See leaks", "Waste time", "Be boring"], a: 0, e: "You can't manage what you don't measure." }
        ],
        lessons: [
            { type: 'drag_drop', title: "Sort Expenses" },
            { type: 'info', title: "50/30/20 Rule" },
            { type: 'fun_fact', title: "Savings Stat" },
            { type: 'calculator', title: "Coffee Cost" },
            { type: 'scenario', title: "Prom Night" },
            { type: 'fun_fact', title: "Rich Mindset" },
            { type: 'swipe', title: "Buy or Bye?" },
            { type: 'meme', title: "Sale Trap" }
        ]
    },
    world3: { // COMPOUNDING
        boss: "Time Wizard",
        bossImg: "⏳",
        questions: [
            { q: "Compound Interest is:", o: ["Interest on Interest", "Simple math", "A bank fee"], a: 0, e: "Money making money." },
            { q: "Best time to start investing:", o: ["Yesterday", "At 30", "At 50"], a: 0, e: "Time is your best asset." },
            { q: "Rule of 72 tells you:", o: ["Doubling time", "Retirement age", "Tax rate"], a: 0, e: "72 / Rate = Years to double." },
            { q: "Who wins? Saver A (starts 18) or B (starts 30)?", o: ["Saver A", "Saver B", "Tie"], a: 0, e: "Saver A has more time to compound." },
            { q: "Snowball effect refers to:", o: ["Growth momentum", "Cold weather", "Spending"], a: 0, e: "Small starts lead to huge ends." },
            { q: "If you invest $0, you get:", o: ["$0", "$1M", "Lucky"], a: 0, e: "You have to start to win." },
            { q: "Exponential growth looks like:", o: ["Hockey Stick", "Flat line", "Down hill"], a: 0, e: "Slow then EXPLOSIVE." },
            { q: "Albert Einstein called compounding:", o: ["8th Wonder", "Boring", "Hard"], a: 0, e: "He knew the math." }
        ],
        lessons: [
            { type: 'info', title: "8th Wonder" },
            { type: 'calculator', title: "Millionaire Math" },
            { type: 'fun_fact', title: "Bezos Fact" },
            { type: 'meme', title: "Waiting vs Starting" },
            { type: 'tap_lie', title: "Investing Myths" },
            { type: 'fun_fact', title: "Rule of 72" },
            { type: 'scenario', title: "The Time Machine" },
            { type: 'drag_drop', title: "Linear vs Exponential" }
        ]
    },
    world4: { // BANKING
        boss: "The Fee Collector",
        bossImg: "🧛",
        questions: [
            { q: "Checking vs Savings:", o: ["Spending vs Storing", "Same thing", "Savings for daily use"], a: 0, e: "Checking is for spending." },
            { q: "FDIC Insurance covers:", o: ["$250k", "$1M", "$0"], a: 0, e: "Govt protects your cash." },
            { q: "Overdraft fee happens when:", o: ["Balance < $0", "Balance is high", "You save too much"], a: 0, e: "Don't spend more than you have." },
            { q: "HYSA stands for:", o: ["High Yield Savings", "High Yearly Spend", "Hello You"], a: 0, e: "Free money basically." },
            { q: "Direct Deposit is:", o: ["Auto paycheck", "Writing a check", "Cash"], a: 0, e: "Faster and safer." },
            { q: "Debit Card uses:", o: ["Your Money", "Bank's Money", "Fake Money"], a: 0, e: "Straight from checking." },
            { q: "Credit Card uses:", o: ["Bank's Money", "Your Money", "Free Money"], a: 0, e: "It's a loan you pay back." },
            { q: "Minimum balance fee:", o: ["Fee for being broke", "Reward", "Tax"], a: 0, e: "Banks charge you for having no money." }
        ],
        lessons: [
            { type: 'info', title: "HYSA Cheat Code" },
            { type: 'tap_lie', title: "Bank Lies" },
            { type: 'fun_fact', title: "Bank Fees" },
            { type: 'scenario', title: "ATM Fee Trap" },
            { type: 'drag_drop', title: "Bank Accounts" },
            { type: 'fun_fact', title: "FDIC Safety" },
            { type: 'swipe', title: "Debit vs Credit" },
            { type: 'meme', title: "Overdraft Pain" }
        ]
    },
    world5: { // DEBT
        boss: "The Loan Shark",
        bossImg: "🦈",
        questions: [
            { q: "Good Debt helps you:", o: ["Build wealth", "Look cool", "Eat food"], a: 0, e: "Like a house or education." },
            { q: "Credit Card interest is usually:", o: ["20%+", "2%", "0%"], a: 0, e: "It's a wealth killer." },
            { q: "Minimum Payment trap:", o: ["Keeps you in debt", "Helps you", "Is smart"], a: 0, e: "You pay mostly interest." },
            { q: "Payday Loans are:", o: ["Scams/Predatory", "Helpful", "Good deals"], a: 0, e: "300%+ Interest. Avoid." },
            { q: "Klarna/Afterpay is:", o: ["Debt", "Free money", "A gift"], a: 0, e: "You still owe the money." },
            { q: "If you miss a payment:", o: ["Credit score drops", "Nothing happens", "Bank says sorry"], a: 0, e: "It hurts your reputation." },
            { q: "Paying full balance means:", o: ["0 Interest", "High Interest", "Fees"], a: 0, e: "Always pay in full." },
            { q: "Student Loans are:", o: ["Hard to bankrupt", "Free", "Easy"], a: 0, e: "They stick with you forever." }
        ],
        lessons: [
            { type: 'swipe', title: "Good vs Bad Debt" },
            { type: 'info', title: "APR Explained" },
            { type: 'fun_fact', title: "Credit Card Cost" },
            { type: 'meme', title: "Minimum Payments" },
            { type: 'scenario', title: "Buy Now Pay Later" },
            { type: 'fun_fact', title: "Student Loans" },
            { type: 'tap_lie', title: "Debt Myths" },
            { type: 'calculator', title: "Interest Cost" }
        ]
    },
    world6: { // TAXES
        boss: "Taxman Titan",
        bossImg: "🕴️",
        questions: [
            { q: "Gross vs Net Pay:", o: ["Before vs After Tax", "Same", "Net is bigger"], a: 0, e: "Net is what hits your bank." },
            { q: "FICA takes money for:", o: ["Social Security", "Netflix", "Roads"], a: 0, e: "Old people money." },
            { q: "W-4 Form tells boss:", o: ["Tax withholding", "Lunch order", "Address"], a: 0, e: "How much tax to take out." },
            { q: "Tax Refund means:", o: ["You overpaid govt", "Govt gift", "Bonus"], a: 0, e: "Interest free loan to Uncle Sam." },
            { q: "Side Hustle income is:", o: ["Taxable", "Tax Free", "Free money"], a: 0, e: "IRS wants their cut." },
            { q: "Sales Tax is paid on:", o: ["Stuff you buy", "Income", "Property"], a: 0, e: "Added at the register." },
            { q: "The IRS is:", o: ["Tax Police", "A band", "A charity"], a: 0, e: "Internal Revenue Service." },
            { q: "Tax evasion is:", o: ["Illegal", "Smart", "Optional"], a: 0, e: "You will go to jail." }
        ],
        lessons: [
            { type: 'calculator', title: "Paycheck Reality" },
            { type: 'tap_lie', title: "Tax Myths" },
            { type: 'fun_fact', title: "Tax Bracket" },
            { type: 'info', title: "What is FICA?" },
            { type: 'meme', title: "First Paycheck" },
            { type: 'fun_fact', title: "Refund Truth" },
            { type: 'drag_drop', title: "Gross vs Net" },
            { type: 'scenario', title: "Side Hustle Tax" }
        ]
    },
    world7: { // INVESTING
        boss: "Market Maker",
        bossImg: "🐂",
        questions: [
            { q: "A stock represents:", o: ["Ownership", "A loan", "A product"], a: 0, e: "You own a piece of the company." },
            { q: "S&P 500 is:", o: ["Top 500 US Cos", "A race car", "500 people"], a: 0, e: "Buying the whole market." },
            { q: "Diversification means:", o: ["Don't put all eggs in one basket", "Buy 1 stock", "Buy Crypto"], a: 0, e: "Safety in numbers." },
            { q: "Dividends are:", o: ["Profit payouts", "Fees", "Taxes"], a: 0, e: "Cash for owning stock." },
            { q: "Index Fund:", o: ["Low cost basket", "Expensive", "Single stock"], a: 0, e: "Best way to build wealth." },
            { q: "Bear Market means:", o: ["Prices Falling", "Prices Rising", "Zoo"], a: 0, e: "Bears swipe down." },
            { q: "Bull Market means:", o: ["Prices Rising", "Prices Falling", "Farm"], a: 0, e: "Bulls strike up." },
            { q: "Volatility is:", o: ["Price swings", "Volume", "Value"], a: 0, e: "How bumpy the ride is." }
        ],
        lessons: [
            { type: 'info', title: "Stocks 101" },
            { type: 'swipe', title: "Risk vs Reward" },
            { type: 'fun_fact', title: "S&P 500 Return" },
            { type: 'scenario', title: "Crypto Scam" },
            { type: 'drag_drop', title: "Asset Classes" },
            { type: 'fun_fact', title: "Time in Market" },
            { type: 'calculator', title: "Dividend Math" },
            { type: 'meme', title: "Panic Selling" }
        ]
    },
    world8: { // FREEDOM
        boss: "The Gatekeeper",
        bossImg: "🦁",
        questions: [
            { q: "Net Worth is:", o: ["Assets - Liabilities", "Income", "Cash"], a: 0, e: "What you own minus what you owe." },
            { q: "Roth IRA benefit:", o: ["Tax-Free Growth", "Tax Deduction", "Free money"], a: 0, e: "Pay tax now, zero later." },
            { q: "Credit Score of 800 is:", o: ["Excellent", "Bad", "Average"], a: 0, e: "Top tier access." },
            { q: "Inflation Hedge:", o: ["Assets (Stocks/RE)", "Cash", "Bonds"], a: 0, e: "Assets rise with prices." },
            { q: "FIRE movement:", o: ["Financial Independence", "Burning money", "Camping"], a: 0, e: "Retire Early." },
            { q: "Lifestyle Creep is:", o: ["Spending more as you earn more", "A scary movie", "Good"], a: 0, e: "Keep expenses low to get rich." },
            { q: "401k Match is:", o: ["Free money from boss", "A scam", "A date"], a: 0, e: "Always take the match." },
            { q: "Financial Freedom means:", o: ["Assets pay your bills", "Being rich", "Having a job"], a: 0, e: "You don't have to work." }
        ],
        lessons: [
            { type: 'info', title: "Net Worth" },
            { type: 'calculator', title: "Freedom Number" },
            { type: 'fun_fact', title: "Roth IRA Cap" },
            { type: 'tap_lie', title: "Credit Score" },
            { type: 'meme', title: "Retirement Goal" },
            { type: 'fun_fact', title: "Millionaire Habits" },
            { type: 'scenario', title: "Job Offer 401k" },
            { type: 'swipe', title: "Rich vs Wealthy" }
        ]
    }
};

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    const levelId = `${worldId}_l${levelNum}`;
    const rng = new SeededRNG(levelId);
    
    // Get Theme Data
    const theme = WORLD_THEMES[worldId] || WORLD_THEMES['world1'];

    // 1. BOSS GENERATION (Progressive Difficulty)
    const allQuestions = theme.questions;
    // Shuffle and pick 5-8 questions to ensure replayability isn't identical
    const bossQuiz: BossQuestion[] = [];
    const shuffledQs = rng.pickSubset(allQuestions, 8); // Pick 8 unique questions

    shuffledQs.forEach(q => {
        bossQuiz.push({
            question: q.q,
            options: q.o,
            correctIndex: q.a,
            explanation: q.e
        });
    });

    const level: LevelData = {
        id: levelId,
        worldId,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${theme.boss}`,
        description: "Win to earn your Badge!",
        bossName: theme.boss,
        bossImage: theme.bossImg,
        bossIntro: `I've crushed ${rng.next().toFixed(2).slice(2)} bank accounts. You're next.`,
        bossQuiz
    };

    // 2. LESSON GENERATION (Microlearning)
    const lessons: Lesson[] = [];
    const templateLessons = theme.lessons;
    
    // Generate 6-8 lessons per level
    const numLessons = 6 + Math.floor(rng.next() * 3); // 6, 7, or 8

    for (let i = 0; i < numLessons; i++) {
        const lessonId = `${levelId}_les${i}`;
        const template = templateLessons[i % templateLessons.length];
        
        let content: any = {};
        
        // Content Fillers based on type
        if (template.type === 'fun_fact') {
            const fact = rng.pick(FUN_FACTS);
            content = { text: fact.text, factSource: fact.source };
        } else if (template.type === 'swipe') {
            content = { cards: [
                { text: "Buying coffee daily", isRight: false, label: "Drain" },
                { text: "Investing $5", isRight: true, label: "Gain" },
                { text: "Tracking spending", isRight: true, label: "Smart" },
                { text: "Payday Loans", isRight: false, label: "Trap" }
            ]};
        } else if (template.type === 'tap_lie') {
            content = { statements: [
                { text: "Banks are your friend", isLie: true },
                { text: "Credit cards are free money", isLie: true },
                { text: "Compound interest helps you", isLie: false }
            ]};
        } else if (template.type === 'calculator') {
            content = { label: "Value of $100 invested for 50 years", resultLabel: "$4,690", formula: "auto" };
        } else if (template.type === 'info') {
            content = { text: "Pay close attention: This concept is the key to defeating the boss." };
        } else if (template.type === 'scenario') {
             content = { 
                 text: "You found $100 on the ground. Friends say 'Party!', Logic says 'Invest'. What do you do?", 
                 cards: [{text: "Invest it", isRight: true, label: "Win"}, {text: "Party", isRight: false, label: "Loss"}] 
             };
        } else if (template.type === 'meme') {
             content = { imageUrl: "https://i.imgflip.com/1ur9b0.jpg", topText: "ME", bottomText: "SAVING $1" };
        } else if (template.type === 'drag_drop') {
            content = {
                buckets: ["Asset", "Liability"],
                items: [
                    { id: "1", text: "Rental Property", category: "Asset" },
                    { id: "2", text: "New Car", category: "Liability" },
                    { id: "3", text: "Credit Card Debt", category: "Liability" },
                    { id: "4", text: "Stock Portfolio", category: "Asset" }
                ]
            }
        }

        lessons.push({
            id: lessonId,
            worldId,
            levelId,
            order: i,
            type: template.type === 'scenario' ? 'swipe' : template.type, // Map scenario to swipe for UI compatibility
            title: template.title,
            xpReward: 50 + (i * 5),
            coinReward: 25 + (i * 2),
            popularity: (rng.next() * 10 + 1).toFixed(1) + "k",
            content
        });
    }

    return { level, lessons };
};

export const getRandomRoast = () => {
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};
