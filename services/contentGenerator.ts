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

// --- DATA POOLS (FROM INPUT) ---

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
    { text: "Bitcoin's value grew 100x in 10 years, but volatility is key.", source: "Crypto Market Data", emoji: "₿" },
    { text: "Emergency funds should cover 3-6 months of expenses.", source: "Dave Ramsey Advice", emoji: "🆘" },
    { text: "Real estate appreciates ~4% annually on average.", source: "Zillow Reports", emoji: "🏠" },
    { text: "Side hustles add $1,000/month for 40% of millennials.", source: "Side Hustle Nation Survey", emoji: "💼" },
    { text: "Taxes can eat 30% of income; optimize with deductions.", source: "IRS Guidelines", emoji: "🧾" },
    { text: "Index funds outperform 85% of active managers long-term.", source: "S&P Dow Jones Indices", emoji: "📈" },
    { text: "Student debt averages $30k per borrower in US.", source: "Federal Reserve", emoji: "🎓" },
    { text: "Gig economy workers earn 20% more flexibly.", source: "Upwork Study", emoji: "🚀" },
    { text: "Retirement at 65 requires ~$1M in savings.", source: "Fidelity Retirement Guide", emoji: "👴" },
    { text: "Peer-to-peer lending yields 5-10% returns.", source: "LendingClub Data", emoji: "🤝" },
    { text: "Homeownership builds wealth 40x faster than renting.", source: "NAR Report", emoji: "🔑" },
    { text: "Crypto scams cost $4B in 2023.", source: "FTC Report", emoji: "⚠️" },
    { text: "Dividend stocks provide passive income streams.", source: "Investopedia", emoji: "💰" },
    { text: "Budgeting apps save users $500/year on average.", source: "Mint User Data", emoji: "📱" },
    { text: "Gold has been a hedge against inflation for centuries.", source: "World Gold Council", emoji: "🪙" },
    { text: "401(k) matching is free money from employers.", source: "Vanguard", "emoji": "🎁" },
    { text: "Inflation hit 9% in 2022, eroding savings.", source: "BLS Data", emoji: "📉" },
    { text: "Freelancers deduct home office expenses.", source: "IRS Freelance Guide", emoji: "🏡" },
    { text: "Bonds offer stable 4-6% returns.", source: "Treasury.gov", emoji: "📜" },
    { text: "NFTs turned $0 into millions for some artists.", source: "OpenSea Stats", emoji: "🖼️" },
    { text: "Car loans average 5 years, but pay off early to save.", source: "Experian", emoji: "🚗" },
    { text: "Stock splits make shares more accessible.", source: "NASDAQ", emoji: "📊" },
    { text: "Health savings accounts are triple tax-free.", source: "HSA Guide", emoji: "🏥" },
    { text: "Real estate crowdfunding starts at $500.", source: "Fundrise", emoji: "🏗️" },
    { text: "Credit utilization under 30% boosts scores.", source: "FICO", emoji: "👍" },
    { text: "Passive income beats trading time for money.", source: "Rich Dad Poor Dad", emoji: "⏰" },
    { text: "ETFs track markets with low fees.", source: "Vanguard ETFs", emoji: "🌍" },
    { text: "Mortgage rates hit historic lows in 2021.", source: "Freddie Mac", emoji: "🏦" },
    { text: "Angel investing can 10x returns.", source: "AngelList", emoji: "😇" },
    { text: "Budget 50/30/20: Needs/Wants/Savings.", source: "Elizabeth Warren", emoji: "📊" },
    { text: "Crypto mining uses as much energy as Sweden.", source: "Cambridge Bitcoin Index", emoji: "⚡" },
    { text: "Roth conversions save on future taxes.", source: "IRS Roth Rules", emoji: "🔄" },
    { text: "Venture capital funds startups like Uber.", "source": "CB Insights", emoji: "🚀" },
    { text: "Dollar-cost averaging beats timing the market.", source: "Schwab Study", emoji: "📅" },
    { text: "Life insurance protects families financially.", source: "LIMRA", emoji: "🛡️" },
    { text: "REITs allow real estate investing without buying property.", source: "Nareit", emoji: "🏢" },
    { text: "Financial independence retire early (FIRE) targets 25x expenses.", source: "Mr. Money Mustache", emoji: "🔥" },
    { text: "Options trading can hedge risks.", source: "CBOE", emoji: "📈" },
    { text: "Sovereign wealth funds manage trillions.", source: "SWFI", emoji: "🌐" }
];

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
    "Have fun staying poor! (meme reference) 🤪",
    "That's a millionaire mistake... in reverse 📉",
    "Your bank account is crying tears of joy... not 😂",
    "Warren Buffett would disown you 💼",
    "That choice just bought you a one-way ticket to Brokeville 🚌",
    "Elon Musk laughs at your finances 🚀",
    "Your future self is time-traveling to slap you ⏰",
    "That's how you turn $100 into $50 real quick 💸",
    "The stock market just facepalmed 📊",
    "Dave Ramsey is shaking his head 👴",
    "You just financed a yacht... for someone else 🛥️"
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
export const getRandomRoast = () => ROASTS[Math.floor(Math.random() * ROASTS.length)];

// --- WORLD-SPECIFIC CONTENT DEFINITIONS ---

const WORLD_DATA: Record<string, { bossName: string, bossIntro: string[], bossEmoji: string, topics: any[] }> = {
    "Moola Basics": {
        bossName: "The Inflation Dragon",
        bossEmoji: "🐲",
        bossIntro: ["Your cash is melting!", "Prices are rising!", "I eat value for breakfast!"],
        topics: [
            { q: "What is money?", e: "A medium of exchange for goods and services.", a: ["Tool for value", "Paper notes", "Digital bits"], c: 0 },
            { q: "Inflation basics?", e: "Rising prices reduce purchasing power.", a: ["Good for economy", "Bad for savers", "Neutral"], c: 1 },
            { q: "Needs vs Wants?", e: "Prioritize essentials over luxuries.", a: ["Wants first", "Needs first", "Equal"], c: 1 },
            { q: "Gold as investment?", e: "Hedge against inflation.", a: ["Outdated", "Safe haven", "Volatile like crypto"], c: 1 },
            { q: "Physical gold?", e: "Store securely, harder to sell.", a: ["ETF easier", "Tangible asset", "No value"], c: 1 },
            { q: "Sovereign funds?", e: "Government investment pools.", a: ["Personal use", "National wealth", "Crypto based"], c: 1 }
        ]
    },
    "Budget Beach": {
        bossName: "The Impulse Imp",
        bossEmoji: "👺",
        bossIntro: ["Buy it NOW!", "Who needs savings?", "Treat yourself!"],
        topics: [
            { q: "Budgeting rules?", e: "Track income vs expenses monthly.", a: ["Ignore it", "50/30/20 rule", "Spend freely"], c: 1 },
            { q: "Budget apps?", e: "Track spending automatically.", a: ["Manual better", "Time saver", "Inaccurate"], c: 1 },
            { q: "Spending trackers?", e: "Apps categorize expenses.", a: ["Manual logs", "Auto insights", "Ignore"], c: 1 },
            { q: "Wellness budgets?", e: "Allocate for gym, mental health.", a: ["Luxury", "Investment", "Skip"], c: 1 },
            { q: "Car financing?", e: "Lease vs buy based on use.", a: ["Always lease", "Buy and hold", "New every year"], c: 1 },
            { q: "Auto leases?", e: "Rent car with mileage limits.", a: ["Own at end", "Lower payments", "Buy better"], c: 1 },
            { q: "Emergency funds?", e: "3-6 months expenses in liquid cash.", a: ["Unnecessary", "Essential buffer", "Invest instead"], c: 1 },
            { q: "Financial goals?", e: "SMART: Specific, Measurable, etc.", a: ["Vague dreams", "Detailed plans", "No need"], c: 1 }
        ]
    },
    "Compound Cliffs": {
        bossName: "The Time Thief",
        bossEmoji: "⏳",
        bossIntro: ["Wait until later!", "You have plenty of time!", "Start tomorrow!"],
        topics: [
            { q: "Compound interest?", e: "Interest on interest grows wealth exponentially.", a: ["Magic", "Scam", "Real growth"], c: 2 },
            { q: "Savings accounts?", e: "Safe place for money with interest.", a: ["High yield best", "Any bank fine", "Avoid them"], c: 0 },
            { q: "Retirement planning?", e: "Start early for compound magic.", a: ["Later fine", "Now essential", "Government covers"], c: 1 },
            { q: "401k matching?", e: "Free employer contributions.", a: ["Skip it", "Max match", "Withdraw early"], c: 1 },
            { q: "HSA benefits?", e: "Tax-free for medical expenses.", a: ["Limited use", "Triple advantage", "Like IRA"], c: 1 },
            { q: "Life insurance?", e: "Term vs whole for protection.", a: ["Investment tool", "Family safeguard", "Unnecessary"], c: 1 },
            { q: "Term life?", e: "Coverage for set years, low cost.", a: ["Builds cash", "Pure protection", "Expensive"], c: 1 },
            { q: "Whole life?", e: "Permanent coverage with cash value.", a: ["Cheap", "Investment hybrid", "Term better"], c: 1 }
        ]
    },
    "Bank Vault": {
        bossName: "The Fee Fiend",
        bossEmoji: "🦇",
        bossIntro: ["I love overdrafts!", "Minimum balance fee!", "ATM surcharge!"],
        topics: [
            { q: "Credit freezes?", e: "Protect against identity theft.", a: ["Blocks loans", "Free service", "Permanent"], c: 1 },
            { q: "Credit monitoring?", e: "Alert for changes/fraud.", a: ["Free annual", "Paid services", "Ignore"], c: 1 },
            { q: "Peer lending?", e: "Lend via platforms for interest.", a: ["Bank safer", "Higher returns", "No risk"], c: 1 },
            { q: "P2P risks?", e: "Defaults can lose principal.", a: ["Guaranteed", "Diversify loans", "Bank level safe"], c: 1 },
            { q: "Home equity loans?", e: "Borrow against house value.", a: ["Free money", "Second mortgage", "No interest"], c: 1 },
            { q: "HELOCs?", e: "Revolving credit on home equity.", a: ["Fixed loan", "Flexible draw", "No collateral"], c: 1 },
            { q: "Mortgage types?", e: "Fixed vs adjustable rates.", a: ["Adjustable safer", "Fixed predictable", "No difference"], c: 1 },
            { q: "ARM mortgages?", e: "Rates adjust after initial period.", a: ["Fixed forever", "Potential savings", "Always rise"], c: 1 },
            { q: "FHA loans?", e: "Low down payment for first-timers.", a: ["High credit need", "Gov backed", "Private only"], c: 1 }
        ]
    },
    "Debt Dungeon": {
        bossName: "The Interest Ogre",
        bossEmoji: "👹",
        bossIntro: ["Minimum payment only!", "Sign here!", "25% APR!"],
        topics: [
            { q: "Credit cards 101?", e: "Borrow money, pay interest if not full.", a: ["Free money", "Debt trap", "Reward tool"], c: 2 },
            { q: "Good vs bad debt?", e: "Invest in assets vs consume.", a: ["All bad", "Depends on use", "All good"], c: 1 },
            { q: "Credit scores?", e: "Affects loans and rates.", a: ["Ignore it", "Build high", "Low is fine"], c: 1 },
            { q: "Credit utilization?", e: "Keep under 30% for good score.", a: ["Max it", "Low ratio", "Irrelevant"], c: 1 },
            { q: "Student loans?", e: "Pay minimum or aggressively.", a: ["Ignore", "Refinance low", "Forgive hope"], c: 1 },
            { q: "Loan defaults?", e: "Diversify to minimize losses.", a: ["Full recovery", "Partial risk", "Avoid P2P"], c: 1 }
        ]
    },
    "Hustle Hub": {
        bossName: "The Tax Titan",
        bossEmoji: "🕴️",
        bossIntro: ["Where's my cut?", "Audit time!", "Gross isn't Net!"],
        topics: [
            { q: "Side hustles?", e: "Extra income sources for security.", a: ["Waste time", "Build wealth", "Only for pros"], c: 1 },
            { q: "Gig economy?", e: "Flexible work via apps.", a: ["Unstable", "Extra cash", "Full career"], c: 1 },
            { q: "Freelancing taxes?", e: "Quarterly payments required.", a: ["Same as employee", "Self-employment tax", "No tax"], c: 1 },
            { q: "Gig taxes?", e: "1099 forms for self-employed.", a: ["Employer pays", "Quarterly self", "Exempt"], c: 1 },
            { q: "1099 vs W2?", e: "1099: Independent, more taxes.", a: ["Same benefits", "W2 easier", "1099 freedom"], c: 2 },
            { q: "Taxes 101?", e: "Pay on income, deductions reduce.", a: ["Avoid them", "Plan smartly", "Max pay"], c: 1 },
            { q: "Tax deductions?", e: "Charity, home office reduce bill.", a: ["Standard only", "Itemized savings", "Avoid audit"], c: 1 },
            { q: "Itemized deductions?", e: "Medical, mortgage over standard.", a: ["Always take", "If exceed std", "Business only"], c: 1 }
        ]
    },
    "Stony Stocks": {
        bossName: "The Panic Bear",
        bossEmoji: "🐻",
        bossIntro: ["Market crash!", "Sell everything!", "It's going to zero!"],
        topics: [
            { q: "Stock market basics?", e: "Buy shares in companies for growth.", a: ["Gambling", "Long-term investment", "Quick rich"], c: 1 },
            { q: "Diversification?", e: "Spread risks across assets.", a: ["All in one", "Multiple types", "Cash only"], c: 1 },
            { q: "Index funds?", e: "Diversified, low-cost market tracking.", a: ["Beat pros", "Too risky", "Active better"], c: 0 },
            { q: "ETFs vs mutual funds?", e: "ETFs trade like stocks, lower fees.", a: ["Same thing", "ETFs better", "Mutuals safer"], c: 1 },
            { q: "Passive ETFs?", e: "Track indices with minimal management.", a: ["Active outperform", "Low cost win", "High fees"], c: 1 },
            { q: "Active ETFs?", e: "Managed with ETF liquidity.", a: ["Passive only", "Hybrid approach", "High cost"], c: 1 },
            { q: "Dollar cost averaging?", e: "Invest fixed amount regularly.", a: ["Time market", "Average costs", "All at once"], c: 1 },
            { q: "Stock splits?", e: "Increase shares, lower price.", a: ["Value change", "Accessibility boost", "Bad sign"], c: 1 },
            { q: "Reverse splits?", e: "Reduce shares to boost price.", a: ["Good news", "Delisting risk", "No change"], c: 1 },
            { q: "Share buybacks?", e: "Company repurchases to boost value.", a: ["Bad for shareholders", "EPS increase", "Debt funded"], c: 1 },
            { q: "Dividend investing?", e: "Companies pay shareholders.", a: ["Growth stocks better", "Passive income", "Volatile"], c: 1 },
            { q: "Dividend aristocrats?", e: "Companies raising payouts yearly.", a: ["Volatile", "Reliable income", "New tech"], c: 1 },
            { q: "Growth dividends?", e: "Reinvest for compound growth.", a: ["Cash out", "Auto reinvest", "Tax free"], c: 1 },
            { q: "Expense ratios?", e: "Annual fund fees, keep low.", a: ["Ignore", "Under 0.5%", "High better"], c: 1 }
        ]
    },
    "Wealth Empire": {
        bossName: "Lifestyle Creep",
        bossEmoji: "🧟",
        bossIntro: ["You need a better car!", "Upgrade your house!", "Spend it all!"],
        topics: [
            { q: "Wealth mindset?", e: "Think abundance, not scarcity.", a: ["Luck based", "Action driven", "Born rich"], c: 1 },
            { q: "FIRE movement?", e: "Save aggressively to retire early.", a: ["Impossible", "Frugal living", "Spend more"], c: 1 },
            { q: "Lean FIRE?", e: "Minimalist early retirement.", a: ["Fat better", "Frugal path", "Spend heavy"], c: 1 },
            { q: "FIRE calculations?", e: "4% rule for safe withdrawal.", a: ["Spend all", "Conservative rate", "10% draw"], c: 1 },
            { q: "Passive income ideas?", e: "Dividends, royalties, rentals.", a: ["Active only", "Multiple streams", "One job enough"], c: 1 },
            { q: "Real estate investing?", e: "Rental income and appreciation.", a: ["Too expensive", "Passive wealth", "Risky flip"], c: 1 },
            { q: "REITs?", e: "Invest in real estate trusts.", a: ["Direct buy better", "Diversified properties", "High fees"], c: 1 },
            { q: "Real estate flips?", e: "Buy, renovate, sell for profit.", a: ["Easy flip", "Market risk", "Guaranteed"], c: 1 },
            { q: "Flip financing?", e: "Hard money loans for quick buys.", a: ["Bank mortgage", "High interest short", "Cash only"], c: 1 },
            { q: "Crypto fundamentals?", e: "Decentralized digital assets.", a: ["Scam", "Future money", "Stable"], c: 1 },
            { q: "Crypto mining?", e: "Validate transactions for rewards.", a: ["Easy money", "Energy intensive", "Passive"], c: 1 },
            { q: "Mining pools?", e: "Share resources for steady rewards.", a: ["Solo win big", "Group stable", "Illegal"], c: 1 },
            { q: "Proof of stake?", e: "Hold coins to validate, less energy.", a: ["Mining same", "Eco friendly", "No rewards"], c: 1 },
            { q: "NFT investing?", e: "Digital ownership with blockchain.", a: ["Art only", "Speculative asset", "Stable value"], c: 1 },
            { q: "NFT royalties?", e: "Earn on resales automatically.", a: ["One-time", "Ongoing cut", "No fees"], c: 1 },
            { q: "NFT marketplaces?", e: "OpenSea for buying/selling.", a: ["Free mint", "Gas fees", "No blockchain"], c: 1 },
            { q: "Options trading?", e: "Contracts for buy/sell rights.", a: ["Beginner friendly", "Advanced strategy", "Guaranteed win"], c: 1 },
            { q: "Options hedging?", e: "Protect portfolio from drops.", a: ["Speculation only", "Risk reduction", "Beginner tool"], c: 1 },
            { q: "Put options?", e: "Sell right if price drops.", a: ["Bullish", "Bearish protection", "Call same"], c: 1 },
            { q: "Angel investing?", e: "Fund early-stage startups.", a: ["High risk/reward", "Safe bet", "For pros only"], c: 0 },
            { q: "Venture capital?", e: "Invest in high-growth companies.", a: ["Low returns", "Startup fuel", "Debt based"], c: 1 },
            { q: "VC stages?", e: "Seed, Series A, etc. for growth.", a: ["One round", "Multi-phase", "Debt only"], c: 1 },
            { q: "Angel networks?", e: "Group funding for deals.", a: ["Solo better", "Shared risk", "Government"], c: 1 },
            { q: "Angel syndicates?", e: "Pool funds with lead investor.", a: ["Individual", "Group leverage", "VC only"], c: 1 },
            { q: "Crowdfunding?", e: "Pool money for projects/startups.", a: ["Donation only", "Equity possible", "Scam risk"], c: 1 },
            { q: "Equity crowdfunding?", e: "Invest in startups via platforms.", a: ["Donors only", "Share ownership", "No returns"], c: 1 },
            { q: "Reward crowdfunding?", e: "Back for products/perks.", a: ["Equity get", "Pre-order like", "Donation"], c: 1 },
            { q: "Exit strategies?", e: "IPO or acquisition for returns.", a: ["Hold forever", "Quick sell", "VC goal"], c: 2 },
            { q: "Roth IRA intro?", e: "Tax-free growth for retirement.", a: ["Pay tax now", "Pay tax later", "No tax"], c: 0 },
            { q: "Roth conversions?", e: "Shift traditional to tax-free.", a: ["Tax hit now", "Avoid later", "Illegal"], c: 0 },
            { q: "Roth ladders?", e: "Convert gradually to avoid taxes.", a: ["All at once", "Staggered", "Skip it"], c: 1 },
            { q: "Backdoor Roth?", e: "For high earners via traditional.", a: ["Direct fine", "Income bypass", "Illegal"], c: 1 },
            { q: "HSA investing?", e: "Grow tax-free for retirement.", a: ["Cash only", "Stock options", "Withdraw anytime"], c: 1 },
            { q: "HSA rollovers?", e: "Carry over unused funds yearly.", a: ["Use or lose", "Unlimited growth", "Taxed withdraw"], c: 1 }
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
    
    // --- BOSS GENERATION ---
    const bossName = data.bossName;
    const bossImage = data.bossEmoji;
    const bossIntro = rng.pick(data.bossIntro);
    
    // Select 3 distinct questions for this level's boss
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

    // --- LESSON GENERATION ---
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['info', 'swipe', 'poll', 'meme', 'calculator', 'tapLie']; 
    
    // STRICT Content Generation per World
    const getWorldSpecificContent = (type: LessonType, index: number) => {
        
        if (worldName === "Moola Basics") {
            if (type === 'swipe') return { question: "Value Check", left: "Barter", right: "Cash", correct: "right", text: "Cash is more efficient." };
            if (type === 'poll') return { question: "What is Money?", options: ["Paper", "Trust", "Gold"], correct: 1, text: "It's a system of trust." };
            if (type === 'meme') return { topText: "Me trying to barter", bottomText: "The cashier at Walmart", imageUrl: "https://i.imgflip.com/26am.jpg" };
            if (type === 'calculator') return { label: "Inflation Calc", question: "Item cost $10. Inflation 10%. New cost?", answer: 11, text: "Prices go up." };
            if (type === 'tapLie') return { text: "Money History", statements: [{text:"Salt was money", isLie:false}, {text:"Money is infinite", isLie:true}] };
            return { text: "Money solves the 'double coincidence of wants' problem. It acts as a universal store of value.", analogy: "Like a universal key for trading." };
        }
        
        if (worldName === "Budget Beach") {
            if (type === 'swipe') return { question: "Need or Want?", left: "PS5", right: "Rent", correct: "right", text: "Shelter first." };
            if (type === 'poll') return { question: "Best Budget Rule?", options: ["80/20", "50/30/20", "100/0"], correct: 1, text: "The classic balanced split." };
            if (type === 'meme') return { topText: "My Bank Account", bottomText: "Me buying boba", imageUrl: "https://i.imgflip.com/1jwhww.jpg" };
            if (type === 'calculator') return { label: "Budget Math", question: "$100 Income. Save 20%. How much?", answer: 20, text: "Pay yourself first." };
            if (type === 'tapLie') return { text: "Budget Myths", statements: [{text:"Budgets are for poor people", isLie:true}, {text:"Tracking helps", isLie:false}] };
            return { text: "A budget isn't a prison. It's a permission slip to spend without guilt.", analogy: "Like a map for a road trip." };
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
            if (type === 'meme') return { topText: "Checking Account 0.01%", bottomText: "HYSA 4.5%", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" };
            if (type === 'calculator') return { label: "Interest Gain", question: "$10k at 5%. Gain in 1 yr?", answer: 500, text: "Free money." };
            if (type === 'tapLie') return { text: "Banking Facts", statements: [{text:"Overdraft fees are fun", isLie:true}, {text:"Direct deposit is faster", isLie:false}] };
            return { text: "A High Yield Savings Account (HYSA) pays you 10x-50x more than a regular bank for doing nothing.", analogy: "Like upgrading your weapon for free." };
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
            if (type === 'meme') return { topText: "Market Crashes", bottomText: "Me Buying the Dip", imageUrl: "https://i.imgflip.com/434i5j.jpg" };
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

        // Fallback (Should not be reached with correct world IDs)
        const topic = data.topics[index % data.topics.length];
        if (type === 'info') return { text: `${topic.q} ${topic.e}`, analogy: "Knowledge is power." };
        return { text: topic.e, question: topic.q, answer: 100 };
    };

    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content = getWorldSpecificContent(type, i);
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
