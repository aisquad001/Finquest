
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
    world1: ["Allowance Goblin", "The Cash Burner", "Zero-Balance Zombie", "The Price Hiker", "Fiat Phantom"],
    world2: ["Shein Haul Hydra", "Impulse Buy Kraken", "Subscription Sea Monster", "Prom Night Predator", "The Frappuccino Fiend"],
    world3: ["Compound Interest Crusher", "Savings Saboteur", "The Daily Spender", "Yield Yapper", "Cash Drag Dragon"],
    world4: ["Bank Fee Bandit", "Identity Thief", "Minimum Balance Minotaur", "Overdraft Ogre", "Check Fraud Chimp"],
    world5: ["Credit Card Kraken", "Payday Loan Shark", "Klarna Trap King", "APR Assassin", "Debt Snowball Yeti"],
    world6: ["Taxman Titan", "Side Hustle Hater", "Gross Income Ghoul", "W-2 Wraith", "Gig Economy Gargoyle"],
    world7: ["Index Fund Angel", "Meme Stock Casino Dealer", "Rug Pull Rex", "Day Trade Dino", "FOMO Phantom"],
    world8: ["The Retirement Reaper", "Inflation Inquisitor", "Social Security Skeleton", "Golden Handcuff Golem", "Lifestyle Creep"]
};

const BOSS_EMOJIS: Record<string, string[]> = {
    world1: ["👺", "💸", "🚮", "🌡️"],
    world2: ["🛍️", "💅", "🥤", "👗"],
    world3: ["⏳", "📉", "🛑", "🧊"],
    world4: ["🏦", "🕵️", "🐀", "🕸️"],
    world5: ["💳", "🦈", "⛓️", "🩸"],
    world6: ["🧛", "📝", "💼", "📉"],
    world7: ["🎰", "🐻", "🤡", "📉"],
    world8: ["💀", "👴", "⚰️", "🥀"]
};

const BOSS_TRASH_TALK: Record<string, string[]> = {
    world1: ["Hand over the $20, kid!", "Your Fortnite skins won’t save you.", "I eat purchasing power for breakfast!", "Prices just went up 10%!"],
    world2: ["One more top won’t hurt.", "Free shipping = free debt.", "Treat yourself... to poverty!", "But it's on sale!"],
    world3: ["Time is running out!", "Why save when you can spend?", "Future you can deal with being broke!", "YOLO means You Only Lose Once!"],
    world4: ["I see your password is 'password123'!", "Monthly maintenance fees engaged!", "Overdraft fee: $35. Cry about it."],
    world5: ["29% interest tastes like freedom.", "Minimum payment = forever payment.", "Klarna now, cry later.", "I own your future income!"],
    world6: ["The IRS is watching!", "Work harder, earn less!", "Your side hustle is a joke!", "Taxes take half!"],
    world7: ["Boring = rich? No, boring = boring!", "It's going to the moon, trust me!", "Rug pull incoming!", "Diamond hands? More like paper hands!"],
    world8: ["No Roth IRA? I’m coming for you at 65.", "Social Security is empty!", "Welcome to the poor house!"]
};

// EXPANDED SCENARIOS (For Swipe Lessons) - 50+ Unique Items
const SCENARIOS = [
    { text: "Buying AirPods Pro 2 when you have working ears", isRight: false, label: "Consumerism" },
    { text: "Meal prepping instead of DoorDash daily", isRight: true, label: "Chef Mode" },
    { text: "Investing $50 in S&P 500", isRight: true, label: "Future Millionaire" },
    { text: "Buying a monkey JPEG for $10k", isRight: false, label: "Rugged" },
    { text: "Using a credit card for points (and paying it off)", isRight: true, label: "Points God" },
    { text: "Maxing out credit card for clout", isRight: false, label: "Broke Soon" },
    { text: "Emergency fund in a High Yield Savings Account", isRight: true, label: "Smart Stash" },
    { text: "Keeping savings under the mattress", isRight: false, label: "Inflation L" },
    { text: "Buying generic meds (same ingredients)", isRight: true, label: "Galaxy Brain" },
    { text: "Paying for gym membership but never going", isRight: false, label: "Donation" },
    { text: "Checking bank account scaries", isRight: true, label: "Awareness" },
    { text: "Ignoring bank notifications", isRight: false, label: "Delusional" },
    { text: "Buying a car you can't afford to impress people you hate", isRight: false, label: "Ego Trap" },
    { text: "Walking/Biking to save gas", isRight: true, label: "Fitness + $" },
    { text: "Subscription for an app you opened once", isRight: false, label: "Cancel It" },
    { text: "Selling old clothes on Depop", isRight: true, label: "Hustle" },
    { text: "Buying limited edition drops on resale", isRight: false, label: "Markup L" },
    { text: "Waiting 30 days before big purchase", isRight: true, label: "Discipline" },
    { text: "Buying water bottles when tap is free", isRight: false, label: "Waste" },
    { text: "Using student discounts everywhere", isRight: true, label: "Frugal King" },
    { text: "Ordering water at the club", isRight: true, label: "Hydro Homie" },
    { text: "Buying skins for a game you suck at", isRight: false, label: "Skill Issue" },
    { text: "Pre-gaming before the bar", isRight: true, label: "Budget W" },
    { text: "Buying coffee daily ($7)", isRight: false, label: "Leak" },
    { text: "Bringing lunch to work/school", isRight: true, label: "Savings" },
    { text: "Leasing a luxury car on minimum wage", isRight: false, label: "Down Bad" },
    { text: "Buying textbooks new", isRight: false, label: "Scam" },
    { text: "Renting textbooks / PDF", isRight: true, label: "Scholar" },
    { text: "Subscribing to OnlyFans... of a cat", isRight: false, label: "Down Bad" },
    { text: "Unsubscribing from marketing emails", isRight: true, label: "Focus" },
    { text: "Buying brand name cereal vs generic", isRight: false, label: "Marketing Tax" },
    { text: "Thrifting for vintage drip", isRight: true, label: "Style W" },
    { text: "Gambling allowance on sports parlay", isRight: false, label: "Donation" },
    { text: "Using library for books/movies", isRight: true, label: "Free" },
    { text: "Buying a boat", isRight: false, label: "Money Pit" },
    { text: "Renting a boat for a day", isRight: true, label: "Smart Fun" },
    { text: "Using a coupon code plugin", isRight: true, label: "Tech Savvy" },
    { text: "Paying full price for electronics", isRight: false, label: "Wait 4 Sale" },
    { text: "Repairing old shoes instead of new ones", isRight: true, label: "Sustainable" },
    { text: "Buying in bulk for one person", isRight: false, label: "Spoilage" },
    { text: "Sharing streaming passwords (until caught)", isRight: true, label: "Teamwork" },
    { text: "Buying a pet you can't afford vet bills for", isRight: false, label: "Cruel" },
    { text: "Learning a high income skill on YouTube", isRight: true, label: "ROI" },
    { text: "Watching 'Get Rich Quick' scams", isRight: false, label: "Waste" },
    { text: "Buying a warranty on a toaster", isRight: false, label: "Sucker" },
    { text: "Filing taxes late", isRight: false, label: "Penalty" },
    { text: "Automating your savings transfer", isRight: true, label: "Genius" },
    { text: "Checking credit score once a month", isRight: true, label: "Responsible" },
    { text: "Co-signing a loan for a boyfriend/girlfriend", isRight: false, label: "Disaster" }
];

// MASSIVE BOSS QUESTION DATABASE (Expanded for Uniqueness)
const BOSS_QUESTIONS_DB: Record<string, Array<{ q: string, o: string[], a: number, e: string }>> = {
    world1: [ // Basics
        { q: "You find $20. The smartest move is:", o: ["Spend it fast", "Save it", "Burn it"], a: 1, e: "Free money? Keep it." },
        { q: "ATM fees are:", o: ["A scam", "Necessary", "Fun"], a: 0, e: "Avoid them. Use your own bank's ATM." },
        { q: "Inflation means:", o: ["Money is worth less", "Prices drop", "You get richer"], a: 0, e: "Prices go up, dollar value goes down." },
        { q: "Fiat money is backed by:", o: ["Gold", "Government Trust", "Nothing"], a: 1, e: "It's paper with a promise." },
        { q: "Banks pay interest to:", o: ["Be nice", "Borrow your cash", "Trick you"], a: 1, e: "They use your money to make more money." },
        { q: "Needs vs Wants: Which is a NEED?", o: ["Water", "Netflix", "New Shoes"], a: 0, e: "You die without water. You survive without Netflix." },
        { q: "Cash loses value because of:", o: ["Inflation", "Deflation", "Magic"], a: 0, e: "The silent thief." },
        { q: "Gross Income is:", o: ["After tax", "Before tax", "Yucky money"], a: 1, e: "The big number before the government takes their cut." },
        { q: "Bartering is:", o: ["Trading goods", "Stealing", "Buying"], a: 0, e: "Swapping stuff directly." },
        { q: "Supply and Demand: Low supply means?", o: ["Higher Price", "Lower Price", "No Price"], a: 0, e: "Rare things cost more." },
        { q: "Opportunity Cost is:", o: ["What you give up", "The price tag", "A sale"], a: 0, e: "The value of the next best alternative." },
        { q: "Deflation is when:", o: ["Prices drop", "Prices rise", "Balloons pop"], a: 0, e: "Sounds good but usually means a bad economy." },
        { q: "Liquid Assets are:", o: ["Cash/Easy to sell", "Water", "Frozen assets"], a: 0, e: "Can you buy a taco with it right now?" },
        { q: "Money's main job is:", o: ["Medium of exchange", "To look pretty", "To burn"], a: 0, e: "It helps us trade efficiently." },
        { q: "Scarcity means:", o: ["Unlimited stuff", "Limited resources", "Fear"], a: 1, e: "There isn't enough for everyone to have everything." },
        { q: "A 'Budget' is:", o: ["A spending plan", "A restriction", "Useless"], a: 0, e: "Tell your money where to go." },
        { q: "Impulse buying is:", o: ["Planned", "Emotional", "Smart"], a: 1, e: "Buying feelings, not things." },
        { q: "Emergency Fund should cover:", o: ["3-6 months", "1 week", "1 day"], a: 0, e: "Job loss protection." },
        { q: "Pay Yourself First means:", o: ["Save before spending", "Buy toys first", "Eat first"], a: 0, e: "Prioritize your future self." },
        { q: "Lifestyle Creep is:", o: ["Spending more as you earn more", "Walking slow", "Scary"], a: 0, e: "Avoid it to build wealth." }
    ],
    world2: [ // Budgeting
        { q: "50/30/20 Rule: 50% is for?", o: ["Needs", "Wants", "Savings"], a: 0, e: "Essentials first." },
        { q: "Latte Factor means:", o: ["Small expenses add up", "Coffee is good", "Milk price"], a: 0, e: "$5 a day is $1800 a year." },
        { q: "Zero-Based Budgeting:", o: ["Income - Expense = 0", "Having $0", "Spending nothing"], a: 0, e: "Give every dollar a job." },
        { q: "Envelope System uses:", o: ["Cash", "Email", "Credit"], a: 0, e: "Physical limits on spending." },
        { q: "Sinking Fund is for:", o: ["Planned big expenses", "Emergencies", "Boats"], a: 0, e: "Save monthly for a yearly bill." },
        { q: "Fixed Expense example:", o: ["Rent", "Groceries", "Gas"], a: 0, e: "Same amount every month." },
        { q: "Variable Expense example:", o: ["Electricity", "Rent", "Netflix"], a: 0, e: "Changes based on usage." },
        { q: "Net Worth calculation:", o: ["Assets - Liabilities", "Income + Expenses", "Cash only"], a: 0, e: "What you own minus what you owe." },
        { q: "Budgeting App benefit:", o: ["Tracks spending auto", "Costs money", "Annoying"], a: 0, e: "Automation wins." },
        { q: "Buying generic brands:", o: ["Saves money", "Is dangerous", "Tastes bad"], a: 0, e: "Usually the exact same ingredients." },
        { q: "The 24-hour rule:", o: ["Wait before buying", "Stay awake", "Party time"], a: 0, e: "Cures impulse buying." },
        { q: "Subscription fatigue:", o: ["Too many monthly fees", "Tired of Netflix", "Gym"], a: 0, e: "Cancel what you don't use." },
        { q: "Bulk buying helps if:", o: ["You use it all", "It expires", "You hate it"], a: 0, e: "Unit price is lower." },
        { q: "Eating out vs Cooking:", o: ["Cooking saves 300%+", "Same cost", "Eating out is healthy"], a: 0, e: "Restaurant markups are huge." },
        { q: "Price matching:", o: ["Getting lower price", "Dating app", "Game"], a: 0, e: "Stores match competitors." }
    ],
    world3: [ // Compound Interest
        { q: "Compound Interest is:", o: ["Interest on Interest", "Simple addition", "Magic"], a: 0, e: "Money making money." },
        { q: "Rule of 72 finds:", o: ["Doubling time", "Retirement age", "Tax"], a: 0, e: "72 / Rate = Years." },
        { q: "Start investing:", o: ["Early", "Late", "Never"], a: 0, e: "Time is your best friend." },
        { q: "APR vs APY:", o: ["APY includes compounding", "APR is better", "Same"], a: 0, e: "APY is what you actually earn." },
        { q: "Inflation hedge:", o: ["Stocks/Assets", "Cash", "Nothing"], a: 0, e: "Assets grow with inflation." },
        { q: "High Yield Savings pays:", o: ["More than regular", "Less", "Same"], a: 0, e: "Free money basically." },
        { q: "Debt compounding:", o: ["Is bad", "Is good", "Doesn't happen"], a: 0, e: "You owe interest on interest." },
        { q: "Time in the market vs Timing:", o: ["Time in wins", "Timing wins", "Both fail"], a: 0, e: "Don't guess, just hold." },
        { q: "Exponential growth:", o: ["Curved up", "Straight line", "Flat"], a: 0, e: "Snowball effect." },
        { q: "Einstein called it:", o: ["8th Wonder", "Boring", "Scam"], a: 0, e: "Compound interest." },
        { q: "Frequency matters:", o: ["Daily compounding wins", "Yearly wins", "Monthly wins"], a: 0, e: "More frequent = more money." },
        { q: "Principal is:", o: ["Starting money", "School boss", "Interest"], a: 0, e: "The base amount." },
        { q: "Rate of Return:", o: ["Profit %", "Speed", "Tax"], a: 0, e: "How fast money grows." },
        { q: "Passive Income:", o: ["Money while sleeping", "Job", "Hustle"], a: 0, e: "Goal of compounding." },
        { q: "Snowball effect:", o: ["Growing momentum", "Cold", "Winter"], a: 0, e: "Small starts lead to big ends." }
    ],
    world4: [ // Banking
        { q: "FDIC insures:", o: ["$250k", "$1M", "$0"], a: 0, e: "Govt backs your bank cash." },
        { q: "Overdraft fee:", o: ["Penalty for $0 balance", "Bonus", "Tax"], a: 0, e: "Banks charging you for being broke." },
        { q: "Checking vs Savings:", o: ["Spending vs Storing", "Same", "Checking earns more"], a: 0, e: "Don't spend your savings." },
        { q: "Routing Number:", o: ["Bank ID", "Account ID", "Phone Num"], a: 0, e: "Identifies the bank." },
        { q: "Direct Deposit:", o: ["Auto paycheck", "Check", "Cash"], a: 0, e: "Faster and safer." },
        { q: "Credit Union:", o: ["Member owned", "For profit", "Govt"], a: 0, e: "Usually better rates." },
        { q: "CD (Certificate of Deposit):", o: ["Locked savings", "Music", "Loan"], a: 0, e: "Higher rate for locking money." },
        { q: "Minimum Balance Fee:", o: ["Avoid it", "Pay it", "Good thing"], a: 0, e: "Don't pay to keep money." },
        { q: "2FA:", o: ["Security", "Game", "Fee"], a: 0, e: "Protect your login." },
        { q: "Phishing:", o: ["Scam emails", "Fishing", "Music"], a: 0, e: "Don't click links." },
        { q: "ATM Skimmer:", o: ["Steals card info", "Cleans ATM", "Dispenses cash"], a: 0, e: "Wiggle the reader." },
        { q: "P2P Payment:", o: ["Venmo/Zelle", "Wire", "Check"], a: 0, e: "Friend to friend." },
        { q: "Unbanked:", o: ["No account", "Rich", "Happy"], a: 0, e: "Expensive to live without bank." },
        { q: "Online Banks:", o: ["Lower fees", "Unsafe", "Fake"], a: 0, e: "Less overhead = better rates." },
        { q: "Statement:", o: ["Transaction list", "Speech", "Bill"], a: 0, e: "Review it monthly." }
    ],
    world5: [ // Debt
        { q: "Good Debt:", o: ["appreciating asset", "Shoes", "Dinner"], a: 0, e: "House/Education (maybe)." },
        { q: "Bad Debt:", o: ["Credit Card", "Mortgage", "Business Loan"], a: 0, e: "High interest consumer junk." },
        { q: "Credit Score range:", o: ["300-850", "0-100", "A-F"], a: 0, e: "850 is perfect." },
        { q: "Payment History %:", o: ["35%", "10%", "50%"], a: 0, e: "Most important factor." },
        { q: "Utilization Ratio:", o: ["Keep under 30%", "Max it out", "0%"], a: 0, e: "Don't look desperate for credit." },
        { q: "Hard Inquiry:", o: ["Applying for credit", "Checking own score", "Asking hard question"], a: 0, e: "Drops score slightly." },
        { q: "Secured Card:", o: ["Requires deposit", "Free", "Black card"], a: 0, e: "Builds credit safely." },
        { q: "Predatory Lending:", o: ["Payday loans", "Mortgage", "Bank loan"], a: 0, e: "Insane interest rates." },
        { q: "Co-signer:", o: ["Liable for debt", "Reference", "Friend"], a: 0, e: "Don't do it." },
        { q: "Bankruptcy:", o: ["Last resort", "Free restart", "Easy"], a: 0, e: "Ruins credit for years." },
        { q: "Snowball Method:", o: ["Smallest balance first", "Highest rate", "Random"], a: 0, e: "Momentum builder." },
        { q: "Avalanche Method:", o: ["Highest rate first", "Smallest balance", "Largest balance"], a: 0, e: "Math winner." },
        { q: "Interest Rate:", o: ["Cost of borrowing", "Profit", "Fee"], a: 0, e: "Lower is better for loans." },
        { q: "Grace Period:", o: ["Time before interest", "Prayer", "Late fee"], a: 0, e: "Pay before it ends." },
        { q: "Minimum Payment:", o: ["Avoid paying only this", "Goal", "Maximum"], a: 0, e: "Keeps you in debt." }
    ],
    world6: [ // Income & Taxes
        { q: "Net Pay:", o: ["Take home", "Gross", "Bonus"], a: 0, e: "After taxes." },
        { q: "W-4 Form:", o: ["Tax withholding", "Hiring", "Firing"], a: 0, e: "Tells boss how much tax to take." },
        { q: "1040 Form:", o: ["Tax Return", "Police code", "Radio"], a: 0, e: "File it every April." },
        { q: "Gig Economy:", o: ["Freelance/Uber", "Concert", "Big"], a: 0, e: "Self-employed hustle." },
        { q: "Side Hustle:", o: ["Extra income", "Main job", "Dance"], a: 0, e: "Diversify income." },
        { q: "Passive Income:", o: ["No active work", "Salary", "Hourly"], a: 0, e: "Rent/Dividends." },
        { q: "Tax Refund:", o: ["Overpayment return", "Gift", "Bonus"], a: 0, e: "You loaned govt money for free." },
        { q: "FICA:", o: ["Social Security/Medicare", "Plant", "Car"], a: 0, e: "Mandatory deduction." },
        { q: "Capital Gains:", o: ["Profit on assets", "Salary", "Loss"], a: 0, e: "Tax on selling stocks/house." },
        { q: "Sales Tax:", o: ["Consumption tax", "Income tax", "Property tax"], a: 0, e: "Pay when buying." },
        { q: "Progressive Tax:", o: ["Earn more pay more %", "Flat", "Regressive"], a: 0, e: "US System." },
        { q: "Deduction:", o: ["Lowers taxable income", "Increases tax", "Penalty"], a: 0, e: "Save receipts." },
        { q: "Salary Negotiation:", o: ["Do it", "Rude", "Illegal"], a: 0, e: "Get paid your worth." },
        { q: "Benefits:", o: ["Health/401k", "Salary", "Taxes"], a: 0, e: "Part of compensation." },
        { q: "Gross Pay:", o: ["Total before tax", "Net", "Hourly"], a: 0, e: "The big number." }
    ],
    world7: [ // Investing
        { q: "Stock:", o: ["Ownership share", "Loan", "Bond"], a: 0, e: "Piece of a company." },
        { q: "IPO:", o: ["Initial Public Offering", "Phone", "Space"], a: 0, e: "Company goes public." },
        { q: "Dividend:", o: ["Profit share", "Fee", "Tax"], a: 0, e: "Cash payment to owners." },
        { q: "Bull Market:", o: ["Rising prices", "Falling", "Flat"], a: 0, e: "Optimism." },
        { q: "Bear Market:", o: ["Falling prices", "Rising", "Zoo"], a: 0, e: "Pessimism." },
        { q: "ETF:", o: ["Basket of stocks", "Crypto", "Single stock"], a: 0, e: "Instant diversification." },
        { q: "Diversification:", o: ["Spread risk", "Focus risk", "No risk"], a: 0, e: "Don't go all in on one." },
        { q: "Volatility:", o: ["Price swings", "Stability", "Volume"], a: 0, e: "Risk measure." },
        { q: "Market Cap:", o: ["Company value", "Hat", "Limit"], a: 0, e: "Shares x Price." },
        { q: "S&P 500:", o: ["Top 500 US co", "Race", "Crypto"], a: 0, e: "Benchmark index." },
        { q: "Brokerage:", o: ["Account to trade", "Bank", "Loan"], a: 0, e: "Where you buy stocks." },
        { q: "Bond:", o: ["Loan to entity", "Stock", "James"], a: 0, e: "Safer than stocks usually." },
        { q: "Buy and Hold:", o: ["Long term strategy", "Day trade", "Panic"], a: 0, e: "Time in market wins." },
        { q: "Dollar Cost Average:", o: ["Consistent investing", "Timing market", "Lump sum"], a: 0, e: "Buy same amount regularly." },
        { q: "Crypto:", o: ["Digital currency", "Stock", "Gold"], a: 0, e: "High risk asset." }
    ],
    world8: [ // Wealth
        { q: "Roth IRA:", o: ["Tax free withdrawal", "Tax deduction", "Employer"], a: 0, e: "Pay tax now, none later." },
        { q: "401k:", o: ["Employer plan", "Bank", "Stock"], a: 0, e: "Often has match." },
        { q: "Asset:", o: ["Puts money in pocket", "Takes money", "Liability"], a: 0, e: "Builds wealth." },
        { q: "Liability:", o: ["Takes money out", "Asset", "Income"], a: 0, e: "Debt/Expenses." },
        { q: "Net Worth:", o: ["Assets - Liabilities", "Income", "Cash"], a: 0, e: "Wealth score." },
        { q: "Inflation Hedge:", o: ["Real Estate/Stocks", "Cash", "Bonds"], a: 0, e: "Beats inflation." },
        { q: "FIRE:", o: ["Retire Early", "Burn", "Job"], a: 0, e: "Financial Independence." },
        { q: "Estate Plan:", o: ["Will/Trust", "House", "Garden"], a: 0, e: "Pass wealth on." },
        { q: "Generational Wealth:", o: ["For kids/grandkids", "For you", "Spent"], a: 0, e: "Legacy." },
        { q: "Pre-tax vs Post-tax:", o: ["Tax timing", "Amount", "Legal"], a: 0, e: "401k vs Roth." },
        { q: "Diversified Portfolio:", o: ["Mix of assets", "All stocks", "All crypto"], a: 0, e: "Safety." },
        { q: "Liquidity:", o: ["Access to cash", "Water", "Oil"], a: 0, e: "Emergency need." },
        { q: "Appreciation:", o: ["Value up", "Value down", "Thanks"], a: 0, e: "Houses usually appreciate." },
        { q: "Depreciation:", o: ["Value down", "Value up", "Sad"], a: 0, e: "Cars depreciate fast." },
        { q: "Lifestyle Inflation:", o: ["Spending raises", "Good thing", "Goal"], a: 0, e: "Avoid to get rich." }
    ]
};

const MEME_TEMPLATES = [
    { url: "https://i.imgflip.com/1ur9b0.jpg", top: "ME CHECKING BANK ACCOUNT", bottom: "AFTER THE WEEKEND" },
    { url: "https://i.imgflip.com/4t0m5.jpg", top: "ME EXPLAINING STOCKS", bottom: "TO MY MOM" },
    { url: "https://i.imgflip.com/2wifvo.jpg", top: "USING CREDIT CARD", bottom: "FUTURE ME'S PROBLEM" },
    { url: "https://i.imgflip.com/26am.jpg", top: "WAITING FOR PAYDAY", bottom: "LIKE..." },
    { url: "https://i.imgflip.com/1jwhww.jpg", top: "WHEN THE DIP", bottom: "KEEPS DIPPING" },
    { url: "https://i.imgflip.com/30b1gx.jpg", top: "REJECTING SAVINGS", bottom: "CHASING TIKTOK TRENDS" },
    { url: "https://i.imgflip.com/1g8my4.jpg", top: "ME IGNORING BUDGET", bottom: "DURING SHEIN SALE" },
    { url: "https://i.imgflip.com/28j0te.jpg", top: "INVESTING $5", bottom: "WHERE LAMBO?" },
    { url: "https://i.imgflip.com/1h7in3.jpg", top: "I AM ONCE AGAIN ASKING", bottom: "FOR FINANCIAL LITERACY" },
    { url: "https://i.imgflip.com/1otk96.jpg", top: "CHANGE MY MIND:", bottom: "COFFEE AT HOME > STARBUCKS" }
];

// --- UNIQUE LESSON OVERRIDES ---
const STATIC_LESSON_OVERRIDES: Record<string, Partial<Lesson>> = {
    // World 1 Level 1
    "world1_l1_les0": {
        type: 'swipe',
        title: "AirPods or Food?",
        content: { cards: [
            { text: "Buying AirPods Pro 2 instead of lunch", isRight: false, label: "Starving" },
            { text: "Cooking at home", isRight: true, label: "Smart" },
            { text: "You won’t die without AirPods Pro 2 😂", isRight: true, label: "Fact" }
        ]}
    },
    "world1_l1_les3": {
        type: 'calculator',
        title: "The Millionaire Math",
        content: {
            label: "If you invest $100/month at 10% return for 40 years...",
            formula: "auto",
            resultLabel: "$632,407" // Updated to concrete number
        }
    }
};

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

    const worldQs = BOSS_QUESTIONS_DB[worldId] || BOSS_QUESTIONS_DB['world1'];
    
    // Pick 5 unique questions
    const selectedQs = rng.pickSubset(worldQs, 5);

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
        const lessonId = `${levelId}_les${i}`;
        
        if (STATIC_LESSON_OVERRIDES[lessonId]) {
            const override = STATIC_LESSON_OVERRIDES[lessonId];
            lessons.push({
                id: lessonId,
                worldId,
                levelId,
                order: i,
                type: override.type || 'info',
                title: override.title || 'Bonus Lesson',
                xpReward: 150 + (i * 10),
                coinReward: 75 + (i * 5),
                popularity: (rng.next() * 50 + 10).toFixed(1) + "k",
                content: override.content || { text: "Bonus Content" }
            } as Lesson);
            continue;
        }

        const type = shuffledTypes[i % shuffledTypes.length];
        const popularity = (rng.next() * 30 + 5).toFixed(1) + "k";
        
        lessons.push({
            id: lessonId,
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
        swipe: ["Swipe the Truth", "Left or Right?", "Pick the Winner", "Decision Time", "Needs vs Wants", "Vibe Check"],
        meme: ["Meme Review", "Reality Check", "True Story", "Financial L", "Big Mood"],
        tap_lie: ["Spot the Cap", "Find the Lie", "Truth Bomb", "Fact or Fiction", "Cap Check"],
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
            return { cards: rng.pickSubset(SCENARIOS, 5) };
        case 'meme':
            const tmpl = rng.pick(MEME_TEMPLATES);
            return { 
                imageUrl: tmpl.url, 
                topText: tmpl.top, 
                bottomText: tmpl.bottom, 
                explanation: "This meme explains why being broke costs money." 
            };
        case 'tap_lie':
            const liePool = [
                { text: "Credit cards are free money", isLie: true },
                { text: "Compound interest takes time", isLie: false },
                { text: "You need a budget", isLie: false },
                { text: "Debit cards help credit score", isLie: true },
                { text: "Banks are your friends", isLie: true },
                { text: "Inflation is a scam", isLie: true },
                { text: "You can't save $1", isLie: true },
                { text: "Rich people budget too", isLie: false },
                { text: "Debt is always bad", isLie: true },
                { text: "Assets make money", isLie: false },
                { text: "Liabilities take money", isLie: false },
                { text: "NFTs are stable", isLie: true },
                { text: "HYSAs are better than checking", isLie: false },
                { text: "401k is for old people only", isLie: true },
                { text: "Emergency funds are essential", isLie: false },
                { text: "Car is an investment", isLie: true },
                { text: "Renting is always throwing money away", isLie: true },
                { text: "Gold is the best investment", isLie: true },
                { text: "You can time the market", isLie: true },
                { text: "Fees don't matter", isLie: true }
            ];
            return { statements: rng.pickSubset(liePool, 5) };
        case 'drag_drop':
            // Enhanced Drag Drop items
             const sortItems = [
                { id: 's1', text: "Netflix Sub", category: "Wants" },
                { id: 's2', text: "Rent", category: "Needs" },
                { id: 's3', text: "Groceries", category: "Needs" },
                { id: 's4', text: "New Jordans", category: "Wants" },
                { id: 's5', text: "Bus Pass", category: "Needs" },
                { id: 's6', text: "Concert Tix", category: "Wants" },
                { id: 's7', text: "Electricity", category: "Needs" },
                { id: 's8', text: "Video Games", category: "Wants" },
                { id: 's9', text: "Emergency Fund", category: "Savings" },
                { id: 's10', text: "Stock Investment", category: "Savings" },
                { id: 's11', text: "Bitcoin", category: "Savings" },
                { id: 's12', text: "V-Bucks", category: "Wants" },
                { id: 's13', text: "Water Bill", category: "Needs" },
                { id: 's14', text: "Gucci Belt", category: "Wants" },
                { id: 's15', text: "Roth IRA", category: "Savings" },
                { id: 's16', text: "Bubble Tea", category: "Wants" },
                { id: 's17', text: "Phone Bill", category: "Needs" },
                { id: 's18', text: "Crypto Punk", category: "Wants" },
                { id: 's19', text: "401k Match", category: "Savings" },
                { id: 's20', text: "Uber Eats", category: "Wants" }
            ];
            return { 
                buckets: ['Needs', 'Wants', 'Savings'],
                items: rng.pickSubset(sortItems, 5) 
            };
        case 'calculator':
             // More realistic/varied calculator scenarios
            const scenarios = [
                { label: "If you invest $50/mo at 8% for 40 years...", res: "$174,550" },
                { label: "If you invest $100/mo at 8% for 40 years...", res: "$349,100" },
                { label: "If you invest $500/mo at 8% for 30 years...", res: "$734,075" },
                { label: "If you save $5/day instead of coffee (10% return, 40yrs)...", res: "$948,611" }
            ];
            const scen = rng.pick(scenarios);
            return { 
                label: scen.label, 
                formula: "auto", 
                resultLabel: scen.res 
            };
        default:
            return { text: "Financial literacy is the meta. **Compound Interest** is OP. Don't get rugged by **Inflation**." };
    }
};
