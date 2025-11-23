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

// --- UNIQUE BOSS BATTLES PER WORLD ---
const BOSS_BATTLES: Record<string, BossQuestion[]> = {
    "Moola Basics": [
        { question: "Which puts money IN your pocket?", options: ["Liabilities", "Assets", "Expenses"], correctIndex: 1, explanation: "Assets pay you (stocks, business). Liabilities cost you." },
        { question: "Inflation causes prices to...", options: ["Stay same", "Decrease", "Increase"], correctIndex: 2, explanation: "Inflation makes your cash worth less over time." },
        { question: "The best time to start saving?", options: ["Tomorrow", "Next Year", "Now"], correctIndex: 2, explanation: "Time is your biggest asset. Start today." }
    ],
    "Budget Beach": [
        { question: "In 50/30/20, what is the 50%?", options: ["Wants", "Needs", "Savings"], correctIndex: 1, explanation: "50% for Needs (Rent, Food), 30% Wants, 20% Savings." },
        { question: "An Emergency Fund is for...", options: ["PS5", "Unexpected Bills", "Vacation"], correctIndex: 1, explanation: "It's for true emergencies like car repairs or medical bills." },
        { question: "Net Income is...", options: ["Before Tax", "After Tax", "Imaginary"], correctIndex: 1, explanation: "Net is what actually hits your bank account." }
    ],
    "Compound Cliffs": [
        { question: "Compound Interest is...", options: ["Linear growth", "Interest on Interest", "A bank fee"], correctIndex: 1, explanation: "Your money earns money, then that money earns more money." },
        { question: "Rule of 72 calculates...", options: ["Taxes", "Doubling Time", "Retirement Age"], correctIndex: 1, explanation: "Divide 72 by interest rate to see years to double." },
        { question: "If market crashes, you should...", options: ["Panic Sell", "Hold/Buy", "Cry"], correctIndex: 1, explanation: "You only lose money if you sell low. Ride it out." }
    ],
    "Bank Vault": [
        { question: "FDIC insures deposits up to...", options: ["$1 Million", "$250,000", "$50,000"], correctIndex: 1, explanation: "The government protects up to $250k per bank." },
        { question: "Which account pays more interest?", options: ["Checking", "HYSA", "Under mattress"], correctIndex: 1, explanation: "High Yield Savings Accounts (HYSA) pay 4-5%." },
        { question: "Overdraft fees happen when...", options: ["You have too much money", "Balance goes negative", "You use an ATM"], correctIndex: 1, explanation: "Spending more than you have triggers fees." }
    ],
    "Debt Dungeon": [
        { question: "High APR means...", options: ["High Cost", "Low Cost", "Free Money"], correctIndex: 0, explanation: "Annual Percentage Rate. Higher = More expensive debt." },
        { question: "Paying only the minimum...", options: ["Is smart", "Keeps you in debt", "Builds wealth"], correctIndex: 1, explanation: "Minimum payments mostly cover interest, not the loan." },
        { question: "A good credit score is...", options: ["300", "500", "750+"], correctIndex: 2, explanation: "750+ gets you the best rates on loans." }
    ],
    "Hustle Hub": [
        { question: "Gross Income is...", options: ["Total Earned", "Take Home", "Tax Refund"], correctIndex: 0, explanation: "Gross is the big number before taxes steal it." },
        { question: "A 'W2' employee...", options: ["Pays own tax later", "Has tax withheld", "Is a freelancer"], correctIndex: 1, explanation: "Employers take taxes out automatically for W2s." },
        { question: "Profit equals...", options: ["Revenue", "Revenue - Expenses", "Cash in bank"], correctIndex: 1, explanation: "It's not what you make, it's what you keep." }
    ],
    "Stony Stocks": [
        { question: "Buying a share means...", options: ["Owning part of company", "Loaning money", "Gambling"], correctIndex: 0, explanation: "Stocks represent fractional ownership." },
        { question: "Diversification helps...", options: ["Increase Risk", "Lower Risk", "Avoid Taxes"], correctIndex: 1, explanation: "Don't put all eggs in one basket." },
        { question: "A 'Bear Market' means...", options: ["Prices Rising", "Prices Falling", "Zoo is open"], correctIndex: 1, explanation: "Bears swipe down. Prices drop." }
    ],
    "Wealth Empire": [
        { question: "Net Worth formula?", options: ["Income + Expenses", "Assets - Liabilities", "Cash + Stocks"], correctIndex: 1, explanation: "What you OWN minus what you OWE." },
        { question: "Cash flow is...", options: ["Money moving in/out", "Water", "Savings"], correctIndex: 0, explanation: "Positive cash flow means more coming in than going out." },
        { question: "Financial Independence is...", options: ["Being rich", "Assets pay living costs", "Winning lottery"], correctIndex: 1, explanation: "When you don't HAVE to work to survive." }
    ]
};

// --- FULL CONTENT DATABASE ---
// Guaranteed 8 unique items per category per world.

const CONTENT_DB: Record<string, any> = {
    "Moola Basics": {
        swipes: [
            { q: "Found $20 on the ground", left: "Save it", right: "Spend it", correct: "left", text: "Emergency fund starts with the first $20." },
            { q: "New iPhone just dropped", left: "Buy Now", right: "Wait 6 Months", correct: "right", text: "It's the same phone. Wait and save $300." },
            { q: "Friend asks for $50 loan", left: "Say No", right: "Give it", correct: "left", text: "Don't lend money you can't afford to lose." },
            { q: "Starbucks run", left: "$7 Latte", right: "Home Coffee", correct: "right", text: "That $7 daily is $2,500 a year. Ouch." },
            { q: "Grandma sends $100", left: "Invest", right: "V-Bucks", correct: "left", text: "Compound interest loves Grandma's money." },
            { q: "Sale: 50% off useless item", left: "Buy it", right: "Ignore", correct: "right", text: "Spending $50 to save $50 is still spending $50." },
            { q: "Needs vs Wants", left: "Air Jordans", right: "Winter Coat", correct: "right", text: "Don't freeze for the drip. Coat is a need." },
            { q: "Paycheck hits", left: "Spend First", right: "Save First", correct: "right", text: "Pay yourself first, then pay Nike." }
        ],
        lies: [
            { text: "Money Myths", options: ["Money grows on trees", "Inflation eats savings", "Banks are businesses", "Taxes are real"], correct: 0, exp: "Trees don't print cash. Only the Fed does that." },
            { text: "Rich People Secrets", options: ["They spend everything", "They invest early", "They avoid bad debt", "They track spending"], correct: 0, exp: "Rich people stay rich by NOT spending everything." },
            { text: "Banking Facts", options: ["Banks keep cash in a vault", "Banks lend your money out", "FDIC protects up to $250k", "Interest is free money"], correct: 0, exp: "Banks lend your money! It's not just sitting in a box." },
            { text: "Inflation Truths", options: ["Prices go down over time", "Cash loses value", "Assets beat inflation", "Cost of living rises"], correct: 0, exp: "Prices almost always go UP. That's inflation." },
            { text: "Saving Rules", options: ["Save what's left over", "Pay yourself first", "Automate transfers", "Start small"], correct: 0, exp: "If you save what's left, there will be nothing left." },
            { text: "Debit vs Credit", options: ["Debit builds credit score", "Credit uses borrowed money", "Debit uses your money", "Credit has interest"], correct: 0, exp: "Debit cards do NOT build credit score." },
            { text: "Emergency Fund", options: ["For buying PS5", "For medical bills", "For car repairs", "For job loss"], correct: 0, exp: "PS5 is an emergency for your boredom, not your wallet." },
            { text: "Compound Interest", options: ["It's linear math", "It's exponential", "It helps savers", "It hurts borrowers"], correct: 0, exp: "It's exponential! The curve goes vertical." }
        ],
        memes: [
            { cap: "Me expecting to be rich", text: "Without saving a dollar", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation hitting my wallet", text: "My $10 is now $5", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Buying coffee daily", text: "Wondering why I'm broke", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Found some loose change", text: "We eating good tonight", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Saving $5", text: "I am financial genius", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Checking bank account", text: "Calculated risk... but man am I bad at math", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "When you skip the avocado toast", text: "Where is my mansion?", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Financial Advisor", text: "Stop buying skins. Me: No.", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "$10/mo at 8% for 40 years?", a: 35000, t: "That's a nice car for the price of one streaming sub." },
            { q: "Inflation at 3%. $100 becomes?", a: 97, t: "You lose money by holding cash under the mattress." },
            { q: "Save $50/mo vs Spend $50/mo. Gap in 1 year?", a: 1200, t: "You have $600, they lost $600. The gap is double!" },
            { q: "10% of $500 paycheck?", a: 50, t: "The minimum you should be saving." },
            { q: "Double $1 twenty times?", a: 1000000, t: "Exponential growth is wild." },
            { q: "Opportunity Cost of $100 today vs 10%?", a: 110, t: "Spending $100 today costs you $110 next year." },
            { q: "$1000 credit card debt at 20% for 1 year?", a: 1200, t: "You paid $200 just to borrow money. Ouch." },
            { q: "$5 latte x 365 days?", a: 1825, t: "That's a vacation to Hawaii you drank." }
        ]
    },
    "Budget Beach": {
        swipes: [
            { q: "50/30/20 Rule", left: "50% Wants", right: "50% Needs", correct: "right", text: "Needs (Rent/Food) come first. 50% is the limit." },
            { q: "Unexpected Bonus", left: "Budget It", right: "YOLO It", correct: "left", text: "Every dollar needs a job." },
            { q: "Subscription Audit", left: "Keep All", right: "Cancel Unused", correct: "right", text: "You haven't watched Hulu in 6 months. Cut it." },
            { q: "Grocery Shopping", left: "Hungry", right: "Full", correct: "right", text: "Never shop hungry. You'll buy junk." },
            { q: "Tracking Expenses", left: "In Head", right: "In App", correct: "right", text: "Your brain lies. The app has receipts." },
            { q: "Rent is 60% of income", left: "Sign Lease", right: "Find Roommate", correct: "right", text: "You'll be house poor. Get a roommate." },
            { q: "Eating Out", left: "Daily", right: "Weekly Treat", correct: "right", text: "Make it special, not a habit." },
            { q: "Generic vs Brand Name", left: "Generic Meds", right: "Brand Meds", correct: "left", text: "It's the exact same chemical. Save the cash." }
        ],
        lies: [
            { text: "Budgeting Lies", options: ["Budgets restrict freedom", "Budgets give control", "Rich people budget", "Corporations budget"], correct: 0, exp: "A budget tells your money where to go instead of wondering where it went." },
            { text: "Necessities", options: ["Netflix is a need", "Water is a need", "Shelter is a need", "Medicine is a need"], correct: 0, exp: "Netflix is fun, but you won't die without it." },
            { text: "Cutting Costs", options: ["Stop eating entirely", "Cook at home", "Use coupons", "Buy bulk"], correct: 0, exp: "Starving isn't a strategy. Cooking is." },
            { text: "Fixed Expenses", options: ["Dining out", "Rent", "Insurance", "Car Payment"], correct: 0, exp: "Dining out fluctuates. Rent is fixed." },
            { text: "Variable Expenses", options: ["Mortgage", "Groceries", "Electricity", "Entertainment"], correct: 0, exp: "Mortgage stays same. The rest vary." },
            { text: "Zero-Based Budget", options: ["Balance is $0", "Income minus Expenses = 0", " Spend nothing", "Every dollar assigned"], correct: 2, exp: "It doesn't mean spend nothing. It means plan everything." },
            { text: "Sinking Funds", options: ["Titanic money", "Saving for specific goal", "Car repair fund", "Christmas fund"], correct: 0, exp: "It's saving a little bit monthly for a big future bill." },
            { text: "Envelope Method", options: ["Mailing checks", "Cash in envelopes", "Physical limits", "Visual tracking"], correct: 0, exp: "It's about sorting cash for categories, not mail." }
        ],
        memes: [
            { cap: "Me making a budget", text: "Food: $20. Candles: $3000.", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "When check card declines", text: "But I had $5 yesterday?", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Looking at bank account", text: "I am never gonna financially recover", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Spending $100 on food", text: "Vs $10 shipping (Too expensive)", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Subscription Renewed", text: "I thought I cancelled you", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Me ignoring my budget", text: "This is fine.", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Buying store brand", text: "Taste the savings", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "When you save $1", text: "Stonks", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Income $2000. 50/30/20. Needs?", a: 1000, t: "Half goes to survival." },
            { q: "Income $2000. 50/30/20. Wants?", a: 600, t: "30% for fun. That's $600!" },
            { q: "Income $2000. 50/30/20. Savings?", a: 400, t: "20% for future you." },
            { q: "Rent $1200 on $2000 income?", a: 60, t: "That's 60%. Way too high!" },
            { q: "Cut $5 daily coffee. Monthly savings?", a: 150, t: "Simple math, big impact." },
            { q: "Subscription $15/mo. Yearly cost?", a: 180, t: "Is it worth $180?" },
            { q: "$1000 emergency fund. Save $50/wk. Weeks?", a: 20, t: "Less than half a year to safety." },
            { q: "Spend $110 for every $100 earned.", a: -10, t: "You are going broke fast." }
        ]
    },
    "Compound Cliffs": {
        swipes: [
            { q: "Start Investing", left: "At 18", right: "At 30", correct: "left", text: "Starting early is the biggest cheat code." },
            { q: "Compound Frequency", left: "Annually", right: "Daily", correct: "right", text: "More frequent compounding = more money." },
            { q: "Market Crash", left: "Sell All", right: "Hold Tight", correct: "right", text: "You only lose if you sell at the bottom." },
            { q: "High Risk", left: "Short Term", right: "Long Term", correct: "right", text: "Risk usually smooths out over 20 years." },
            { q: "Interest Rate", left: "0.01% Bank", right: "8% Index", correct: "right", text: "0.01% doesn't even beat inflation." },
            { q: "Doubling Money", left: "Rule of 72", right: "Guess", correct: "left", text: "72 / Rate = Years to double." },
            { q: "Consistency", left: "Lump Sum Once", right: "Monthly DCA", correct: "right", text: "Dollar Cost Averaging wins psychologically." },
            { q: "Withdrawal", left: "Interrupt Compounding", right: "Let it Ride", correct: "right", text: "Don't kill the snowball while it's rolling." }
        ],
        lies: [
            { text: "Investing Myths", options: ["You need to be rich", "You can start with $5", "Time > Timing", "Index funds work"], correct: 0, exp: "You can start with spare change apps!" },
            { text: "Stock Market", options: ["It's a casino", "It reflects economy", "Ownership in companies", "Long term growth"], correct: 0, exp: "It's not gambling if you diversify and hold." },
            { text: "Compound Growth", options: ["Only for math nerds", "8th wonder of world", "Money makes money", "Exponential growth"], correct: 0, exp: "Einstein called it the 8th wonder. It's for everyone." },
            { text: "Risk", options: ["Savings accounts have risk", "Stocks have risk", "Cash has no risk", "Inflation is a risk"], correct: 2, exp: "Cash has 'Purchasing Power Risk' due to inflation." },
            { text: "Day Trading", options: ["Easy money", "High risk", "Most lose money", "Stressful"], correct: 0, exp: "90% of day traders lose money." },
            { text: "Capital Gains", options: ["Tax on profit", "Tax on revenue", "Short term rates", "Long term rates"], correct: 1, exp: "You only pay tax on the PROFIT (Gain), not the total amount." },
            { text: "Index Funds", options: ["Buy whole market", "Low fees", "Beat most pros", "High maintenance"], correct: 3, exp: "They are the ultimate 'lazy' wealth builder." },
            { text: "Time in Market", options: ["Beats timing the market", "Is irrelevant", "Reduces risk", "Builds wealth"], correct: 1, exp: "Time in the market is EVERYTHING." }
        ],
        memes: [
            { cap: "Warren Buffett", text: "Time is money", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Me checking portfolio 5 mins after buying", text: "Where Lambo?", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Compound Interest Graph", text: "To the moon", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Selling in a crash", text: "Paper hands", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Buying the dip", text: "And it keeps dipping", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Safe investments", text: "Boring but rich", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Day traders vs Holders", text: "Holders sleeping peacefully", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Inflation", text: "I am inevitable", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Start at 20 vs 30. Value at 60?", a: 2, t: "Starting 10 years earlier can DOUBLE your result." },
            { q: "Rate 10%. Years to double?", a: 7.2, t: "Doubles every 7.2 years." },
            { q: "$1000 at 10% after 2 years?", a: 1210, t: "You gain interest on your interest ($10)." },
            { q: "Lose 50%. Gain needed to break even?", a: 100, t: "If $100 drops to $50, you need +$50 (100%) to get back!" },
            { q: "S&P 500 Avg Return?", a: 10, t: "Historically about 10% per year." },
            { q: "Years to turn $1 to $2 at 7%?", a: 10, t: "Roughly 10 years." },
            { q: "$5000 one time at 8% for 50 years?", a: 234000, t: "One deposit. Half a century. Quarter million." },
            { q: "Fee 1% vs 0.1%. On $1M?", a: 9000, t: "You save $9,000 a year just on fees!" }
        ]
    },
    "Bank Vault": {
        swipes: [
            { q: "Checking vs Savings", left: "Spending Money", right: "Hoarding Money", correct: "left", text: "Checking is for flow. Savings is for growth." },
            { q: "ATM Fee $3", left: "Pay it", right: "Find Network ATM", correct: "right", text: "Don't pay to access your own money." },
            { q: "Overdraft Protection", left: "Turn On", right: "Turn Off", correct: "right", text: "Often has fees. Better to just decline the card." },
            { q: "Direct Deposit", left: "Manual Check", right: "Auto Deposit", correct: "right", text: "Faster, safer, and often unlocks perks." },
            { q: "High Yield Savings", left: "0.01% APR", right: "4.5% APR", correct: "right", text: "Make your idle cash work." },
            { q: "Bank Alert", left: "Ignore", right: "Check Fraud", correct: "right", text: "Catch hacks early." },
            { q: "Paper Statements", left: "Keep", right: "Go Digital", correct: "right", text: "Secure and eco-friendly." },
            { q: "Mobile Deposit", left: "Drive to Bank", right: "Snap Photo", correct: "right", text: "Save gas money." }
        ],
        lies: [
            { text: "Bank Fees", options: ["Maintenance fee", "Overdraft fee", "ATM fee", "Attendance fee"], correct: 3, exp: "Attendance fee isn't real. The rest are scams to avoid." },
            { text: "Credit Unions", options: ["For profit", "Member owned", "Better rates", "Community focus"], correct: 0, exp: "Credit Unions are non-profit!" },
            { text: "FDIC Insurance", options: ["Protects crypto", "Protects cash", "Up to $250k", "Govt backed"], correct: 0, exp: "Crypto is NOT insured." },
            { text: "Debit Cards", options: ["Spending limit", "PIN security", "Builds credit", "Instant withdrawal"], correct: 2, exp: "Debit cards do not build credit." },
            { text: "Online Banks", options: ["No physical branches", "Higher rates", "Scams", "Lower fees"], correct: 2, exp: "They are legit and usually pay way better rates." },
            { text: "ChexSystems", options: ["Bank report card", "Tracks bad behavior", "Blocks new accounts", "Tracks calories"], correct: 3, exp: "It tracks banking history, not food." },
            { text: "Wire Transfer", options: ["Instant", "Can be costly", "Reversible", "For big moves"], correct: 2, exp: "Wires are almost never reversible. Be careful." },
            { text: "CD (Certificate of Deposit)", options: ["Locks money", "Higher rate", "Musical disc", "Safe return"], correct: 2, exp: "Not a Compact Disc. It's a savings term." }
        ],
        memes: [
            { cap: "Bank fees", text: "I will find you", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "0.01% Interest", text: "Thanks for the penny", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Overdrafting by $1", text: "$35 Fee", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Credit Union vs Bank", text: "Virgin Bank vs Chad Union", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Forgot PIN", text: "Guess I live here now", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Mobile Deposit", text: "Technology is magic", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Minimum Balance", text: "You are too poor to have money here", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Direct Deposit hitting early", text: "Rich for 2 days", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "$10k at 0.01% vs 5%. Diff?", a: 499, t: "$1 vs $500. Choose the HYSA." },
            { q: "$35 Overdraft x 4 times?", a: 140, t: "Expensive mistakes." },
            { q: "$12 monthly fee x 10 years?", a: 1440, t: "Banks get rich on fees." },
            { q: "Transfer limit 6/mo?", a: 6, t: "Savings accounts have federal limits." },
            { q: "$250,000 FDIC limit?", a: 250000, t: "Per depositor, per bank." },
            { q: "CD rate 5% for 2 years. $1000?", a: 1102, t: "Locked in growth." },
            { q: "ATM fee $4. Weekly widthdrawal?", a: 208, t: "$200 a year to touch your cash." },
            { q: "Check bounces. Fee?", a: 30, t: "Insufficient funds fee." }
        ]
    },
    "Debt Dungeon": {
        swipes: [
            { q: "Credit Card Balance", left: "Pay Minimum", right: "Pay Full", correct: "right", text: "Minimum payments are a trap to keep you in debt forever." },
            { q: "Predatory Loan", left: "Sign It", right: "Run Away", correct: "right", text: "300% interest is legal robbery." },
            { q: "Student Loans", left: "Federal", right: "Private", correct: "left", text: "Federal loans have better protections and forgiveness." },
            { q: "Buy Now Pay Later", left: "For Clothes", right: "Avoid", correct: "right", text: "Don't finance a hoodie." },
            { q: "Credit Score", left: "Ignore", right: "Monitor", correct: "right", text: "It determines if you can rent an apartment." },
            { q: "Utilization Ratio", left: "Max Out", right: "Keep <30%", correct: "right", text: "Using too much credit hurts your score." },
            { q: "Missed Payment", left: "Call Bank", right: "Hide", correct: "left", text: "Ask for forgiveness. Hiding makes it worse." },
            { q: "Co-signing", left: "For Friend", right: "Never", correct: "right", text: "If they don't pay, YOU have to." }
        ],
        lies: [
            { text: "Credit Score Factors", options: ["Payment History", "Utilization", "Income", "Age of Credit"], correct: 2, exp: "Income is NOT part of your FICO score." },
            { text: "Bankruptcy", options: ["Erases all debt", "Ruins credit for years", "Last resort", "Legal process"], correct: 0, exp: "It doesn't erase student loans or taxes usually." },
            { text: "Good Debt", options: ["Mortgage", "Business Loan", "Credit Card for Pizza", "Student Loan"], correct: 2, exp: "Pizza is bad debt. It has no ROI." },
            { text: "APR", options: ["Annual Percentage Rate", "Apple Pie Recipe", "Cost of borrowing", "Includes fees"], correct: 1, exp: "Not pie. It's the price of debt." },
            { text: "Collections", options: ["Friendly calls", "Legal action", "Credit score drop", "Wage garnishment"], correct: 0, exp: "They are not friendly." },
            { text: "Credit Cards", options: ["Free money", "Build credit", "Offer rewards", "High interest"], correct: 0, exp: "It's a loan, not free cash." },
            { text: "Payday Loans", options: ["Fast cash", "Predatory", "Low interest", "Debt trap"], correct: 2, exp: "Interest can be 400%+. Avoid!" },
            { text: "Hard Inquiry", options: ["Checks credit", "Lowers score slightly", "Stays 2 years", "Hurts forever"], correct: 3, exp: "It recovers quickly." }
        ],
        memes: [
            { cap: "Paying minimum balance", text: "I'll be done in 40 years", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Credit Score drops 50 points", text: "Because I spent $5", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Student Loans", text: "Hello there", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Approved for credit card", text: "Unlimited Power!", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Interest Rates", text: "Stonks for the bank", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Buying car at 29% APR", text: "Deal of a lifetime", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "After paying off debt", text: "Freedom", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Klarna", text: "4 easy payments of pain", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "$5000 debt. Min pay 2%. Amount?", a: 100, t: "You pay $100, but interest eats most of it." },
            { q: "20% APR on $1000. Interest/yr?", a: 200, t: "That's $200 gone." },
            { q: "Score 850 vs 300. Range?", a: 550, t: "FICO range is 300-850." },
            { q: "30% utilization of $1000 limit?", a: 300, t: "Don't spend more than this." },
            { q: "$100 late fee x 12 months?", a: 1200, t: "Being disorganized is expensive." },
            { q: "Payday loan $500. Pay back $600 in 2 weeks. APR?", a: 520, t: "That's a 520% annualized rate!" },
            { q: "3 inquiries. 5 pts each. Drop?", a: 15, t: "Small dip, but adds up." },
            { q: "Loan term 3yr vs 6yr. Monthly pay?", a: 0, t: "6yr has lower monthly, but higher total interest." }
        ]
    },
    "Hustle Hub": {
        swipes: [
            { q: "Gig Economy", left: "Drive Uber", right: "Start Brand", correct: "right", text: "Building a brand is an asset. Driving is just labor." },
            { q: "Tax Refund", left: "Free Money", right: "My Money Back", correct: "right", text: "A refund means you gave the government an interest-free loan." },
            { q: "Salary Negotiation", left: "Take Offer", right: "Ask 10% More", correct: "right", text: "Always ask. The worst they say is no." },
            { q: "Side Hustle Income", left: "Hide from IRS", right: "Report It", correct: "right", text: "Tax evasion is a crime. Jail is not a vibe." },
            { q: "Skill Up", left: "Learn Code", right: "Watch Netflix", correct: "left", text: "Skills pay bills." },
            { q: "Networking", left: "Cold DM", right: "Warm Intro", correct: "right", text: "A warm intro is 10x more effective." },
            { q: "Business Idea", left: "Sell Product", right: "Sell Service", correct: "right", text: "Service (time) is easier to start with $0." },
            { q: "Profit Calculation", left: "Revenue", right: "Rev - Expenses", correct: "right", text: "Revenue is vanity, profit is sanity." }
        ],
        lies: [
            { text: "Success Myths", options: ["Luck only", "Hard work + Strategy", "Inheritance required", "College required"], correct: 1, exp: "Strategy beats luck every time." },
            { text: "Tax Brackets", options: ["Earn more, keep less", "Marginal rates", "Flat tax", "Only for rich"], correct: 1, exp: "You only pay higher rates on the money ABOVE the bracket." },
            { text: "LLC", options: ["Limited Liability Company", "Legal Loophole Club", "Protects personal assets", "Business structure"], correct: 1, exp: "It protects your personal house from business lawsuits." },
            { text: "Gross vs Net", options: ["Gross is before tax", "Net is take home", "Gross is disgusting", "Net is bigger"], correct: 2, exp: "Gross is total pay. Net is what hits your bank." },
            { text: "1099 vs W2", options: ["W2 is employee", "1099 is contractor", "1099 pays own tax", "W2 has no benefits"], correct: 3, exp: "W2 usually HAS benefits. 1099 does not." },
            { text: "Passive Income", options: ["Requires zero work", "Work upfront, pay later", "Rentals", "Dividends"], correct: 0, exp: "It requires work upfront to build the asset." },
            { text: "Scalability", options: ["Selling time", "Selling software", "Reaching millions", "Low variable cost"], correct: 0, exp: "Selling time is NOT scalable. You only have 24h." },
            { text: "Burnout", options: ["Badge of honor", "Productivity killer", "Health risk", "Avoidable"], correct: 0, exp: "Burnout stops the money. Rest is productive." }
        ],
        memes: [
            { cap: "Me working hard", text: "Boss makes a dollar, I make a dime", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Freelancers during tax season", text: "I have no idea what I'm doing", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Getting first client", text: "It's happening!", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Influencers", text: "Buy my course", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Networking", text: "Adding people on LinkedIn I don't know", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "My side hustle", text: "Made $5 (spent $50)", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Passive Income", text: "Sleep and get paid", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "IRS", text: "Knock knock", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Gross $100k. Tax 30%. Net?", a: 70000, t: "You keep $70k." },
            { q: "Hourly $20. 40hrs/wk. 50 weeks?", a: 40000, t: "Full time annual income." },
            { q: "Sell item for $20. Cost $5. Profit?", a: 15, t: "Margin matters." },
            { q: "Freelance $1000. Save 30% for tax?", a: 300, t: "Always save for the tax man." },
            { q: "Raise 5%. Inflation 3%. Real gain?", a: 2, t: "You only really gained 2% purchasing power." },
            { q: "Commute $10/day. Work from home save?", a: 2600, t: "Assuming 260 working days." },
            { q: "Side hustle $500/mo. Yearly?", a: 6000, t: "That's a nice vacation." },
            { q: "Salary $50k vs Contract $50k. Better?", a: 0, t: "Salary is better (benefits + employer pays half tax)." }
        ]
    },
    "Stony Stocks": {
        swipes: [
            { q: "Market Dip", left: "Panic Sell", right: "Buy More", correct: "right", text: "Buy low, sell high. Panic selling is selling low." },
            { q: "Diversify", left: "All in Tesla", right: "S&P 500", correct: "right", text: "Don't put all your eggs in one basket." },
            { q: "Crypto Allocation", left: "100% Portfolio", right: "5% Portfolio", correct: "right", text: "Crypto is volatile. Keep it a small slice." },
            { q: "Bull Market", left: "Stocks Up", right: "Stocks Down", correct: "left", text: "Bull = Up. Bear = Down." },
            { q: "Bear Market", left: "Stocks Up", right: "Stocks Down", correct: "right", text: "Bear swipes down. Markets fall." },
            { q: "Dividends", left: "Keep Cash", right: "Reinvest", correct: "right", text: "DRIP (Dividend Reinvestment) accelerates growth." },
            { q: "IPO Hype", left: "Buy Immediately", right: "Wait and See", correct: "right", text: "IPOs often crash after the initial hype." },
            { q: "Research", left: "Reddit Rumors", right: "Earnings Report", correct: "right", text: "Trust data, not 'TrustMeBro69'." }
        ],
        lies: [
            { text: "Stock Types", options: ["Growth", "Value", "Dividend", "Guaranteed"], correct: 3, exp: "No stock is guaranteed to go up." },
            { text: "Market Cap", options: ["Price x Shares", "Total Value", "Number of Caps", "Size of company"], correct: 2, exp: "It has nothing to do with hats." },
            { text: "P/E Ratio", options: ["Price to Earnings", "Physical Ed", "Valuation metric", "High means expensive"], correct: 1, exp: "It helps you know if a stock is cheap or pricey." },
            { text: "ETF", options: ["Exchange Traded Fund", "Basket of stocks", "Electronic Transfer", "Instant diversification"], correct: 2, exp: "It stands for Exchange Traded Fund." },
            { text: "Volatility", options: ["Price stability", "Price swings", "Risk measure", "Beta"], correct: 0, exp: "Volatility means BIG swings, not stability." },
            { text: "Short Selling", options: ["Betting against", "Selling early", "Infinite risk", "Advanced strategy"], correct: 1, exp: "It's betting the price will go DOWN." },
            { text: "Blue Chip", options: ["Reliable company", "Poker chip", "Coca Cola / Apple", "Stable"], correct: 1, exp: "It refers to high-quality, established companies." },
            { text: "Recession", options: ["GDP decline", "Job losses", "Stocks fall", "Great time to sell"], correct: 3, exp: "It's usually a terrible time to sell, but a great time to buy." }
        ],
        memes: [
            { cap: "Buying high selling low", text: "This is the way", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Jerome Powell", text: "Money printer go brrr", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Crypto investors", text: "First time?", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Diamond Hands", text: "Holding until $0", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Analyst predictions", text: "It might go up or down", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Watching chart 24/7", text: "Productivity -100", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Dividend payment $0.12", text: "I'm rich", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Market Crash", text: "Fire sale!", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Stock $100. Div 3%. Payout?", a: 3, t: "$3 per year for holding." },
            { q: "Buy $50. Sell $75. Gain?", a: 50, t: "50% gain. (($75-$50)/$50)." },
            { q: "Loss 10% on $100. New price?", a: 90, t: "Math is easy when you cry." },
            { q: "Avg return 7%. Years to double?", a: 10, t: "Rule of 72." },
            { q: "100 shares at $10. Total?", a: 1000, t: "Your position size." },
            { q: "Stock splits 2-for-1. You had 10. Now?", a: 20, t: "You have double shares, price is half." },
            { q: "Expense Ratio 0.5% on $10k?", a: 50, t: "Fees eat gains." },
            { q: "Tax 15% on $100 profit?", a: 15, t: "Capital gains tax." }
        ]
    },
    "Wealth Empire": {
        swipes: [
            { q: "Net Worth", left: "Income", right: "Assets - Debt", correct: "right", text: "Income is what you earn. Net worth is what you keep." },
            { q: "Inflation Hedge", left: "Cash", right: "Real Estate", correct: "right", text: "Real estate tends to rise with inflation." },
            { q: "Luxury Car", left: "Asset", right: "Liability", correct: "right", text: "It loses value every day. That's a liability." },
            { q: "Financial Freedom", left: "High Salary", right: "Passive Income", correct: "right", text: "Freedom is when assets pay your bills." },
            { q: "Philanthropy", left: "Hoard Wealth", right: "Give Back", correct: "right", text: "True wealth is having enough to share." },
            { q: "Estate Plan", left: "For Old People", right: "For Everyone", correct: "right", text: "Decide where your stuff goes, or the state will." },
            { q: "FIRE Movement", left: "Burn Money", right: "Retire Early", correct: "right", text: "Financial Independence, Retire Early." },
            { q: "Leverage", left: "Credit Cards", right: "Mortgage", correct: "right", text: "Good leverage (mortgage) builds wealth. Bad leverage destroys it." }
        ],
        lies: [
            { text: "Wealth Factors", options: ["Mindset", "Habits", "Lottery Ticket", "Time"], correct: 2, exp: "The lottery is a tax on people who can't do math." },
            { text: "Real Estate", options: ["Passive income", "Appreciation", "Tax benefits", "Always goes up"], correct: 3, exp: "It usually goes up, but 2008 proved it's not 'always'." },
            { text: "Legacy", options: ["Money left behind", "Values taught", "Impact made", "High score"], correct: 3, exp: "Life isn't a video game. Legacy is people." },
            { text: "Tax Havens", options: ["Legal minimization", "Illegal evasion", "Offshore accounts", "Panama"], correct: 1, exp: "Minimization is smart. Evasion is illegal." },
            { text: "Prenup", options: ["Planning for divorce", "Protecting assets", "Financial agreement", "Unromantic"], correct: 0, exp: "It's insurance for your empire, not a plan to fail." },
            { text: "Angel Investor", options: ["Divine being", "Invests in startups", "High risk", "Equity owner"], correct: 0, exp: "Rich person funding startups, not a ghost." },
            { text: "Trust Fund", options: ["Legal structure", "Spoiled kids", "Asset protection", "Control from grave"], correct: 1, exp: "Trusts are tools. Stereotypes are side effects." },
            { text: "Generational Wealth", options: ["Lasts forever", "Hard to build", "Easy to lose", "Requires education"], correct: 0, exp: "70% of wealthy families lose it by the 2nd generation." }
        ],
        memes: [
            { cap: "Me retiring at 35", text: "My friends working till 70", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Buying a rental property", text: "Look at me, I am the landlord now", img: "https://i.imgflip.com/24y43o.jpg" },
            { cap: "Taxes", text: "I will take half", img: "https://i.imgflip.com/3l60ph.jpg" },
            { cap: "Inheritance", text: "Don't spend it all in one place", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Rich vs Wealthy", text: "Rolex vs Freedom", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "Inflation", text: "My assets going up", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Net Worth update", text: "Green line go up", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Generational Wealth", text: "Planting trees you'll never sit under", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Assets $500k. Debt $200k. Net Worth?", a: 300000, t: "Assets minus Liabilities." },
            { q: "4% Rule on $1M. Yearly spend?", a: 40000, t: "Safe withdrawal rate for retirement." },
            { q: "Rent $2000. Mortgage $1500. Cashflow?", a: 500, t: "Profit per month." },
            { q: "House $300k. Appreciates 10%. Value?", a: 330000, t: "Equity growth." },
            { q: "Donating 10% of $50k income?", a: 5000, t: "Tithing or charity." },
            { q: "Retire with $2M. 5% return. Income?", a: 100000, t: "Living off interest." },
            { q: "$1M estate. 40% tax over limit. Tax?", a: 0, t: "Estate tax usually starts at $12M+ (federal)." },
            { q: "Save 50% of income. Years to retire?", a: 17, t: "The math of early retirement." }
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
    const worldDB = CONTENT_DB[worldName] || CONTENT_DB["Moola Basics"]; // Fallback

    // 1. BOSS GENERATION (UNIQUE PER WORLD)
    const bossNames = ["Goblin", "Troll", "Dragon", "Vampire", "Reaper", "Titan", "Golem", "Wizard"];
    const bossName = `${worldName.split(' ')[1] || "Money"} ${bossNames[(levelNum - 1) % bossNames.length]}`;
    
    // Pick unique boss questions for this world
    const bossQuestions = BOSS_BATTLES[worldName] || BOSS_BATTLES["Moola Basics"];
    
    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: The ${bossName}`,
        description: "Defeat the boss to advance!",
        bossName: bossName,
        bossImage: ["👺", "👹", "👻", "👽", "🤖", "👾", "💀", "🤡"][(levelNum - 1) % 8],
        bossIntro: rng.pick(["I'm here to take your coins!", "You can't budget this!", "Your credit score is mine!", "Interest rates are rising!"]),
        bossQuiz: bossQuestions // No longer hardcoded!
    };

    // 2. LESSON GENERATION (6 Unique Lessons)
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['swipe', 'tapLie', 'meme', 'calculator', 'info', 'poll']; 
    
    // Deterministic Offset: Ensure Level 1 gets index 0, Level 2 gets index 1, etc.
    // This prevents duplicates across levels in the same world.
    
    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content: any = {};
        let title = "Lesson";
        let xp = 100 + (i * 20);
        let coins = 50 + (i * 10);

        // CONTENT PICKER LOGIC
        const pickContent = (pool: any[]) => {
            if (!pool || pool.length === 0) return null;
            // Use levelNum to offset, ensuring unique picks per level
            // i adds variety within the level if multiple of same type exist
            const index = ((levelNum - 1) + (i * 3)) % pool.length;
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
                cards: [] // Ensure we are in Decision Mode, not Sorting Mode
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
            title = "Your Take";
            content = {
                question: "What matters most?",
                options: ["Freedom", "Stuff", "Clout"],
                correct: 0,
                text: "Money buys freedom, not just stuff."
            };
        } else {
            title = "Knowledge Drop";
            content = { text: `Tip: Master ${worldName} to rule the game. ${rng.pick(["Save early.", "Invest often.", "Avoid bad debt."])}` };
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