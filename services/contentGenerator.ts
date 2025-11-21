
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

// NEW: Detailed Question Database for Boss Battles
const BOSS_QUESTIONS_DB: Record<string, Array<{ q: string, o: string[], a: number, e: string }>> = {
    world1: [ // Basics
        { q: "You find $20 on the street. What do you do?", o: ["Buy candy immediately", "Save it for a rainy day", "Burn it"], a: 1, e: "Found money is still money. Save it!" },
        { q: "The ATM charges a $5 fee. Worth it?", o: ["No, find my bank's ATM", "Yes, I need cash NOW", "Steal the ATM"], a: 0, e: "ATM fees are money trash. Avoid them." },
        { q: "Inflation makes your money worth...", o: ["More", "Less", "The same"], a: 1, e: "Inflation decreases purchasing power over time." },
        { q: "What is 'Fiat' money?", o: ["A car brand", "Government-issued currency", "Crypto"], a: 1, e: "Fiat is money backed by trust in the government, not gold." },
        { q: "Why do banks pay interest?", o: ["They are nice", "To borrow your money", "It's a glitch"], a: 1, e: "Banks pay you to use your money for loans to others." },
        { q: "A 'Need' is something essential like:", o: ["Food", "Netflix", "Gucci Slides"], a: 0, e: "Needs keep you alive. Wants keep you entertained." },
        { q: "Which loses value over time?", o: ["Gold", "Cash under a mattress", "Real Estate"], a: 1, e: "Cash loses value to inflation if not invested." },
        { q: "Gross Income is:", o: ["Money before taxes", "Money after taxes", "Disgusting money"], a: 0, e: "Gross is total. Net is what you actually keep." }
    ],
    world2: [ // Budgeting
        { q: "The 50/30/20 rule says 50% goes to:", o: ["Wants", "Needs", "Savings"], a: 1, e: "50% Needs, 30% Wants, 20% Savings." },
        { q: "You spend $5/day on coffee. That's approx:", o: ["$150/month", "$50/month", "$10/month"], a: 0, e: "Small habits add up. $150/mo is $1,800/year!" },
        { q: "A budget is:", o: ["A punishment", "A plan for your money", "Something for poor people"], a: 1, e: "Budgets give you freedom to spend without guilt." },
        { q: "Impulse buying is:", o: ["buying without thinking", "buying with a plan", "buying needs"], a: 0, e: "Impulse buys kill budgets. Wait 24 hours." },
        { q: "Which is a 'Fixed Expense'?", o: ["Groceries", "Rent", "Movie Tickets"], a: 1, e: "Fixed expenses stay the same every month." },
        { q: "How much should you save for emergencies?", o: ["$10", "3-6 months of expenses", "Nothing"], a: 1, e: "3-6 months gives you a safety net." },
        { q: "Tracking expenses helps you:", o: ["Feel bad", "See where money goes", "Lose time"], a: 1, e: "You can't improve what you don't measure." },
        { q: "What is the 'envelope method'?", o: ["Mailing cash", "Cash budgeting system", "Paper maché"], a: 1, e: "Putting cash in envelopes for categories stops overspending." }
    ],
    world3: [ // Compound Interest
        { q: "Compound interest is:", o: ["Interest on interest", "Simple interest", "A bank fee"], a: 0, e: "Money making money on top of money." },
        { q: "The earlier you start investing...", o: ["The less you make", "The more you make", "It doesn't matter"], a: 1, e: "Time is the most powerful factor in compounding." },
        { q: "Rule of 72 calculates:", o: ["Retirement age", "Years to double money", "Tax rate"], a: 1, e: "Divide 72 by interest rate to see doubling time." },
        { q: "APR stands for:", o: ["Annual Percentage Rate", "Apple Pear Rice", "All People Rich"], a: 0, e: "It's the yearly cost of borrowing or earning." },
        { q: "Who becomes a millionaire faster?", o: ["Starter at 20", "Starter at 40", "Lottery player"], a: 0, e: "Starting at 20 gives you 20 extra years of growth." },
        { q: "Is high interest good?", o: ["Yes for savings, No for debt", "Always Yes", "Always No"], a: 0, e: "You want high interest on savings, low on debt." },
        { q: "A High Yield Savings Account (HYSA) pays:", o: ["0.01%", "4-5%", "50%"], a: 1, e: "HYSA pays way more than regular banks." },
        { q: "Inflation vs Compound Interest:", o: ["Inflation wins", "Compound Interest fights inflation", "They are the same"], a: 1, e: "Investing beats inflation over the long run." }
    ],
    world4: [ // Banking
        { q: "FDIC Insurance covers up to:", o: ["$1,000", "$250,000", "$1 Million"], a: 1, e: "Your money is safe up to $250k if the bank fails." },
        { q: "An Overdraft Fee happens when:", o: ["You spend more than you have", "You deposit too much", "You open the app"], a: 0, e: "Banks charge you for being broke. Turn off overdraft!" },
        { q: "Checking accounts are for:", o: ["Long term savings", "Daily spending", "Investing"], a: 1, e: "Checking is for flow, Savings is for stash." },
        { q: "What is a Routing Number?", o: ["Your password", "Bank ID number", "Your account ID"], a: 1, e: "Identifies which bank holds your money." },
        { q: "Direct Deposit is:", o: ["Paycheck straight to bank", "Going to the bank", "Mailing a check"], a: 0, e: "It's faster and often waives fees." },
        { q: "Should you share your PIN?", o: ["Yes, with friends", "Never", "Only with bank staff"], a: 1, e: "Never share your PIN. Not even with the bank." },
        { q: "Credit Unions are:", o: ["For-profit banks", "Non-profit member owned", "Government agencies"], a: 1, e: "Credit Unions often have lower fees and better service." },
        { q: "A Certificate of Deposit (CD) locks money for:", o: ["Higher interest", "Lower interest", "Fun"], a: 0, e: "You trade liquidity for a higher rate." }
    ],
    world5: [ // Debt
        { q: "Good Debt vs Bad Debt:", o: ["All debt is bad", "Mortgage = Good, Credit Card = Bad", "Credit Card = Good"], a: 1, e: "Debt that builds wealth (assets) is 'Good'. Consumer debt is 'Bad'." },
        { q: "If you miss a payment, your credit score:", o: ["Goes up", "Goes down", "Stays same"], a: 1, e: "Payment history is 35% of your score." },
        { q: "What is a 'Principal'?", o: ["School boss", "Original loan amount", "Interest rate"], a: 1, e: "You pay interest on the principal." },
        { q: "Payday loans usually have APRs of:", o: ["5%", "20%", "300%+"], a: 2, e: "Payday loans are predatory traps. Avoid!" },
        { q: "Minimum payments on credit cards:", o: ["Pay off debt fast", "Keep you in debt longer", "Are recommended"], a: 1, e: "Paying minimums mostly pays interest, not the balance." },
        { q: "A cosigner is:", o: ["A witness", "Someone responsible if you don't pay", "A bank teller"], a: 1, e: "Never cosign unless you are ready to pay the full debt." },
        { q: "Bankruptcy stays on your record for:", o: ["1 year", "7-10 years", "Forever"], a: 1, e: "It's a nuclear option. Destroys credit for a decade." },
        { q: "Snowball Method means:", o: ["Paying smallest debt first", "Paying largest debt first", "Throwing snow"], a: 0, e: "Psychological wins help you keep going." }
    ],
    world6: [ // Income/Taxes
        { q: "Net Income is:", o: ["Gross - Taxes", "Gross + Bonus", "Total Salary"], a: 0, e: "Net is what hits your bank account." },
        { q: "A W-2 form is for:", o: ["Employees", "Freelancers", "Stocks"], a: 0, e: "Employees get W-2s. Freelancers get 1099s." },
        { q: "A Side Hustle is:", o: ["Illegal work", "Extra income source", "A dance move"], a: 1, e: "Multiple income streams build wealth faster." },
        { q: "Income Tax pays for:", o: ["Roads & Military", "Netflix", "Amazon Prime"], a: 0, e: "Taxes fund public services." },
        { q: "Sales Tax is paid when:", o: ["You earn money", "You buy something", "You sleep"], a: 1, e: "Added to the price of goods at checkout." },
        { q: "A tax refund means:", o: ["Free money", "You overpaid taxes", "Government bonus"], a: 1, e: "You gave the govt an interest-free loan." },
        { q: "Gig economy jobs (Uber/DoorDash) represent:", o: ["Passive income", "Active income", "Portfolio income"], a: 1, e: "You trade time for money. That's active." },
        { q: "Passive income is:", o: ["Working hard", "Money earned while sleeping", "Winning lottery"], a: 1, e: "Assets paying you without daily work." }
    ],
    world7: [ // Investing
        { q: "A Stock represents:", o: ["Ownership in a company", "A loan to a company", "A product"], a: 0, e: "You own a tiny piece of the business." },
        { q: "Diversification means:", o: ["Buying only Tesla", "Don't put all eggs in one basket", "Saving cash"], a: 1, e: "Spread risk across many investments." },
        { q: "Bull Market means stocks are:", o: ["Going Up", "Going Down", "Sleeping"], a: 0, e: "Bull = Up (Horns up). Bear = Down (Claws down)." },
        { q: "An Index Fund (S&P 500):", o: ["Buys 1 company", "Buys top 500 companies", "Is risky"], a: 1, e: "Instant diversification. Bet on the whole economy." },
        { q: "Dividends are:", o: ["Fees you pay", "Profits paid to shareholders", "Math problems"], a: 1, e: "Cash payments just for owning a stock." },
        { q: "Buy Low, Sell...", o: ["Lower", "High", "Never"], a: 1, e: "The basic rule of profit." },
        { q: "Crypto is considered:", o: ["Safe asset", "High risk asset", "Currency only"], a: 1, e: "High volatility means high risk." },
        { q: "FOMO investing leads to:", o: ["Big gains", "Buying at the top (losing)", "Stability"], a: 1, e: "Fear Of Missing Out makes you buy when expensive." }
    ],
    world8: [ // Wealth
        { q: "Assets put money in your pocket. Liabilities...", o: ["Take it out", "Keep it safe", "Double it"], a: 0, e: "Rich people buy assets. Poor people buy liabilities." },
        { q: "A Roth IRA is great because:", o: ["Tax-free withdrawals", "Free money", "No limits"], a: 0, e: "Pay taxes now, zero taxes at retirement." },
        { q: "Net Worth formula:", o: ["Income - Expenses", "Assets - Liabilities", "Cash + Car"], a: 1, e: "What you OWN minus what you OWE." },
        { q: "The 4% Rule is for:", o: ["Tipping", "Retirement spending", "Interest rates"], a: 1, e: "Safe withdrawal rate to never run out of money." },
        { q: "Lifestyle Creep is:", o: ["Spending more as you earn more", "Walking slowly", "Buying old clothes"], a: 0, e: "Avoid it to build wealth. Keep living like a student." },
        { q: "Real Estate can provide:", o: ["Cash flow & Appreciation", "Headaches only", "Instant cash"], a: 0, e: "Rent checks + value going up." },
        { q: "Financial Independence means:", o: ["Being rich", "Assets cover living expenses", "Owning a yacht"], a: 1, e: "You don't HAVE to work to survive." },
        { q: "Estate Planning is:", o: ["Building a mansion", "Plan for assets after death", "Gardening"], a: 1, e: "Deciding who gets your stuff when you die." }
    ]
};

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
    const worldBossNames = BOSS_NAMES[worldId] || BOSS_NAMES['world1'];
    const bossName = worldBossNames[(levelNum - 1) % worldBossNames.length];
    
    const worldBossEmojis = BOSS_EMOJIS[worldId] || BOSS_EMOJIS['world1'];
    const bossImage = rng.pick(worldBossEmojis);

    const worldTrashTalk = BOSS_TRASH_TALK[worldId] || BOSS_TRASH_TALK['world1'];
    const bossIntro = rng.pick(worldTrashTalk);

    // FIXED: Use the detailed question DB instead of generic loop
    const worldQs = BOSS_QUESTIONS_DB[worldId] || BOSS_QUESTIONS_DB['world1'];
    
    // Ensure we have enough pool, duplicate if needed to avoid crash on small pools
    let questionPool = [...worldQs];
    if (questionPool.length < 5) questionPool = [...questionPool, ...questionPool];
    
    const selectedQs = rng.pickSubset(questionPool, 5);

    const bossQuiz: BossQuestion[] = selectedQs.map(q => ({
        question: q.q,
        options: q.o,
        correctIndex: q.a,
        explanation: q.e
    }));

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
            return { cards: rng.pickSubset(SCENARIOS, 4) };
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
        case 'drag_drop':
            const sortItems = [
                { id: 's1', text: "Netflix Sub", category: "Wants" },
                { id: 's2', text: "Rent", category: "Needs" },
                { id: 's3', text: "Groceries", category: "Needs" },
                { id: 's4', text: "New Jordans", category: "Wants" },
                { id: 's5', text: "Bus Pass", category: "Needs" },
                { id: 's6', text: "Concert Tix", category: "Wants" },
                { id: 's7', text: "Electricity", category: "Needs" },
                { id: 's8', text: "Video Games", category: "Wants" }
            ];
            return { 
                buckets: ['Needs', 'Wants'],
                items: rng.pickSubset(sortItems, 4) 
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
