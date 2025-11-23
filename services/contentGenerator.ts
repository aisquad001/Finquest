
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
}

// --- UNIQUE BOSS BATTLES (24 Questions per World = 3 per Level x 8 Levels) ---
const BOSS_BATTLES: Record<string, BossQuestion[]> = {
    "Moola Basics": [
        // Level 1
        { question: "Money allows you to...", options: ["Eat dirt", "Trade value", "Fly"], correctIndex: 1, explanation: "It's a medium of exchange." },
        { question: "Before money, people used...", options: ["Telepathy", "Barter", "Internet"], correctIndex: 1, explanation: "Trading goods for goods." },
        { question: "The double coincidence of wants is a problem with...", options: ["Cash", "Barter", "Credit"], correctIndex: 1, explanation: "You need what I have, I need what you have." },
        // Level 2
        { question: "Which is a NEED?", options: ["PS5", "Water", "Gucci"], correctIndex: 1, explanation: "Survival first." },
        { question: "Which is a WANT?", options: ["Shelter", "Netflix", "Medicine"], correctIndex: 1, explanation: "Nice to have, not vital." },
        { question: "Opportunity Cost is...", options: ["The price tag", "What you give up", "Tax"], correctIndex: 1, explanation: "The value of the next best alternative." },
        // Level 3
        { question: "Inflation makes money...", options: ["Worth less", "Worth more", "Blue"], correctIndex: 0, explanation: "Purchasing power drops." },
        { question: "Who tracks inflation?", options: ["NASA", "The Fed / BLS", "Burger King"], correctIndex: 1, explanation: "Central banks monitor it." },
        { question: "If bread cost $1 in 1990 and $5 now, that's...", options: ["Deflation", "Inflation", "Magic"], correctIndex: 1, explanation: "Prices rising over time." },
        // Level 4
        { question: "Fiat money is backed by...", options: ["Gold", "Government Trust", "Bitcoin"], correctIndex: 1, explanation: "By decree of the government." },
        { question: "The Gold Standard...", options: ["Is used now", "Ended in 1971", "Is a myth"], correctIndex: 1, explanation: "Nixon ended it." },
        { question: "Why can't we just print more money?", options: ["We run out of paper", "Hyperinflation", "Ink is expensive"], correctIndex: 1, explanation: "More supply = less value." },
        // Level 5
        { question: "Active Income is...", options: ["Trading time for money", "Sleeping", "Investing"], correctIndex: 0, explanation: "You have to work for it." },
        { question: "Passive Income is...", options: ["Lazy", "Money working for you", "Illegal"], correctIndex: 1, explanation: "Earn while you sleep." },
        { question: "Which is Active Income?", options: ["Wages", "Dividends", "Rent"], correctIndex: 0, explanation: "Your job pays wages." },
        // Level 6
        { question: "An Asset...", options: ["Costs money", "Puts money in pocket", "Is a car"], correctIndex: 1, explanation: "Assets pay you." },
        { question: "A Liability...", options: ["Takes money out", "Pays you", "Is a stock"], correctIndex: 0, explanation: "Liabilities cost you." },
        { question: "Your house is an asset if...", options: ["You live in it", "You rent it out for profit", "It looks nice"], correctIndex: 1, explanation: "Rich Dad says home is liability unless it pays." },
        // Level 7
        { question: "Delayed Gratification is...", options: ["Buying now", "Waiting for better reward", "Never buying"], correctIndex: 1, explanation: "Marshmallow test." },
        { question: "Impulse buying destroys...", options: ["The store", "Your wealth", "Credit cards"], correctIndex: 1, explanation: "Unplanned spending leaks money." },
        { question: "The 'Latte Factor' creates wealth by...", options: ["Drinking coffee", "Investing small savings", "Buying a cafe"], correctIndex: 1, explanation: "Small amounts compound." },
        // Level 8
        { question: "Net Worth =", options: ["Income - Expenses", "Assets - Liabilities", "Cash"], correctIndex: 1, explanation: "The golden formula." },
        { question: "To get rich you must...", options: ["Look rich", "Own assets", "Have high income"], correctIndex: 1, explanation: "Income isn't wealth. Assets are." },
        { question: "Financial Freedom is...", options: ["No job", "Assets cover expenses", "Winning lotto"], correctIndex: 1, explanation: "When you don't *have* to work." }
    ],
    "Budget Beach": [
        // Level 1
        { question: "A budget is...", options: ["A punishment", "A plan for money", "Math homework"], correctIndex: 1, explanation: "Telling your money where to go." },
        { question: "Income minus Expenses equals...", options: ["Cash Flow", "Debt", "Taxes"], correctIndex: 0, explanation: "Positive or negative flow." },
        { question: "The first step in budgeting is...", options: ["Spending", "Tracking income", "Crying"], correctIndex: 1, explanation: "Know what comes in." },
        // Level 2
        { question: "50/30/20 Rule: 50% is for...", options: ["Needs", "Wants", "Savings"], correctIndex: 0, explanation: "Essentials like rent/food." },
        { question: "50/30/20 Rule: 30% is for...", options: ["Needs", "Wants", "Savings"], correctIndex: 1, explanation: "Fun stuff." },
        { question: "50/30/20 Rule: 20% is for...", options: ["Needs", "Wants", "Savings/Debt"], correctIndex: 2, explanation: "Future you." },
        // Level 3
        { question: "Gross Income is...", options: ["After tax", "Before tax", "Disgusting"], correctIndex: 1, explanation: "Total pay before deductions." },
        { question: "Net Income is...", options: ["Take home pay", "Total pay", "Fishing profit"], correctIndex: 0, explanation: "What actually hits the bank." },
        { question: "Budget based on...", options: ["Gross", "Net", "Hope"], correctIndex: 1, explanation: "Use real available cash." },
        // Level 4
        { question: "Fixed Expenses...", options: ["Fluctuate", "Stay same", "Are optional"], correctIndex: 1, explanation: "Rent, subscriptions." },
        { question: "Variable Expenses...", options: ["Stay same", "Change monthly", "Are rare"], correctIndex: 1, explanation: "Groceries, electricity." },
        { question: "Which is easier to cut?", options: ["Fixed", "Variable", "Taxes"], correctIndex: 1, explanation: "Stop eating out vs move house." },
        // Level 5
        { question: "Zero-Based Budgeting means...", options: ["Having $0", "Assigning every dollar", "Spending $0"], correctIndex: 1, explanation: "Income - Expense = 0." },
        { question: "Pay Yourself First means...", options: ["Buy toys", "Save before spending", "Pay bills last"], correctIndex: 1, explanation: "Prioritize savings." },
        { question: "Sinking Funds are for...", options: ["Boats", "Planned large expenses", "Debt"], correctIndex: 1, explanation: "Saving monthly for a future cost." },
        // Level 6
        { question: "The Envelope System uses...", options: ["Cash", "Credit", "Crypto"], correctIndex: 0, explanation: "Physical cash limits spending." },
        { question: "Digital Envelopes are...", options: ["Emails", "Sub-accounts", "NFTs"], correctIndex: 1, explanation: "Bank buckets for goals." },
        { question: "If an envelope is empty...", options: ["Steal from another", "Stop spending", "Use credit"], correctIndex: 1, explanation: "Discipline." },
        // Level 7
        { question: "Lifestyle Creep is...", options: ["Scary", "Spending raises", "Working less"], correctIndex: 1, explanation: "Spending more just because you earn more." },
        { question: "Emergency Fund is for...", options: ["Pizza", "Job Loss", "Vacation"], correctIndex: 1, explanation: "True emergencies." },
        { question: "A fully funded E-Fund is...", options: ["$500", "3-6 Months Expenses", "1 Year"], correctIndex: 1, explanation: "Standard safety net." },
        // Level 8
        { question: "The goal of budgeting is...", options: ["Restriction", "Freedom", "Guilt"], correctIndex: 1, explanation: "Permission to spend without worry." },
        { question: "Tracking spending helps...", options: ["Catch leaks", "Nothing", "Lose time"], correctIndex: 0, explanation: "Awareness is key." },
        { question: "Budgeting fails when...", options: ["You're too strict", "You track", "You save"], correctIndex: 0, explanation: "Be realistic." }
    ],
    "Compound Cliffs": [
        // Level 1
        { question: "Simple Interest is...", options: ["On principal only", "On interest too", "Complex"], correctIndex: 0, explanation: "Linear growth." },
        { question: "Compound Interest is...", options: ["On principal only", "Interest on Interest", "Flat"], correctIndex: 1, explanation: "Exponential growth." },
        { question: "Who said it's the 8th Wonder?", options: ["Einstein", "Musk", "Bezos"], correctIndex: 0, explanation: "Albert Einstein." },
        // Level 2
        { question: "Time is...", options: ["Irrelevant", "Your best friend", "Your enemy"], correctIndex: 1, explanation: "More time = more compounding." },
        { question: "Starting at 20 vs 30...", options: ["Huge difference", "Small difference", "Same"], correctIndex: 0, explanation: "That extra decade doubles money multiple times." },
        { question: "The snowball effect refers to...", options: ["Winter", "Compounding", "Debt"], correctIndex: 1, explanation: "Money grows faster as it gets bigger." },
        // Level 3
        { question: "Rule of 72 finds...", options: ["Taxes", "Doubling Time", "Retirement"], correctIndex: 1, explanation: "72 / Interest Rate = Years." },
        { question: "At 10% return, money doubles in...", options: ["10 yrs", "7.2 yrs", "5 yrs"], correctIndex: 1, explanation: "72 / 10 = 7.2" },
        { question: "At 7% return, money doubles in...", options: ["7 yrs", "10.2 yrs", "100 yrs"], correctIndex: 1, explanation: "72 / 7 = ~10.2" },
        // Level 4
        { question: "APY stands for...", options: ["Annual Percentage Yield", "Apple Pie Yummy", "All Pay Year"], correctIndex: 0, explanation: "Includes compounding." },
        { question: "APR stands for...", options: ["Annual Percentage Rate", "Apple", "Apricot"], correctIndex: 0, explanation: "Simple interest usually." },
        { question: "For savings you want...", options: ["High APY", "Low APY", "No APY"], correctIndex: 0, explanation: "More interest earned." },
        // Level 5
        { question: "Compounding frequency matters...", options: ["True", "False", "Maybe"], correctIndex: 0, explanation: "Daily > Monthly > Yearly." },
        { question: "Credit cards compound...", options: ["Daily", "Monthly", "Never"], correctIndex: 0, explanation: "That's why debt explodes." },
        { question: "Inflation acts like...", options: ["Positive compounding", "Negative compounding", "Neutral"], correctIndex: 1, explanation: "It eats value exponentially." },
        // Level 6
        { question: "To become a millionaire ($1M) by 65...", options: ["Win lottery", "Invest monthly", "Save cash"], correctIndex: 1, explanation: "Consistent investing works." },
        { question: "$500/mo at 10% for 40 years is...", options: ["$240k", "$2.6 Million", "$500k"], correctIndex: 1, explanation: "Math is magic." },
        { question: "The 'Messy Middle' is...", options: ["Boring part of growth", "The start", "The end"], correctIndex: 0, explanation: "When gains feel slow." },
        // Level 7
        { question: "Exponential growth graph looks like...", options: ["Straight line", "Hockey stick", "Circle"], correctIndex: 1, explanation: "Curves up sharply." },
        { question: "The biggest enemy of compounding is...", options: ["Taxes", "Interrupting it", "Fees"], correctIndex: 1, explanation: "Don't stop the clock." },
        { question: "Warren Buffett made 99% of wealth...", options: ["Before 50", "After 50", "At birth"], correctIndex: 1, explanation: "Time in the market." },
        // Level 8
        { question: "Consistency beats...", options: ["Intensity", "Luck", "Everything"], correctIndex: 0, explanation: "Small acts repeated > big one-time acts." },
        { question: "Automating savings...", options: ["Is lazy", "Ensures consistency", "Is risky"], correctIndex: 1, explanation: "Removes willpower." },
        { question: "Compound interest rewards...", options: ["Patience", "Speed", "Greed"], correctIndex: 0, explanation: "Wait for the explosion." }
    ],
    "Bank Vault": [
        // Level 1
        { question: "Checking accounts are for...", options: ["Saving", "Spending", "Investing"], correctIndex: 1, explanation: "Flowing money in/out." },
        { question: "Savings accounts are for...", options: ["Parking cash", "Spending", "Debit"], correctIndex: 0, explanation: "Earning interest safely." },
        { question: "Banks make money by...", options: ["Fees & Lending", "Printing", "Charity"], correctIndex: 0, explanation: "Lending your deposits." },
        // Level 2
        { question: "FDIC Insurance covers...", options: ["$1M", "$250k", "$50k"], correctIndex: 1, explanation: "Per depositor, per bank." },
        { question: "If a bank fails...", options: ["Money gone", "Govt pays back", "Sue them"], correctIndex: 1, explanation: "FDIC protects you." },
        { question: "Is Crypto FDIC insured?", options: ["Yes", "No", "Maybe"], correctIndex: 1, explanation: "No govt protection." },
        // Level 3
        { question: "HYSA stands for...", options: ["High Yield Savings", "High Yearly Spend", "Hello"], correctIndex: 0, explanation: "Pays more interest." },
        { question: "Big Banks pay approx...", options: ["0.01%", "5%", "10%"], correctIndex: 0, explanation: "Almost nothing." },
        { question: "Online Banks pay more because...", options: ["Scam", "Low Overhead", "Risk"], correctIndex: 1, explanation: "No physical branches." },
        // Level 4
        { question: "Overdraft Fee is...", options: ["Good", "Penalty for < $0", "Reward"], correctIndex: 1, explanation: "Spending money you don't have." },
        { question: "Maintenance Fee...", options: ["Monthly cost", "Repair cost", "Free"], correctIndex: 0, explanation: "Fee just to have account." },
        { question: "ATM Fees...", options: ["Don't exist", "Charge for cash", "Are good"], correctIndex: 1, explanation: "Use in-network ATMs." },
        // Level 5
        { question: "Debit Cards use...", options: ["Bank's money", "Your money", "Credit"], correctIndex: 1, explanation: "Direct from checking." },
        { question: "Credit Cards use...", options: ["Bank's money", "Your money", "Gift"], correctIndex: 0, explanation: "It is a loan." },
        { question: "Debit cards build credit?", options: ["Yes", "No", "Sometimes"], correctIndex: 1, explanation: "No credit history report." },
        // Level 6
        { question: "ChexSystems tracks...", options: ["Credit", "Bad banking behavior", "Grades"], correctIndex: 1, explanation: "Blacklist for banks." },
        { question: "Phishing is...", options: ["Sport", "Fake emails", "Music"], correctIndex: 1, explanation: "Stealing login info." },
        { question: "2FA means...", options: ["Two Factor Auth", "Too Fast", "Two Apps"], correctIndex: 0, explanation: "Password + Code." },
        // Level 7
        { question: "A CD (Certificate of Deposit)...", options: ["Plays music", "Locks money for rate", "Is checking"], correctIndex: 1, explanation: "Higher rate for locked term." },
        { question: "Money Market Account...", options: ["Hybrid Check/Save", "Stock", "Cash"], correctIndex: 0, explanation: "Interest + Check writing." },
        { question: "Credit Unions are...", options: ["For profit", "Non-profit", "Govt"], correctIndex: 1, explanation: "Member owned." },
        // Level 8
        { question: "Unbanked means...", options: ["No account", "Rich", "Mobile"], correctIndex: 0, explanation: "Relying on cash/predatory services." },
        { question: "Direct Deposit...", options: ["Faster access", "Slower", "Costly"], correctIndex: 0, explanation: "Paycheck straight to bank." },
        { question: "Automated Transfers...", options: ["Build wealth", "Lose money", "Are scary"], correctIndex: 0, explanation: "Set and forget savings." }
    ],
    "Debt Dungeon": [
        // Level 1
        { question: "Principal is...", options: ["School boss", "Amount borrowed", "Interest"], correctIndex: 1, explanation: "Original loan amount." },
        { question: "Interest is...", options: ["Fun", "Cost of borrowing", "Profit"], correctIndex: 1, explanation: "Fee paid to lender." },
        { question: "Term is...", options: ["Time to repay", "Name", "School"], correctIndex: 0, explanation: "Length of loan." },
        // Level 2
        { question: "Good Debt...", options: ["Buys Assets", "Buys Toys", "Is high rate"], correctIndex: 0, explanation: "Increases net worth (e.g. Mortgage)." },
        { question: "Bad Debt...", options: ["Low rate", "Consumables", "Tax deductible"], correctIndex: 1, explanation: "High interest, depreciating assets." },
        { question: "Credit Card debt is...", options: ["Good", "Bad", "Neutral"], correctIndex: 1, explanation: "Very high interest." },
        // Level 3
        { question: "APR stands for...", options: ["Annual % Rate", "Apple", "Apricot"], correctIndex: 0, explanation: "True cost of loan." },
        { question: "Credit Card APR avg?", options: ["5%", "10%", "20%+"], correctIndex: 2, explanation: "Extremely expensive." },
        { question: "Minimum Payment...", options: ["Pays off loan", "Keeps you in debt", "Is smart"], correctIndex: 1, explanation: "Mostly interest." },
        // Level 4
        { question: "Credit Score range?", options: ["0-100", "300-850", "A-F"], correctIndex: 1, explanation: "FICO model." },
        { question: "Good Score is...", options: ["500", "600", "720+"], correctIndex: 2, explanation: "Opens doors." },
        { question: "Utilization Ratio should be...", options: ["<30%", "100%", "0%"], correctIndex: 0, explanation: "Don't max out cards." },
        // Level 5
        { question: "Payment History is...", options: ["35% of score", "10%", "Irrelevant"], correctIndex: 0, explanation: "Most important factor." },
        { question: "Hard Inquiry...", options: ["Hurts score slightly", "Helps", "Does nothing"], correctIndex: 0, explanation: "Applying for new credit." },
        { question: "Age of Credit...", options: ["Older is better", "Newer is better", "Doesn't matter"], correctIndex: 0, explanation: "Keep old cards open." },
        // Level 6
        { question: "Snowball Method...", options: ["Smallest balance first", "Highest rate first", "Random"], correctIndex: 0, explanation: "Psychological momentum." },
        { question: "Avalanche Method...", options: ["Smallest balance", "Highest rate first", "Random"], correctIndex: 1, explanation: "Mathematically cheapest." },
        { question: "Consolidation...", options: ["Combines loans", "Deletes loans", "Free money"], correctIndex: 0, explanation: "Simplifies payments." },
        // Level 7
        { question: "Payday Loans...", options: ["Helpful", "Predatory (400% APR)", "Cheap"], correctIndex: 1, explanation: "Debt trap." },
        { question: "Predatory Lending...", options: ["Fair", "Exploitative", "Legal"], correctIndex: 1, explanation: "Targets vulnerable people." },
        { question: "BNPL (Buy Now Pay Later)...", options: ["Free", "Psychological trap", "Savings"], correctIndex: 1, explanation: "Encourages overspending." },
        // Level 8
        { question: "Bankruptcy...", options: ["Easy fix", "Last resort (ruins score)", "Free"], correctIndex: 1, explanation: "Stays on report 7-10 years." },
        { question: "Co-signing...", options: ["Risk-free", "You are liable", "Fun"], correctIndex: 1, explanation: "You pay if they don't." },
        { question: "Default means...", options: ["Standard setting", "Failed to pay", "Win"], correctIndex: 1, explanation: "Broken contract." }
    ],
    "Hustle Hub": [
        // Level 1
        { question: "Gross Pay...", options: ["Before tax", "After tax", "Yuck"], correctIndex: 0, explanation: "Total earnings." },
        { question: "Net Pay...", options: ["Before tax", "Take home", "Web"], correctIndex: 1, explanation: "What hits the bank." },
        { question: "FICA taxes fund...", options: ["Roads", "Social Security/Medicare", "Schools"], correctIndex: 1, explanation: "Retirement safety net." },
        // Level 2
        { question: "W-2 Employee...", options: ["Taxes withheld", "No taxes", "Boss"], correctIndex: 0, explanation: "Standard job." },
        { question: "1099 Contractor...", options: ["Taxes withheld", "You pay own taxes", "Illegal"], correctIndex: 1, explanation: "Freelancer." },
        { question: "Gig Economy...", options: ["Uber/DoorDash", "Factory", "Office"], correctIndex: 0, explanation: "App-based work." },
        // Level 3
        { question: "Side Hustle...", options: ["Main job", "Extra income stream", "Hobby"], correctIndex: 1, explanation: "Money on the side." },
        { question: "Scalability...", options: ["Working harder", "Disconnecting time from money", "Weight"], correctIndex: 1, explanation: "Selling products vs time." },
        { question: "Passive Income...", options: ["Requires 0 work", "Work up front, pay later", "Scam"], correctIndex: 1, explanation: "Build once, sell twice." },
        // Level 4
        { question: "Income Tax is...", options: ["Flat", "Progressive (Brackets)", "Optional"], correctIndex: 1, explanation: "Higher earners pay higher %." },
        { question: "Tax Bracket...", options: ["Pay rate on ALL income", "Pay rate on slice of income", "Box"], correctIndex: 1, explanation: "Marginal tax rate." },
        { question: "Tax Refund...", options: ["Free money", "Loan to govt returned", "Bonus"], correctIndex: 1, explanation: "You overpaid during year." },
        // Level 5
        { question: "Resume...", options: ["Life story", "Marketing document", "Legal form"], correctIndex: 1, explanation: "Sell your skills." },
        { question: "Soft Skills...", options: ["Coding", "Communication/Teamwork", "Easy"], correctIndex: 1, explanation: "Interpersonal skills." },
        { question: "Hard Skills...", options: ["Talking", "Coding/Accounting", "Difficult"], correctIndex: 1, explanation: "Technical abilities." },
        // Level 6
        { question: "Negotiating salary...", options: ["Rude", "Essential", "Illegal"], correctIndex: 1, explanation: "Compounding earnings." },
        { question: "Benefits...", options: ["Insurance/401k", "Free snacks", "High fives"], correctIndex: 0, explanation: "Part of compensation." },
        { question: "401k Match...", options: ["Free money", "Scam", "Tax"], correctIndex: 0, explanation: "Employer contribution." },
        // Level 7
        { question: "Entrepreneur...", options: ["Employee", "Business Owner", "Unemployed"], correctIndex: 1, explanation: "Takes risk for profit." },
        { question: "Revenue...", options: ["Profit", "Top line sales", "Loss"], correctIndex: 1, explanation: "Money coming in." },
        { question: "Profit...", options: ["Revenue", "Revenue - Expenses", "Cash"], correctIndex: 1, explanation: "What you keep." },
        // Level 8
        { question: "Multiple Streams...", options: ["Rivers", "Diversified Income", "Confusion"], correctIndex: 1, explanation: "Safety in numbers." },
        { question: "Human Capital...", options: ["Slaves", "Your skills/health", "Robots"], correctIndex: 1, explanation: "Invest in yourself." },
        { question: "Lifestyle Inflation...", options: ["Spending raises", "Saving raises", "Good"], correctIndex: 0, explanation: "Avoid to build wealth." }
    ],
    "Stony Stocks": [
        // Level 1
        { question: "Stock represents...", options: ["Paper", "Ownership in company", "Loan"], correctIndex: 1, explanation: "Equity share." },
        { question: "Ticker Symbol...", options: ["AAPL", "Name", "Price"], correctIndex: 0, explanation: "Short code (e.g. TSLA)." },
        { question: "IPO...", options: ["Initial Public Offering", "Input", "Phone"], correctIndex: 0, explanation: "Going public." },
        // Level 2
        { question: "Bull Market...", options: ["Prices falling", "Prices rising", "Animals"], correctIndex: 1, explanation: "Optimism." },
        { question: "Bear Market...", options: ["Prices falling", "Prices rising", "Sleepy"], correctIndex: 0, explanation: "Pessimism/Drop > 20%." },
        { question: "Volatility...", options: ["Stability", "Price swings", "Volume"], correctIndex: 1, explanation: "Risk measure." },
        // Level 3
        { question: "Dividend...", options: ["Fee", "Profit share payout", "Tax"], correctIndex: 1, explanation: "Cash paid to owners." },
        { question: "Capital Gain...", options: ["Profit from sale", "Dividends", "Loss"], correctIndex: 0, explanation: "Sell higher than buy." },
        { question: "Loss...", options: ["Sell lower than buy", "Hold", "Buy"], correctIndex: 0, explanation: "Realized loss." },
        // Level 4
        { question: "Diversification...", options: ["All eggs one basket", "Spreading risk", "Confusing"], correctIndex: 1, explanation: "Don't lose all on one stock." },
        { question: "Index Fund...", options: ["Single stock", "Basket of stocks", "Bank"], correctIndex: 1, explanation: "Tracks a market (S&P 500)." },
        { question: "S&P 500...", options: ["500 races", "500 largest US companies", "500 banks"], correctIndex: 1, explanation: "Market benchmark." },
        // Level 5
        { question: "ETF...", options: ["Exchange Traded Fund", "Eat The Food", "Exit"], correctIndex: 0, explanation: "Trades like a stock." },
        { question: "Mutual Fund...", options: ["Active managed pool", "Free", "Robot"], correctIndex: 0, explanation: "Often higher fees." },
        { question: "Expense Ratio...", options: ["Cost to own fund", "Profit", "Tax"], correctIndex: 0, explanation: "Lower is better." },
        // Level 6
        { question: "Market Cap...", options: ["Hat", "Total value of company", "Price"], correctIndex: 1, explanation: "Shares x Price." },
        { question: "P/E Ratio...", options: ["Physical Ed", "Price to Earnings", "Profit"], correctIndex: 1, explanation: "Valuation metric." },
        { question: "Blue Chip...", options: ["Snack", "Reliable large company", "Tech"], correctIndex: 1, explanation: "Safe, stable." },
        // Level 7
        { question: "Dollar Cost Averaging...", options: ["Timing market", "Invest set amount regularly", "Gambling"], correctIndex: 1, explanation: "Reduces timing risk." },
        { question: "Time in the market beats...", options: ["Timing the market", "Saving", "Working"], correctIndex: 0, explanation: "Long term wins." },
        { question: "Panic Selling...", options: ["Smart", "Locking in losses", "Fun"], correctIndex: 1, explanation: "Emotional mistake." },
        // Level 8
        { question: "Bond...", options: ["007", "Loan to govt/corp", "Stock"], correctIndex: 1, explanation: "Debt instrument." },
        { question: "Asset Allocation...", options: ["Spending", "Mix of Stocks/Bonds", "Location"], correctIndex: 1, explanation: "Risk balance." },
        { question: "Compound Interest in stocks...", options: ["Reinvesting dividends/growth", "Impossible", "Slow"], correctIndex: 0, explanation: "Snowball effect." }
    ],
    "Wealth Empire": [
        // Level 1
        { question: "Real Estate...", options: ["Land/Buildings", "Fake", "Stocks"], correctIndex: 0, explanation: "Physical property." },
        { question: "Mortgage...", options: ["Death pledge", "Rent", "Free"], correctIndex: 0, explanation: "Loan for house." },
        { question: "Equity...", options: ["Fairness", "Value you own", "Debt"], correctIndex: 1, explanation: "Value - Debt." },
        // Level 2
        { question: "Appreciation...", options: ["Clapping", "Value going up", "Value going down"], correctIndex: 1, explanation: "Growth." },
        { question: "Depreciation...", options: ["Sadness", "Value going down", "Growth"], correctIndex: 1, explanation: "Cars depreciate." },
        { question: "Cash Flow (Rental)...", options: ["Rent - Expenses", "Rent only", "Tax"], correctIndex: 0, explanation: "Profit monthly." },
        // Level 3
        { question: "FI/RE...", options: ["Burn", "Financial Indep / Retire Early", "Fired"], correctIndex: 1, explanation: "Freedom movement." },
        { question: "4% Rule...", options: ["Tax rate", "Safe withdrawal rate", "Growth"], correctIndex: 1, explanation: "Sustain retirement." },
        { question: "F-You Money...", options: ["Rude", "Freedom to quit", "Debt"], correctIndex: 1, explanation: "Security buffer." },
        // Level 4
        { question: "Inflation Hedge...", options: ["Garden", "Asset growing with inflation", "Cash"], correctIndex: 1, explanation: "Real estate / Stocks." },
        { question: "Leverage...", options: ["Lifting", "Using debt to multiply gains", "Saving"], correctIndex: 1, explanation: "Risky but powerful." },
        { question: "Liquidity...", options: ["Water", "Ease of selling", "Hard to sell"], correctIndex: 1, explanation: "Cash is liquid." },
        // Level 5
        { question: "Estate Planning...", options: ["Gardening", "Wills/Trusts", "Buying land"], correctIndex: 1, explanation: "Plan for death." },
        { question: "Will...", options: ["Future", "Legal doc for assets", "Name"], correctIndex: 1, explanation: "Who gets what." },
        { question: "Trust...", options: ["Believe", "Legal entity for assets", "Hope"], correctIndex: 1, explanation: "Control beyond grave." },
        // Level 6
        { question: "Umbrella Insurance...", options: ["Rain", "Extra liability coverage", "Car"], correctIndex: 1, explanation: "Protect wealth." },
        { question: "Prenup...", options: ["Marriage contract", "Divorce", "Party"], correctIndex: 0, explanation: "Protect assets before marriage." },
        { question: "LLC...", options: ["Limited Liability Company", "Cool", "Tax"], correctIndex: 0, explanation: "Legal shield." },
        // Level 7
        { question: "Angel Investor...", options: ["Religious", "Early startup investor", "Bank"], correctIndex: 1, explanation: "High risk equity." },
        { question: "Venture Capital...", options: ["Adventure", "Funding startups", "Loans"], correctIndex: 1, explanation: "Institutional money." },
        { question: "Private Equity...", options: ["Secret", "Non-public companies", "Public"], correctIndex: 1, explanation: "Buying companies." },
        // Level 8
        { question: "Philanthropy...", options: ["Collecting stamps", "Giving wealth away", "Hoarding"], correctIndex: 1, explanation: "Charity." },
        { question: "Legacy...", options: ["Old software", "What you leave behind", "Money"], correctIndex: 1, explanation: "Impact." },
        { question: "True Wealth...", options: ["Money only", "Time/Freedom/Health", "Gold"], correctIndex: 1, explanation: "Money is a tool." }
    ]
};

// --- MASSIVE CONTENT DB (8 Items per Category per World) ---
const CONTENT_DB: Record<string, any> = {
    "Moola Basics": {
        swipes: [
            { q: "Found $20", left: "Save", right: "Spend", correct: "left", text: "Start the E-Fund." },
            { q: "New Phone", left: "Buy Now", right: "Wait 30 Days", correct: "right", text: "Price often drops." },
            { q: "Lend Friend $50?", left: "No", right: "Yes", correct: "left", text: "Don't lend what you can't lose." },
            { q: "Daily Latte", left: "Buy", right: "Make at Home", correct: "right", text: "Saves $1000/yr." },
            { q: "Birthday Cash", left: "Invest", right: "Toys", correct: "left", text: "Let it grow." },
            { q: "50% Off Sale", left: "Buy Junk", right: "Ignore", correct: "right", text: "Spending is not saving." },
            { q: "ATM Fee $3", left: "Pay it", right: "Find Network", correct: "right", text: "Avoid dumb fees." },
            { q: "Subscription", left: "Keep Unused", right: "Cancel", correct: "right", text: "Stop the leak." }
        ],
        lies: [
            { text: "Money Origins", options: ["Barter came first", "Coins always existed"], correct: 1, exp: "Barter was first." },
            { text: "Inflation", options: ["Prices go down", "Prices go up"], correct: 0, exp: "Inflation raises prices." },
            { text: "Printing Money", options: ["Causes Inflation", "Creates Wealth"], correct: 1, exp: "More supply devalues it." },
            { text: "Banks", options: ["Keep your cash in a box", "Lend your cash"], correct: 0, exp: "Fractional reserve." },
            { text: "Needs", options: ["Water", "Wifi"], correct: 1, exp: "Wifi is a want (technically)." },
            { text: "Wants", options: ["Medicine", "Designer Shoes"], correct: 0, exp: "Medicine is a need." },
            { text: "Value", options: ["Scarcity increases value", "Scarcity decreases value"], correct: 1, exp: "Gold is rare = expensive." },
            { text: "Fiat", options: ["Backed by Gold", "Backed by Trust"], correct: 0, exp: "Backed by govt decree." }
        ],
        math: [
            { q: "$100 + 3% inflation?", a: 103, t: "Cost next year." },
            { q: "Hours to earn $100 at $10/hr?", a: 10, t: "Time is money." },
            { q: "$5 coffee x 365 days?", a: 1825, t: "Latte factor." },
            { q: "Net Worth: $500 Asset - $200 Debt?", a: 300, t: "Assets - Liab." },
            { q: "Double $10?", a: 20, t: "Growth." },
            { q: "50% of $100?", a: 50, t: "Half." },
            { q: "$1000 / 10?", a: 100, t: "Division." },
            { q: "10% of 50?", a: 5, t: "Percentage." }
        ],
        memes: [
            { cap: "Me expecting wealth", text: "Spending $0", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation", text: "$10 is now $5", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Bartering", text: "3 Chickens for a goat", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "The Fed", text: "Money Printer Go Brrr", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Needs vs Wants", text: "Food vs PS5", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Opportunity Cost", text: "One marshmallow now", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Fiat Money", text: "It's just paper?", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Getting Rich", text: "Slowly", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        polls: [
            { q: "Cash or Card?", o: ["Cash", "Card"], a: 1, t: "Digital future." },
            { q: "Save or Spend?", o: ["Save", "Spend"], a: 0, t: "Save." },
            { q: "Gold or Crypto?", o: ["Gold", "Crypto"], a: 0, t: "Gold is stable." },
            { q: "Work or Invest?", o: ["Work", "Invest"], a: 1, t: "Invest." },
            { q: "New or Used?", o: ["New", "Used"], a: 1, t: "Depreciation." },
            { q: "Rent or Buy?", o: ["Rent", "Buy"], a: 1, t: "Equity." },
            { q: "Give or Keep?", o: ["Give", "Keep"], a: 0, t: "Generosity." },
            { q: "Early or Late?", o: ["Early", "Late"], a: 0, t: "Time." }
        ],
        infos: [
            { t: "Money is a tool.", analogy: "Like a hammer.", img: "" },
            { t: "Inflation eats cash.", analogy: "Ice melting.", img: "" },
            { t: "Barter is hard.", analogy: "Trading chickens.", img: "" },
            { t: "Assets feed you.", analogy: "Golden Goose.", img: "" },
            { t: "Liabilities eat you.", analogy: "Hungry Hippo.", img: "" },
            { t: "Scarcity = Value.", analogy: "Diamonds.", img: "" },
            { t: "Time is Money.", analogy: "Hourglass.", img: "" },
            { t: "Compound Growth.", analogy: "Snowball.", img: "" }
        ]
    },
    "Budget Beach": {
        swipes: [
            { q: "Paycheck Hits", left: "Mall", right: "Bank", correct: "right", text: "Pay yourself first." },
            { q: "Rent Due", left: "Pay Late", right: "Pay First", correct: "right", text: "Needs > Wants." },
            { q: "Bonus $500", left: "Party", right: "Debt/Save", correct: "right", text: "Kill debt first." },
            { q: "Eating Out", left: "Daily", right: "Weekly", correct: "right", text: "Huge savings." },
            { q: "Grocery Shop", left: "Hungry", right: "List", correct: "right", text: "Never shop hungry." },
            { q: "Raise", left: "New Car", right: "Invest", correct: "right", text: "Avoid lifestyle creep." },
            { q: "Subscription", left: "Forgot", right: "Track", correct: "right", text: "Cancel unused." },
            { q: "Emergency", left: "Credit Card", right: "Cash Fund", correct: "right", text: "Be prepared." }
        ],
        lies: [
            { text: "Budgeting", options: ["Restricts freedom", "Creates freedom"], correct: 0, exp: "Budgets allow guilt-free spending." },
            { text: "Zero-Based", options: ["Spend $0", "Assign every $"], correct: 0, exp: "Every dollar has a job." },
            { text: "E-Fund", options: ["For Pizza", "For Medical"], correct: 0, exp: "Pizza is not an emergency." },
            { text: "Expenses", options: ["Fixed change", "Variable change"], correct: 0, exp: "Fixed stay same." },
            { text: "Tracking", options: ["Is obsessive", "Is smart"], correct: 0, exp: "Knowledge is power." },
            { text: "50/30/20", options: ["50% Wants", "50% Needs"], correct: 0, exp: "Needs come first." },
            { text: "Gross Pay", options: ["Is yours", "Is before tax"], correct: 0, exp: "Taxes take a chunk." },
            { text: "Sinking Fund", options: ["Losing money", "Saving for goal"], correct: 0, exp: "Smooths out expenses." }
        ],
        math: [
            { q: "50% of $2000 (Needs)?", a: 1000, t: "Rent/Food." },
            { q: "30% of $2000 (Wants)?", a: 600, t: "Fun money." },
            { q: "20% of $2000 (Save)?", a: 400, t: "Future you." },
            { q: "$3000 Income - $2500 Expense?", a: 500, t: "Surplus." },
            { q: "$100/mo for 12mo?", a: 1200, t: "Sinking fund." },
            { q: "$15 lunch x 20 days?", a: 300, t: "Packing lunch saves $." },
            { q: "$5000 E-Fund / $1000 exp?", a: 5, t: "Months of safety." },
            { q: "10% tithe on $4000?", a: 400, t: "Giving." }
        ],
        memes: [
            { cap: "Budgeting", text: "Expectation vs Reality", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Direct Deposit", text: "And it's gone", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Ordering Food", text: "I have food at home", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Impulse Buy", text: "I need it", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Checking Account", text: "$0.42", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Pay Day", text: "King for a day", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Subscription", text: "Free Trial Ended", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Sale", text: "Saved 100% by not buying", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        polls: [
            { q: "Method?", o: ["App", "Excel"], a: 0, t: "Both work." },
            { q: "Cash or Digital?", o: ["Envelopes", "Card"], a: 0, t: "Envelopes feel real." },
            { q: "Hardest part?", o: ["Starting", "Sticking"], a: 1, t: "Consistency." },
            { q: "Wants?", o: ["Travel", "Tech"], a: 0, t: "Prioritize." },
            { q: "Guilty pleasure?", o: ["Coffee", "Clothes"], a: 0, t: "Budget for it." },
            { q: "E-Fund?", o: ["Have one", "Need one"], a: 0, t: "Start today." },
            { q: "Frequency?", o: ["Weekly", "Monthly"], a: 1, t: "Per paycheck." },
            { q: "Goal?", o: ["Debt Free", "Rich"], a: 0, t: "Debt free first." }
        ],
        infos: [
            { t: "50/30/20 Rule", analogy: "Balanced Diet.", img: "" },
            { t: "Envelope System", analogy: "Cash Handcuffs.", img: "" },
            { t: "Sinking Funds", analogy: "Filling potholes.", img: "" },
            { t: "Emergency Fund", analogy: "Airbag.", img: "" },
            { t: "Zero-Based", analogy: "Empty bucket.", img: "" },
            { t: "Tracking", analogy: "Scoreboard.", img: "" },
            { t: "Automation", analogy: "Robot butler.", img: "" },
            { t: "Review", analogy: "Halftime adjustments.", img: "" }
        ]
    },
    "Compound Cliffs": {
        swipes: [
            { q: "Start Investing", left: "Age 20", right: "Age 40", correct: "left", text: "Time is multiplier." },
            { q: "Market Crash", left: "Panic Sell", right: "Hold/Buy", correct: "right", text: "Stocks on sale." },
            { q: "Interest Rate", left: "1%", right: "10%", correct: "right", text: "Higher is better for savings." },
            { q: "Frequency", left: "Yearly", right: "Daily", correct: "right", text: "More compounding." },
            { q: "Consistency", left: "Random", right: "Auto", correct: "right", text: "Set and forget." },
            { q: "Withdrawal", left: "Early", right: "Retirement", correct: "right", text: "Don't stop the clock." },
            { q: "Debt vs Invest", left: "Invest at 5%", right: "Pay 20% Debt", correct: "right", text: "Guaranteed 20% return." },
            { q: "High Fees", left: "Pay them", right: "Low Index", correct: "right", text: "Fees eat growth." }
        ],
        lies: [
            { text: "Rich", options: ["Requires High Income", "Requires Time"], correct: 0, exp: "Time > Income." },
            { text: "Starting", options: ["Need $10k", "Need $5"], correct: 0, exp: "Start small." },
            { text: "Compound", options: ["Linear", "Exponential"], correct: 0, exp: "Hockey stick curve." },
            { text: "Waiting", options: ["Is fine", "Is costly"], correct: 0, exp: "Cost of waiting is huge." },
            { text: "APY", options: ["Simple", "Compound"], correct: 0, exp: "Yield includes compound." },
            { text: "Consistency", options: ["Beats intensity", "Loses to luck"], correct: 0, exp: "Turtle wins." },
            { text: "Automating", options: ["Is lazy", "Is smart"], correct: 1, exp: "Removes emotion." },
            { text: "Inflation", options: ["Helps savers", "Hurts savers"], correct: 1, exp: "Eats cash." }
        ],
        math: [
            { q: "Rule of 72 @ 10%?", a: 7.2, t: "Years to double." },
            { q: "Rule of 72 @ 6%?", a: 12, t: "Years to double." },
            { q: "$100 dbl 10 times?", a: 102400, t: "Power of 2." },
            { q: "10% of $1000?", a: 100, t: "Year 1." },
            { q: "10% of $1100?", a: 110, t: "Year 2 (more)." },
            { q: "$1 at 100%?", a: 2, t: "Doubled." },
            { q: "40 years vs 10 years?", a: 4, t: "Time factor." },
            { q: "Loss of 50% needs?", a: 100, t: "% gain to recover." }
        ],
        memes: [
            { cap: "Waiting to invest", text: "Old Skeleton", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Compound Interest", text: "Stonks", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Graph goes up", text: "Exponential", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Starting early", text: "Baby with cash", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation", text: "Pacman eating cash", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Fees", text: "Vampire", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Time", text: "The real currency", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Automating", text: "Robots", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        polls: [
            { q: "Start age?", o: ["18", "30"], a: 0, t: "ASAP." },
            { q: "Risk?", o: ["Safe", "Growth"], a: 1, t: "Growth for youth." },
            { q: "Frequency?", o: ["Monthly", "Daily"], a: 1, t: "More often." },
            { q: "Goal?", o: ["$1M", "$10M"], a: 0, t: "Dream big." },
            { q: "Style?", o: ["Active", "Passive"], a: 1, t: "Passive wins." },
            { q: "Auto?", o: ["Yes", "No"], a: 0, t: "Yes." },
            { q: "Fees?", o: ["Ignore", "Minimize"], a: 1, t: "Minimize." },
            { q: "Retire?", o: ["65", "40"], a: 1, t: "FIRE." }
        ],
        infos: [
            { t: "Compound Interest", analogy: "Snowball rolling.", img: "" },
            { t: "Time", analogy: "Planting a tree.", img: "" },
            { t: "Rule of 72", analogy: "Magic trick.", img: "" },
            { t: "Consistency", analogy: "Dripping water.", img: "" },
            { t: "Exponential", analogy: "Viral video.", img: "" },
            { t: "Inflation", analogy: "Treadmill.", img: "" },
            { t: "Automation", analogy: "Autopilot.", img: "" },
            { t: "Starting Early", analogy: "Head start.", img: "" }
        ]
    },
    "Bank Vault": {
        swipes: [
            { q: "Store Cash", left: "Mattress", right: "Bank", correct: "right", text: "Earns interest." },
            { q: "Account Type", left: "Checking", right: "HYSA", correct: "right", text: "4% vs 0%." },
            { q: "ATM Fee", left: "Pay $3", right: "Find Network", correct: "right", text: "Waste of money." },
            { q: "Password", left: "123456", right: "Complex", correct: "right", text: "Security." },
            { q: "Phishing", left: "Click Link", right: "Report", correct: "right", text: "Don't get scammed." },
            { q: "Overdraft", left: "On", right: "Off", correct: "right", text: "Avoid fees." },
            { q: "Bank Type", left: "Big Bank", right: "Online/CU", correct: "right", text: "Better rates." },
            { q: "Paper Statements", left: "Keep", right: "Digital", correct: "right", text: "Secure & Green." }
        ],
        lies: [
            { text: "FDIC", options: ["Covers Crypto", "Covers Cash"], correct: 1, exp: "Crypto not insured." },
            { text: "Debit", options: ["Builds Credit", "Direct Cash"], correct: 1, exp: "No credit history." },
            { text: "Banks", options: ["Hold all cash", "Lend cash"], correct: 1, exp: "Fractional reserve." },
            { text: "Overdraft", options: ["Is a service", "Is a fee trap"], correct: 1, exp: "Billions in fees." },
            { text: "Minimums", options: ["Ignore them", "Avoid fees"], correct: 1, exp: "Maintain balance." },
            { text: "Checks", options: ["Obsolete", "Still used"], correct: 1, exp: "Rent/Govt." },
            { text: "Credit Union", options: ["For Profit", "Non Profit"], correct: 1, exp: "Member owned." },
            { text: "CDs", options: ["Compact Discs", "Cert of Deposit"], correct: 1, exp: "Locked savings." }
        ],
        math: [
            { q: "$10k @ 0.01%?", a: 1, t: "Big bank rate." },
            { q: "$10k @ 5%?", a: 500, t: "HYSA rate." },
            { q: "$35 Overdraft x 4?", a: 140, t: "Ouch." },
            { q: "$10 fee x 12 mos?", a: 120, t: "Maintenance fee." },
            { q: "FDIC limit?", a: 250000, t: "Per depositor." },
            { q: "Routing Number digits?", a: 9, t: "Bank ID." },
            { q: "2FA Code digits?", a: 6, t: "Security." },
            { q: "Days to clear check?", a: 2, t: "Usually." }
        ],
        memes: [
            { cap: "Bank Fees", text: "You have no money? Fee.", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Interest Rates", text: "0.01% - Thanks", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Online Banks", text: "4.5% APY", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Debit Card", text: "Declined", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Overdraft", text: "-$35", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Checks", text: "Ok Boomer", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Direct Deposit", text: "Hit early", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Password", text: "password123", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        polls: [
            { q: "Bank?", o: ["Chase/Boa", "Online"], a: 1, t: "Rates matter." },
            { q: "Cash?", o: ["Never", "Always"], a: 0, t: "Digital." },
            { q: "Checks?", o: ["Use 'em", "What's that?"], a: 1, t: "Rare." },
            { q: "Alerts?", o: ["On", "Off"], a: 0, t: "Security." },
            { q: "FaceID?", o: ["Yes", "No"], a: 0, t: "Fast." },
            { q: "Auto-Save?", o: ["Yes", "No"], a: 0, t: "Smart." },
            { q: "Fees?", o: ["Pay 'em", "Avoid 'em"], a: 1, t: "Avoid." },
            { q: "Apps?", o: ["Venmo", "Zelle"], a: 0, t: "P2P." }
        ],
        infos: [
            { t: "FDIC", analogy: "Safety Net.", img: "" },
            { t: "Inflation vs Interest", analogy: "Race.", img: "" },
            { t: "Liquidity", analogy: "Water.", img: "" },
            { t: "Compound Interest", analogy: "Free Money.", img: "" },
            { t: "Overdraft", analogy: "Trap.", img: "" },
            { t: "Credit Union", analogy: "Co-op.", img: "" },
            { t: "2FA", analogy: "Double Lock.", img: "" },
            { t: "Direct Deposit", analogy: "Pipeline.", img: "" }
        ]
    },
    "Debt Dungeon": {
        swipes: [
            { q: "Pay Minimum", left: "Yes", right: "Pay Full", correct: "right", text: "Avoid interest." },
            { q: "Credit Score", left: "Ignore", right: "Monitor", correct: "right", text: "Important." },
            { q: "Max Out", left: "YOLO", right: "Under 30%", correct: "right", text: "Utilization." },
            { q: "Store Card", left: "Sign Up", right: "Decline", correct: "right", text: "Bad rates." },
            { q: "Miss Payment", left: "Whatever", right: "Never", correct: "right", text: "Hurts score." },
            { q: "Payday Loan", left: "Take it", right: "Run", correct: "right", text: "Trap." },
            { q: "Credit Limit", left: "Spend it all", right: "Ignore it", correct: "right", text: "Not free money." },
            { q: "Annual Fee", left: "Pay $500", right: "No Fee Card", correct: "right", text: "Unless perks > fee." }
        ],
        lies: [
            { text: "Checking Score", options: ["Hurts score", "Is safe"], correct: 1, exp: "Soft pull." },
            { text: "Carrying Balance", options: ["Helps score", "Costs money"], correct: 1, exp: "Pay in full." },
            { text: "Closing Cards", options: ["Good", "Bad"], correct: 1, exp: "Lowers age/limit." },
            { text: "Debit", options: ["Builds credit", "Does not"], correct: 1, exp: "Credit cards do." },
            { text: "Min Payment", options: ["Pays off loan", "Mostly interest"], correct: 1, exp: "Treadmill." },
            { text: "Co-signing", options: ["Safe", "Risky"], correct: 1, exp: "You pay if they don't." },
            { text: "Bankruptcy", options: ["Easy", "7-10 Years"], correct: 1, exp: "Nuclear option." },
            { text: "Collections", options: ["Nice people", "Relentless"], correct: 1, exp: "They want money." }
        ],
        math: [
            { q: "$1000 @ 20%?", a: 200, t: "Interest/yr." },
            { q: "Utilization 500/1000?", a: 50, t: "Percent." },
            { q: "35% of score?", a: 35, t: "Payment history." },
            { q: "Score range max?", a: 850, t: "Perfect." },
            { q: "Years on report?", a: 7, t: "Bad marks." },
            { q: "Hard inquiries?", a: 2, t: "Drop points." },
            { q: "Payday APR?", a: 400, t: "Predatory." },
            { q: "0% for 12 months?", a: 0, t: "Promo." }
        ],
        memes: [
            { cap: "Minimum Payment", text: "Financial Ruin", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Credit Score", text: "800 Club", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Declined", text: "Emotional Damage", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Payday Loan", text: "It's a trap", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Limit Increase", text: "More power", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Interest", text: "Stonks down", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Debt Free", text: "Freedom", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Student Loans", text: "84 years later...", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        polls: [
            { q: "Have Card?", o: ["Yes", "No"], a: 0, t: "Build history." },
            { q: "Fear Debt?", o: ["Yes", "No"], a: 0, t: "Respect it." },
            { q: "Pay Full?", o: ["Always", "Sometimes"], a: 0, t: "No interest." },
            { q: "Points?", o: ["Cash back", "Travel"], a: 0, t: "Rewards." },
            { q: "Strategy?", o: ["Snowball", "Avalanche"], a: 1, t: "Math." },
            { q: "Limit?", o: ["High", "Low"], a: 0, t: "Ratio." },
            { q: "Check Score?", o: ["Weekly", "Never"], a: 0, t: "Monitor." },
            { q: "Frozen?", o: ["Yes", "No"], a: 0, t: "Security." }
        ],
        infos: [
            { t: "APR", analogy: "Rent on money.", img: "" },
            { t: "Credit Score", analogy: "Adult Report Card.", img: "" },
            { t: "Utilization", analogy: "Full tank.", img: "" },
            { t: "Hard Inquiry", analogy: "Knocking on door.", img: "" },
            { t: "Snowball", analogy: "Momentum.", img: "" },
            { t: "Avalanche", analogy: "High ground.", img: "" },
            { t: "Default", analogy: "Game Over.", img: "" },
            { t: "Good Debt", analogy: "Ladder.", img: "" }
        ]
    },
    "Hustle Hub": {
        swipes: [
            { q: "Tax Refund", left: "Spend", right: "Invest", correct: "right", text: "Growth." },
            { q: "Side Hustle", left: "Scalable", right: "Hourly", correct: "left", text: "Leverage." },
            { q: "Raise Ask", left: "Scared", right: "Ask", correct: "right", text: "Confidence." },
            { q: "Learn Skill", left: "YouTube", right: "Degree", correct: "left", text: "Free/Fast." },
            { q: "Network", left: "Netflix", right: "Event", correct: "right", text: "Net worth." },
            { q: "LLC", left: "Start", right: "Wait", correct: "left", text: "Protection." },
            { q: "Customer", left: "Argue", right: "Solve", correct: "right", text: "Value." },
            { q: "Profit", left: "Spend", right: "Reinvest", correct: "right", text: "Scale." }
        ],
        lies: [
            { text: "Refund", options: ["Free money", "Your money back"], correct: 1, exp: "Interest free loan to govt." },
            { text: "Rich", options: ["Easy", "Hard work"], correct: 1, exp: "No shortcuts." },
            { text: "Passive", options: ["0 work", "Front-loaded work"], correct: 1, exp: "Build first." },
            { text: "Taxes", options: ["Optional", "Mandatory"], correct: 1, exp: "Jail." },
            { text: "W-2", options: ["Boss", "Employee"], correct: 1, exp: "Job." },
            { text: "1099", options: ["No taxes", "Self tax"], correct: 1, exp: "You pay." },
            { text: "Write-off", options: ["Free stuff", "Discount"], correct: 1, exp: "Reduces taxable income." },
            { text: "Idea", options: ["Worth millions", "Worth 0 without execution"], correct: 1, exp: "Do it." }
        ],
        math: [
            { q: "$100k - 30% tax?", a: 70000, t: "Net." },
            { q: "$50/hr x 10?", a: 500, t: "Active." },
            { q: "$10 product x 1000?", a: 10000, t: "Scale." },
            { q: "Self Emp Tax %?", a: 15, t: "Approx." },
            { q: "2000 hrs/yr x $20?", a: 40000, t: "Salary." },
            { q: "Profit Margin $100/$50?", a: 50, t: "Percent." },
            { q: "Roi $100 -> $110?", a: 10, t: "Return." },
            { q: "2 jobs?", a: 2, t: "Hustle." }
        ],
        memes: [
            { cap: "Gross Pay", text: "Net Pay", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "IRS", text: "I'll take that", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Boss", text: "We are family", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Freelance", text: "Freedom / 24hr work", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Write off", text: "G-Wagon?", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Refund", text: "Loans", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Startup", text: "Stonks", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Hustle", text: "Grindset", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        polls: [
            { q: "Goal?", o: ["CEO", "Founder"], a: 1, t: "Equity." },
            { q: "Work?", o: ["Remote", "Office"], a: 0, t: "Freedom." },
            { q: "Risk?", o: ["Job", "Biz"], a: 1, t: "Reward." },
            { q: "School?", o: ["Degree", "Skill"], a: 1, t: "Utility." },
            { q: "Boss?", o: ["Good", "Bad"], a: 0, t: "Depends." },
            { q: "Retire?", o: ["Never", "Early"], a: 1, t: "Choice." },
            { q: "Team?", o: ["Solo", "Group"], a: 1, t: "Scale." },
            { q: "Industry?", o: ["Tech", "Trade"], a: 0, t: "Demand." }
        ],
        infos: [
            { t: "Gross vs Net", analogy: "Whole pizza vs Slices.", img: "" },
            { t: "Passive Income", analogy: "Seeds.", img: "" },
            { t: "Scalability", analogy: "Broadcast.", img: "" },
            { t: "Taxes", analogy: "Membership fee.", img: "" },
            { t: "Equity", analogy: "Ownership.", img: "" },
            { t: "Network", analogy: "Net worth.", img: "" },
            { t: "Skill Stack", analogy: "Swiss Army Knife.", img: "" },
            { t: "Brand", analogy: "Reputation.", img: "" }
        ]
    },
    "Stony Stocks": {
        swipes: [
            { q: "Market Dip", left: "Sell", right: "Buy", correct: "right", text: "Discount." },
            { q: "Single Stock", left: "YOLO", right: "Diversify", correct: "right", text: "ETF." },
            { q: "Dividend", left: "Spend", right: "Reinvest", correct: "right", text: "Compound." },
            { q: "Timeframe", left: "Day", right: "Decade", correct: "right", text: "Long term." },
            { q: "Research", left: "TikTok", right: "Filings", correct: "right", text: "Data." },
            { q: "Fees", left: "High", right: "Low", correct: "right", text: "Keep profit." },
            { q: "Trend", left: "Chase", right: "Strategy", correct: "right", text: "Plan." },
            { q: "News", left: "Panic", right: "Ignore", correct: "right", text: "Noise." }
        ],
        lies: [
            { text: "Market", options: ["Gambling", "Ownership"], correct: 1, exp: "Business." },
            { text: "Timing", options: ["Possible", "Impossible"], correct: 1, exp: "Time in > Timing." },
            { text: "Bonds", options: ["Risk free", "Low risk"], correct: 1, exp: "Still risk." },
            { text: "IPO", options: ["Best time to buy", "Risky"], correct: 1, exp: "Volatile." },
            { text: "Shorting", options: ["Easy", "Unlimited Risk"], correct: 1, exp: "Dangerous." },
            { text: "Penny Stocks", options: ["Get rich", "Go broke"], correct: 1, exp: "Scams." },
            { text: "Wall St", options: ["Beat them", "Join them"], correct: 1, exp: "Index." },
            { text: "Crypto", options: ["Stock", "Currency/Asset"], correct: 1, exp: "Different." }
        ],
        math: [
            { q: "10% of $1000?", a: 100, t: "Avg return." },
            { q: "Div Yield $2/$100?", a: 2, t: "Percent." },
            { q: "P/E 100?", a: 100, t: "Expensive." },
            { q: "Down 50% needs?", a: 100, t: "Recovery %." },
            { q: "Expense 1% of $10k?", a: 100, t: "Fee." },
            { q: "Shares $50 into $100?", a: 2, t: "Qty." },
            { q: "Tax 15% on $100 gain?", a: 15, t: "Cap Gains." },
            { q: "7% of $1M?", a: 70000, t: "Income." }
        ],
        memes: [
            { cap: "Stonks", text: "Only go up", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Day Trader", text: "Lost it all", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Warren Buffett", text: "Buy the dip", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Bear Market", text: "Hibernation", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Dividends", text: "Free money", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Crypto", text: "Rollercoaster", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Fees", text: "Eating gains", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "HODL", text: "Never sell", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        polls: [
            { q: "Strategy?", o: ["DCA", "Lump Sum"], a: 0, t: "Safe." },
            { q: "Asset?", o: ["Tech", "Index"], a: 1, t: "Safe." },
            { q: "Style?", o: ["Value", "Growth"], a: 0, t: "Cycle." },
            { q: "Crypto?", o: ["Yes", "No"], a: 0, t: "Volatile." },
            { q: "Robo?", o: ["Yes", "No"], a: 0, t: "Easy." },
            { q: "Check?", o: ["Daily", "Yearly"], a: 1, t: "Mental health." },
            { q: "Dividend?", o: ["Reinvest", "Cash"], a: 0, t: "Grow." },
            { q: "Fire?", o: ["Lean", "Fat"], a: 1, t: "Goals." }
        ],
        infos: [
            { t: "Stock Market", analogy: "Supermarket.", img: "" },
            { t: "Volatility", analogy: "Waves.", img: "" },
            { t: "Diversification", analogy: "Buffet plate.", img: "" },
            { t: "Index Fund", analogy: "Fruit Basket.", img: "" },
            { t: "Bull/Bear", analogy: "Seasons.", img: "" },
            { t: "Dividend", analogy: "Fruit from tree.", img: "" },
            { t: "P/E Ratio", analogy: "Price tag.", img: "" },
            { t: "Market Cap", analogy: "Size.", img: "" }
        ]
    },
    "Wealth Empire": {
        swipes: [
            { q: "Surplus Cash", left: "Lifestyle", right: "Assets", correct: "right", text: "Feed empire." },
            { q: "Real Estate", left: "Rent", right: "Own", correct: "right", text: "Equity." },
            { q: "Estate Plan", left: "Later", right: "Now", correct: "right", text: "Protect." },
            { q: "Giving", left: "Keep", right: "Help", correct: "right", text: "Legacy." },
            { q: "Automation", left: "Manual", right: "Auto", correct: "right", text: "Scale." },
            { q: "Retirement", left: "65", right: "Number", correct: "right", text: "FI/RE." },
            { q: "Prenup", left: "Unromantic", right: "Smart", correct: "right", text: "Insurance." },
            { q: "Health", left: "Ignore", right: "Invest", correct: "right", text: "Wealth." }
        ],
        lies: [
            { text: "Wealth", options: ["Income", "Net Worth"], correct: 1, exp: "Keep vs Make." },
            { text: "Real Estate", options: ["Passive", "Active"], correct: 1, exp: "Toilets & Tenants." },
            { text: "Millionaire", options: ["Flashy", "Frugal"], correct: 1, exp: "Next door." },
            { text: "Tax", options: ["Avoid", "Evade"], correct: 0, exp: "Legal vs Illegal." },
            { text: "Retirement", options: ["Age", "Money"], correct: 1, exp: "Number." },
            { text: "Generational", options: ["Lasts forever", "Gone in 3 gens"], correct: 1, exp: "Shirt sleeves." },
            { text: "Happiness", options: ["Money buys it", "Money aids it"], correct: 1, exp: "Tool." },
            { text: "Giving", options: ["Loss", "Gain"], correct: 1, exp: "Purpose." }
        ],
        math: [
            { q: "4% of $1M?", a: 40000, t: "Withdrawal." },
            { q: "$1M - $200k?", a: 800000, t: "Net Worth." },
            { q: "Rent $1k - Exp $800?", a: 200, t: "Cash flow." },
            { q: "Leverage 5x on $10k?", a: 50000, t: "Power." },
            { q: "Tax 40% of $1M?", a: 400000, t: "Estate." },
            { q: "25x Expense $40k?", a: 1000000, t: "FI Number." },
            { q: "Give 10% of $1M?", a: 100000, t: "Impact." },
            { q: "Years to $1M @ 10%?", a: 7, t: "Doubling." }
        ],
        memes: [
            { cap: "Net Worth", text: "To the moon", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Landlord", text: "Passive?", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "FI/RE", text: "Quit job", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Taxes", text: "0%", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Inflation", text: "Rent goes up", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Legacy", text: "Trust fund baby", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Freedom", text: "Monday morning surf", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Generosity", text: "Batman", img: "https://i.imgflip.com/2b7c.jpg" }
        ],
        polls: [
            { q: "Retire?", o: ["Beach", "Work"], a: 1, t: "Purpose." },
            { q: "Legacy?", o: ["Kids", "Charity"], a: 0, t: "Values." },
            { q: "Home?", o: ["Asset", "Liability"], a: 0, t: "Debatable." },
            { q: "Crypto?", o: ["1%", "50%"], a: 0, t: "Risk." },
            { q: "Luxury?", o: ["Car", "Time"], a: 1, t: "Time." },
            { q: "Debt?", o: ["0", "Leverage"], a: 1, t: "Speed." },
            { q: "Location?", o: ["City", "Farm"], a: 0, t: "Cost." },
            { q: "Giving?", o: ["Now", "Later"], a: 0, t: "Habit." }
        ],
        infos: [
            { t: "Net Worth", analogy: "Scorecard.", img: "" },
            { t: "FI/RE", analogy: "Exit door.", img: "" },
            { t: "Leverage", analogy: "Fulcrum.", img: "" },
            { t: "Cash Flow", analogy: "River.", img: "" },
            { t: "Estate", analogy: "Fortress.", img: "" },
            { t: "Tax Drag", analogy: "Anchor.", img: "" },
            { t: "Philanthropy", analogy: "Planting.", img: "" },
            { t: "True Wealth", analogy: "Health.", img: "" }
        ]
    }
};

// --- GENERATOR ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    // Normalize World ID (Handle spaces vs no spaces)
    const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
    const worldName = worldMeta ? worldMeta.id : "Moola Basics"; 
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;
    
    const rng = new SeededRNG(levelId);
    
    // Strict Fallback: If world DB missing, default to Moola Basics, BUT
    // we have populated all 8 worlds now, so this should rarely happen.
    const worldDB = CONTENT_DB[worldName] || CONTENT_DB["Moola Basics"]; 

    // 1. BOSS GENERATION (UNIQUE PER LEVEL)
    // Logic: 24 questions per world / 8 levels = 3 unique questions per level.
    const bossNames = ["Goblin", "Troll", "Dragon", "Vampire", "Reaper", "Titan", "Golem", "Wizard"];
    const bossName = `${worldName.split(' ')[1] || "Money"} ${bossNames[(levelNum - 1) % bossNames.length]}`;
    
    const allWorldQuestions = BOSS_BATTLES[worldName] || BOSS_BATTLES["Moola Basics"];
    
    // STRICT SLICING: Level 1 gets 0-2, Level 2 gets 3-5, etc.
    // (levelNum - 1) * 3 ensures perfect segmentation.
    const startIndex = ((levelNum - 1) * 3) % allWorldQuestions.length;
    let levelBossQuestions = allWorldQuestions.slice(startIndex, startIndex + 3);
    
    // Fallback if array is short (shouldn't happen with full DB)
    if (levelBossQuestions.length < 3) {
        const remaining = 3 - levelBossQuestions.length;
        levelBossQuestions = [...levelBossQuestions, ...allWorldQuestions.slice(0, remaining)];
    }
    
    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: The ${bossName}`,
        description: "Defeat the boss to advance!",
        bossName: bossName,
        bossImage: ["👺", "👹", "👻", "👽", "🤖", "👾", "💀", "🤡"][(levelNum - 1) % 8],
        bossIntro: rng.pick(["I'm here to take your coins!", "You can't budget this!", "Your credit score is mine!", "Interest rates are rising!"]),
        bossQuiz: levelBossQuestions
    };

    // 2. LESSON GENERATION (6 Unique Lessons per Level)
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['swipe', 'tapLie', 'meme', 'calculator', 'info', 'poll']; 
    
    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content: any = {};
        let title = "Lesson";
        let xp = 100 + (i * 20);
        let coins = 50 + (i * 10);

        // CONTENT PICKER LOGIC
        // STRICT INDEXING: Ensure Level 1 gets index 0 of 'swipes', Level 2 gets index 1, etc.
        // This guarantees NO repeats across levels for the same type.
        const pickContent = (pool: any[]) => {
            if (!pool || pool.length === 0) return null;
            // STRICT: (Level - 1) maps 1->0, 2->1.
            // The pool size is 8, matching the 8 levels.
            const index = (levelNum - 1) % pool.length;
            return pool[index];
        };

        if (type === 'swipe') {
            const item = pickContent(worldDB.swipes) || { q: "Save?", left: "No", right: "Yes", correct: "right", text: "Save." };
            title = item.q.length > 20 ? "What's the move?" : item.q;
            content = {
                question: item.q,
                left: item.left,
                right: item.right,
                correct: item.correct, // 'left' or 'right'
                text: item.text,
                cards: [] 
            };
        } else if (type === 'tapLie') {
            const item = pickContent(worldDB.lies) || {text: "Lie?", options: ["True", "False"], correct: 1, exp: "False."};
            title = "Spot the Fake";
            content = {
                text: item.text,
                statements: item.options.map((opt: string, idx: number) => ({ text: opt, isLie: idx === item.correct }))
            };
        } else if (type === 'meme') {
            const item = pickContent(worldDB.memes) || {cap: "Stonks", text: "Up", img: ""};
            title = "Vibe Check";
            content = { imageUrl: item.img, topText: item.cap, bottomText: item.text, caption: "Meme Logic" };
        } else if (type === 'calculator') {
            const item = pickContent(worldDB.math) || {q: "1+1", a: 2, t: "Math."};
            title = "Quick Math";
            content = { label: "Solve", question: item.q, answer: item.a, text: item.t };
        } else if (type === 'poll') {
            const item = pickContent(worldDB.polls) || { q: "Cash?", o: ["Yes", "No"], a: 0, t: "Save it." };
            title = "Your Take";
            content = {
                question: item.q,
                options: item.o,
                correct: item.a,
                text: item.t
            };
        } else {
            const item = pickContent(worldDB.infos) || { t: "Save money." };
            title = "Knowledge Drop";
            content = { 
                text: item.t,
                analogy: item.analogy, 
                imageUrl: item.img     
            };
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
        "Plot twist: That was the broke option 🤡",
        "Even the goblin is judging you 👹",
        "Your credit score just dropped 50 points (jk) 📉",
        "Have fun staying poor! (meme reference) 🤪"
    ];
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
};
