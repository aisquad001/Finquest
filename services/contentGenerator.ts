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

// --- DATA POOLS ---
// Structured unique content for every world and lesson type.
// Indexed by World ID -> Lesson Type -> Array of unique content objects.

const CONTENT_POOLS: Record<string, Record<string, any[]>> = {
    "Moola Basics": {
        swipe: [
            { question: "Which is Money?", left: "Sand", right: "Gold Coin", correct: "right", text: "Money must be scarce." },
            { question: "Better Trade?", left: "Chicken for Shoes", right: "$50 for Shoes", correct: "right", text: "Cash is easier than barter." },
            { question: "Store of Value?", left: "Banana", right: "Dollar Bill", correct: "right", text: "Bananas rot. Money stays." },
            { question: "Inflation Impact", left: "Prices Down", right: "Prices Up", correct: "right", text: "Inflation makes things cost more." },
            { question: "Wants vs Needs", left: "Water", right: "Video Game", correct: "left", text: "Survive first, play later." },
            { question: "Scarcity check", left: "Air", right: "Diamonds", correct: "right", text: "Scarcity creates value." },
            { question: "Ancient Money", left: "Credit Card", right: "Salt Blocks", correct: "right", text: "Salt was once used as salary." },
            { question: "Your Wallet", left: "Empty", right: "Full", correct: "right", text: "Goal: Stack it up." }
        ],
        poll: [
            { question: "What is Money?", options: ["Paper", "Trust System", "Magic"], correct: 1, text: "It only works because we trust it." },
            { question: "Barter means...", options: ["Stealing", "Trading items", "Buying"], correct: 1, text: "Swapping goods directly." },
            { question: "Inflation is...", options: ["Good for savings", "Rising prices", "Free money"], correct: 1, text: "Purchasing power drops." },
            { question: "First paper money?", options: ["USA", "China", "Mars"], correct: 1, text: "China invented it first." },
            { question: "Fiat money is...", options: ["Backed by Gold", "Backed by Govt", "Car brand"], correct: 1, text: "Value by decree." },
            { question: "Why not print more?", options: ["Inflation", "Paper shortage", "Lazy"], correct: 0, text: "More money = less value." },
            { question: "Opportunity Cost", options: ["Lost value", "Price tag", "Free"], correct: 0, text: "What you give up to choose." },
            { question: "Durability", options: ["Ice Cream", "Metal Coin", "Flower"], correct: 1, text: "Money must last." }
        ],
        calculator: [
            { label: "Inflation Calc", question: "Burger $5. Inflation 10%. New Price?", answer: 5.5, text: "Costs rise over time." },
            { label: "Barter Math", question: "1 Cow = 4 Goats. 2 Cows = ?", answer: 8, text: "Multiplication skills." },
            { label: "Savings Goal", question: "Need $50. Save $5/week. Weeks?", answer: 10, text: "Patience pays off." },
            { label: "Lost Value", question: "$100. Inflation -5%. Value?", answer: 95, text: "Cash loses value." },
            { label: "Work Pay", question: "2 hours work. $15/hr. Total?", answer: 30, text: "Time is money." },
            { label: "Trade Off", question: "Have $20. Game $15. Left?", answer: 5, text: "Opportunity cost." },
            { label: "Double Up", question: "$10 x 2?", answer: 20, text: "Simple gains." },
            { label: "Half Off", question: "50% of $40?", answer: 20, text: "Discount math." }
        ],
        tapLie: [
            { text: "Money Facts", statements: [{text:"Salt was money", isLie:false}, {text:"Money is infinite", isLie:true}] },
            { text: "Value", statements: [{text:"Scarcity adds value", isLie:false}, {text:"Sand is good money", isLie:true}] },
            { text: "History", statements: [{text:"Coins are new", isLie:true}, {text:"Barter is old", isLie:false}] },
            { text: "Inflation", statements: [{text:"Prices always drop", isLie:true}, {text:"Cash loses value", isLie:false}] },
            { text: "Fiat", statements: [{text:"Backed by gold", isLie:true}, {text:"Govt backed", isLie:false}] },
            { text: "Usage", statements: [{text:"Medium of exchange", isLie:false}, {text:"Only for rich", isLie:true}] },
            { text: "Printing", statements: [{text:"Printing fixes debt", isLie:true}, {text:"Causes inflation", isLie:false}] },
            { text: "Future", statements: [{text:"Crypto is digital", isLie:false}, {text:"Cash is forever", isLie:true}] }
        ],
        meme: [
            { topText: "Me trying to barter", bottomText: "The cashier at Walmart", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Government", bottomText: "Printing more money", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "My wallet", bottomText: "After inflation", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Finding $5", bottomText: "In old jeans", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Economics", bottomText: "Explained by memes", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Buying Power", bottomText: "1920 vs 2024", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Gold Standard", bottomText: "Fiat Money", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Stonks", bottomText: "Only go up", imageUrl: "https://i.imgflip.com/26am.jpg" }
        ]
    },
    "Budget Beach": {
        swipe: [
            { question: "Need or Want?", left: "PS5", right: "Rent", correct: "right", text: "Shelter first." },
            { question: "Impulse Buy?", left: "Yes!", right: "Wait 24h", correct: "right", text: "Cool down rule." },
            { question: "Coffee", left: "Make at Home", right: "Starbucks Daily", correct: "left", text: "Saves $1000/yr." },
            { question: "Subscription", left: "Cancel Unused", right: "Keep All", correct: "left", text: "Leakage." },
            { question: "Payday", left: "Spend it all", right: "Budget first", correct: "right", text: "Plan your cash." },
            { question: "Sale!", left: "Buy 10", right: "Do I need it?", correct: "right", text: "Sales trick you." },
            { question: "Bonus Cash", left: "Save", right: "Party", correct: "left", text: "Boost net worth." },
            { question: "Tracking", left: "In Head", right: "App/Paper", correct: "right", text: "Write it down." }
        ],
        poll: [
            { question: "50/30/20 Rule?", options: ["Needs/Wants/Save", "Food/Fun/Sleep", "Spend/Spend/Spend"], correct: 0, text: "The golden ratio." },
            { question: "Pay Yourself...", options: ["Last", "First", "Never"], correct: 1, text: "Save before spending." },
            { question: "Fixed Expense?", options: ["Rent", "Dining Out", "Movies"], correct: 0, text: "Same every month." },
            { question: "Variable Expense?", options: ["Groceries", "Rent", "Insurance"], correct: 0, text: "Changes monthly." },
            { question: "Emergency Fund?", options: ["For PS5", "For Flat Tire", "For Pizza"], correct: 1, text: "Unexpected costs." },
            { question: "Zero-Based Budget", options: ["Income - Exp = 0", "Have $0", "Spend 0"], correct: 0, text: "Give every dollar a job." },
            { question: "Lifestyle Creep", options: ["Scary monster", "Spending rises w/ income", "Good thing"], correct: 1, text: "Avoid upgrading too fast." },
            { question: "Sinking Fund", options: ["Titanic", "Saving for big item", "Losing money"], correct: 1, text: "Save gradually." }
        ],
        calculator: [
            { label: "50/30/20", question: "$100 Income. Save 20%. How much?", answer: 20, text: "Pay yourself first." },
            { label: "Daily Coffee", question: "$5/day x 30 days?", answer: 150, text: "Adds up fast." },
            { label: "Yearly Sub", question: "$10/mo x 12?", answer: 120, text: "Check recurring costs." },
            { label: "Rent Ratio", question: "Income $3000. Rent $1000. %?", answer: 33, text: "Keep under 30% if can." },
            { label: "Savings Goal", question: "Need $600. Save $50/mo. Months?", answer: 12, text: "1 Year." },
            { label: "Impulse Save", question: "Skip $60 game. Invest it.", answer: 60, text: "Wealth grown." },
            { label: "Net Income", question: "$2000 Gross - $400 Tax?", answer: 1600, text: "What you keep." },
            { label: "Emergency", question: "Exp $1000. 3 Months Fund?", answer: 3000, text: "Safety net." }
        ],
        tapLie: [
            { text: "Budget Myths", statements: [{text:"Budgets are for poor people", isLie:true}, {text:"Tracking helps", isLie:false}] },
            { text: "Spending", statements: [{text:"Small purchases don't count", isLie:true}, {text:"Latte factor is real", isLie:false}] },
            { text: "Rules", statements: [{text:"50/30/20 is a law", isLie:true}, {text:"It's a guideline", isLie:false}] },
            { text: "Credit", statements: [{text:"Credit card is free money", isLie:true}, {text:"It's a loan", isLie:false}] },
            { text: "Savings", statements: [{text:"Save what's left", isLie:true}, {text:"Save first", isLie:false}] },
            { text: "Tracking", statements: [{text:"Bank app does it all", isLie:true}, {text:"Review weekly", isLie:false}] },
            { text: "Goals", statements: [{text:"Goals help saving", isLie:false}, {text:"YOLO everything", isLie:true}] },
            { text: "Auto-Pay", statements: [{text:"Avoids late fees", isLie:false}, {text:"Is risky", isLie:true}] }
        ],
        meme: [
            { topText: "Me looking at", bottomText: "My bank account", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Payday hits", bottomText: "Bills hit harder", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Budgeting", bottomText: "Expectation vs Reality", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Direct Deposit", bottomText: "Gone in 60 seconds", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Buying lunch", bottomText: "Packing lunch", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "50/30/20", bottomText: "I thought it was 100/0/0", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Treat Yo Self", bottomText: "Overdraft Fee", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Financial Advisor", bottomText: "Me spending on slime", imageUrl: "https://i.imgflip.com/30b1gx.jpg" }
        ]
    },
    "Compound Cliffs": {
        swipe: [
            { question: "Start Investing?", left: "Age 18", right: "Age 40", correct: "left", text: "Time is your best friend." },
            { question: "Compound is...", left: "Linear", right: "Exponential", correct: "right", text: "Hockey stick growth." },
            { question: "Consistency", left: "Lump Sum Once", right: "Monthly DCA", correct: "right", text: "Habit beats luck." },
            { question: "Withdraw Early?", left: "No!", right: "Yes", correct: "left", text: "Don't interrupt compounding." },
            { question: "Interest Rate", left: "1% APY", right: "8% APY", correct: "right", text: "Higher is better." },
            { question: "Time Horizon", left: "1 Year", right: "40 Years", correct: "right", text: "Long game wins." },
            { question: "The 8th Wonder", left: "Pyramids", right: "Compounding", correct: "right", text: "According to Einstein." },
            { question: "Snowball", left: "Rolls downhill", right: "Melts", correct: "left", text: "Gathers mass." }
        ],
        poll: [
            { question: "Compound Interest is...", options: ["Interest on Interest", "Free money", "A bank fee"], correct: 0, text: "Money making money." },
            { question: "Rule of 72?", options: ["Retirement age", "Doubling time", "Tax rule"], correct: 1, text: "72 / Rate = Years to double." },
            { question: "Best time to plant tree?", options: ["20 years ago", "Tomorrow", "Never"], correct: 0, text: "Second best is today." },
            { question: "Snowball Effect", options: ["Gets smaller", "Gets bigger faster", "Stops"], correct: 1, text: "Momentum." },
            { question: "High Yield Savings", options: ["0.01%", "4-5%", "Negative"], correct: 1, text: "Beats regular banks." },
            { question: "Inflation vs Growth", options: ["Growth > Inflation", "Inflation > Growth", "Equal"], correct: 0, text: "Beat inflation to win." },
            { question: "Start early because...", options: ["More time", "Less money needed", "Both"], correct: 2, text: "Time leverage." },
            { question: "Exponential Graph", options: ["Straight line", "Curved up", "Curved down"], correct: 1, text: "Skyrockets at the end." }
        ],
        calculator: [
            { label: "Doubling", question: "72 / 8% return = Years?", answer: 9, text: "Doubles every 9 years." },
            { label: "Simple Interest", question: "$100 x 10%?", answer: 10, text: "Just the start." },
            { label: "Compound", question: "$100 + 10% + 10%?", answer: 121, text: "Not 120. 121." },
            { label: "Years", question: "Start 20 vs 30. Diff?", answer: 10, text: "Huge impact." },
            { label: "Rule 72", question: "72 / 6%?", answer: 12, text: "Slower growth." },
            { label: "Loss", question: "$100 - 50% = $50. Need to recover?", answer: 100, text: "Need 100% gain to fix 50% loss." },
            { label: "Savings", question: "$500/mo x 12?", answer: 6000, text: "Base capital." },
            { label: "Retirement", question: "65 - 25?", answer: 40, text: "Years to grow." }
        ],
        tapLie: [
            { text: "Compound Truths", statements: [{text:"Linear growth", isLie:true}, {text:"Exponential growth", isLie:false}] },
            { text: "Timing", statements: [{text:"Start late is fine", isLie:true}, {text:"Start early is best", isLie:false}] },
            { text: "Math", statements: [{text:"1+1=2", isLie:false}, {text:"1+1=3 via compound", isLie:false}] },
            { text: "Wealth", statements: [{text:"Get rich quick", isLie:true}, {text:"Get rich slow", isLie:false}] },
            { text: "Rates", statements: [{text:"0.1% is good", isLie:true}, {text:"5% is good", isLie:false}] },
            { text: "Risk", statements: [{text:"No risk exists", isLie:true}, {text:"Inflation is a risk", isLie:false}] },
            { text: "Consistency", statements: [{text:"DCA works", isLie:false}, {text:"Timing works", isLie:true}] },
            { text: "Secret", statements: [{text:"Time is key", isLie:false}, {text:"Amount is key", isLie:true}] }
        ],
        meme: [
            { topText: "Investing $50/mo", bottomText: "Retiring Millionaire", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Waiting to invest", bottomText: "Opportunity cost", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Warren Buffett", bottomText: "Started at 11", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Compound Interest", bottomText: "Doing the heavy lifting", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Me at 20", bottomText: "I have time", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Me at 60", bottomText: "Where is my money", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Exponential Curve", bottomText: "Go brrr", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Savings Account", bottomText: "0.01% Interest", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    },
    "Bank Vault": {
        swipe: [
            { question: "Store Money?", left: "Under Mattress", right: "Bank", correct: "right", text: "Safety + Interest." },
            { question: "Account Type", left: "Checking", right: "Savings", correct: "right", text: "For holding money." },
            { question: "Bank Fail?", left: "Lose All", right: "FDIC Insured", correct: "right", text: "Govt protects $250k." },
            { question: "Fee?", left: "Pay $10/mo", right: "No Fee", correct: "right", text: "Avoid fees." },
            { question: "Debit vs Credit", left: "Debit", right: "Credit", correct: "left", text: "Debit uses OWN money." },
            { question: "Overdraft", left: "Turn Off", right: "Enable", correct: "left", text: "Avoid fees." },
            { question: "Interest", left: "High Yield", right: "0.01%", correct: "left", text: "Free money." },
            { question: "Direct Deposit", left: "Yes", right: "Paper Check", correct: "left", text: "Faster access." }
        ],
        poll: [
            { question: "FDIC Insurance?", options: ["$250,000", "$1,000", "Unlimited"], correct: 0, text: "Per bank, per person." },
            { question: "Liquidity means...", options: ["Water", "Access to cash", "Frozen"], correct: 1, text: "How fast you can spend it." },
            { question: "Overdraft fee?", options: ["Free", "$35 penalty", "Bonus"], correct: 1, text: "When you spend < $0." },
            { question: "HYSA stands for", options: ["High Yield Savings", "Hello You", "High Yard"], correct: 0, text: "Pays more interest." },
            { question: "Checking Account", options: ["For spending", "For investing", "For saving"], correct: 0, text: "Daily driver." },
            { question: "Routing Number", options: ["Bank ID", "Your ID", "Password"], correct: 0, text: "Identifies the bank." },
            { question: "ATM Fees", options: ["Good", "Avoid", "Mandatory"], correct: 1, text: "Use in-network." },
            { question: "Credit Union", options: ["For profit", "Non-profit", "Illegal"], correct: 1, text: "Member owned." }
        ],
        calculator: [
            { label: "Interest", question: "$1000 @ 5%?", answer: 50, text: "Free $50." },
            { label: "Fee Drain", question: "$10 fee x 12 months?", answer: 120, text: "Lost money." },
            { label: "FDIC", question: "Have $300k. Insured?", answer: 250000, text: "$50k at risk." },
            { label: "ATM", question: "$3 fee x 4 times?", answer: 12, text: "Waste." },
            { label: "Check", question: "Write $50. Have $40. Fee $35. Cost?", answer: 85, text: "Expensive mistake." },
            { label: "Mobile Deposit", question: "Time saved?", answer: 30, text: "Minutes." },
            { label: "Split", question: "50% of $500 to Savings?", answer: 250, text: "Auto-save." },
            { label: "Growth", question: "$100 @ 1% vs 5%?", answer: 4, text: "Difference." }
        ],
        tapLie: [
            { text: "Banking", statements: [{text:"Banks keep all cash in vault", isLie:true}, {text:"They lend it out", isLie:false}] },
            { text: "Safety", statements: [{text:"FDIC is govt backed", isLie:false}, {text:"Crypto is FDIC", isLie:true}] },
            { text: "Debit", statements: [{text:"Builds credit", isLie:true}, {text:"Takes cash now", isLie:false}] },
            { text: "Savings", statements: [{text:"HYSA pays more", isLie:false}, {text:"Checking pays more", isLie:true}] },
            { text: "Fees", statements: [{text:"Are mandatory", isLie:true}, {text:"Can be waived", isLie:false}] },
            { text: "Online", statements: [{text:"Brick & mortar only", isLie:true}, {text:"Online banks exist", isLie:false}] },
            { text: "Access", statements: [{text:"24/7 ATM", isLie:false}, {text:"9-5 only", isLie:true}] },
            { text: "Checks", statements: [{text:"Obsolete but used", isLie:false}, {text:"Illegal now", isLie:true}] }
        ],
        meme: [
            { topText: "Checking Account", bottomText: "0.01% Interest", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Overdraft Fee", bottomText: "I have -$5", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Bank Teller", bottomText: "Judging my purchases", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Direct Deposit", bottomText: "Hit at 2am", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Savings Account", bottomText: "Aaaand it's gone", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Debit Card", bottomText: "Declined", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "FDIC", bottomText: "Saving the day", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Credit Union", bottomText: "Bank", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    },
    "Debt Dungeon": {
        swipe: [
            { question: "Pay Bill", left: "Minimum", right: "Full Balance", correct: "right", text: "Avoid interest." },
            { question: "Offer", left: "25% APR", right: "15% APR", correct: "right", text: "Lower is better." },
            { question: "Credit Score", left: "800", right: "500", correct: "left", text: "Higher is better." },
            { question: "Spending", left: "Max Limit", right: "10% Limit", correct: "right", text: "Utilization ratio." },
            { question: "Miss Payment?", left: "Never", right: "It's ok", correct: "left", text: "Crushes score." },
            { question: "Loan", left: "Payday Loan", right: "Bank Loan", correct: "right", text: "Payday = Trap." },
            { question: "Debt Type", left: "Good (House)", right: "Bad (Shoes)", correct: "left", text: "Asset vs Liability." },
            { question: "Co-sign?", left: "Yes", right: "No", correct: "right", text: "Risky business." }
        ],
        poll: [
            { question: "APR stands for...", options: ["Annual Percentage Rate", "Apple", "April"], correct: 0, text: "Cost of borrowing." },
            { question: "Good Credit Score?", options: ["300", "500", "750+"], correct: 2, text: "Unlock best rates." },
            { question: "Credit Utilization?", options: ["Max it", "Keep under 30%", "Irrelevant"], correct: 1, text: "Don't look desperate." },
            { question: "Missed Payment", options: ["Stays 7 years", "Gone in week", "No biggie"], correct: 0, text: "Haunts you." },
            { question: "Payday Loans", options: ["400% Interest", "Free", "Good deal"], correct: 0, text: "Predatory." },
            { question: "Student Loans", options: ["Forgivable", "Bankruptcy Proof", "Free"], correct: 1, text: "Hard to erase." },
            { question: "Minimum Payment", options: ["Pays off debt", "Covers interest mostly", "Smart"], correct: 1, text: "Debt trap." },
            { question: "Hard Inquiry", options: ["Checks credit", "Hurts score slightly", "Both"], correct: 2, text: "When applying." }
        ],
        calculator: [
            { label: "Interest", question: "$1000 x 20% APR?", answer: 200, text: "Cost per year." },
            { label: "Payoff", question: "Min pay 2%. Balance $1000. Pay?", answer: 20, text: "Barely touches principal." },
            { label: "Utilization", question: "Limit $1000. Spent $500. %?", answer: 50, text: "Too high (aim <30%)." },
            { label: "Score", question: "Start 600. +50 pts?", answer: 650, text: "Improving." },
            { label: "Late Fee", question: "$35 x 3 months?", answer: 105, text: "Wasted cash." },
            { label: "Total Cost", question: "Loan $10k. Pay back $15k. Int?", answer: 5000, text: "Cost of money." },
            { label: "Savings", question: "Refinance 10% -> 5% on $100?", answer: 5, text: "Saved." },
            { label: "Time", question: "7 years on report.", answer: 7, text: "Long time." }
        ],
        tapLie: [
            { text: "Credit Myths", statements: [{text:"Carrying a balance helps score", isLie:true}, {text:"Pay in full", isLie:false}] },
            { text: "Checking", statements: [{text:"Checking score exists", isLie:true}, {text:"Credit score is key", isLie:false}] },
            { text: "Debt", statements: [{text:"All debt is bad", isLie:true}, {text:"Leverage exists", isLie:false}] },
            { text: "Limits", statements: [{text:"Higher limit helps utilization", isLie:false}, {text:"Lower limit is better", isLie:true}] },
            { text: "Bankruptcy", statements: [{text:"Solves everything", isLie:true}, {text:"Ruins credit for years", isLie:false}] },
            { text: "Cards", statements: [{text:"Are evil", isLie:true}, {text:"Are tools", isLie:false}] },
            { text: "Debit", statements: [{text:"Builds credit", isLie:true}, {text:"Does not build credit", isLie:false}] },
            { text: "Freeze", statements: [{text:"Stops identity theft", isLie:false}, {text:"Deletes score", isLie:true}] }
        ],
        meme: [
            { topText: "Minimum Payment", bottomText: "Remaining Debt", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Credit Score", bottomText: "Drop by 1 point", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Me swiping", bottomText: "Me seeing bill", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "0% APR Intro", bottomText: "29% Later", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Student Loans", bottomText: "Exists", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Credit Limit", bottomText: "Increase", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Collections", bottomText: "Calling me", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Payday Lender", bottomText: "Shark", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    },
    "Hustle Hub": {
        swipe: [
            { question: "Tax Form", left: "W-2", right: "1099", correct: "right", text: "Freelancers get 1099." },
            { question: "Income", left: "Gross", right: "Net", correct: "right", text: "Net is what you keep." },
            { question: "Side Gig", left: "Uber", right: "Sleep", correct: "left", text: "Active income." },
            { question: "Deduction", left: "Video Games", right: "Laptop", correct: "right", text: "Business expense." },
            { question: "Pay Taxes", left: "Quarterly", right: "Never", correct: "left", text: "Avoid penalties." },
            { question: "Skill", left: "Learn Code", right: "Watch TV", correct: "left", text: "High value skill." },
            { question: "Client", left: "No Contract", right: "Contract", correct: "right", text: "Protect yourself." },
            { question: "Raise", left: "Ask", right: "Wait", correct: "left", text: "Negotiate." }
        ],
        poll: [
            { question: "Gross vs Net", options: ["Gross is bigger", "Net is bigger", "Same"], correct: 0, text: "Taxes eat Gross." },
            { question: "1099 Worker", options: ["Employee", "Contractor", "Volunteer"], correct: 1, text: "Self-employed." },
            { question: "Progressive Tax", options: ["Flat rate", "More income = higher %", "Random"], correct: 1, text: "Brackets." },
            { question: "Side Hustle", options: ["Hobby", "Income stream", "Nap"], correct: 1, text: "Extra cash." },
            { question: "W-4 Form", options: ["Tax withholding", "Radio station", "Robot"], correct: 0, text: "Tells boss tax info." },
            { question: "Gig Economy", options: ["Music", "Uber/DoorDash", "Sleep"], correct: 1, text: "Flexible work." },
            { question: "Passive Income", options: ["Working hard", "Sleeping money", "Stealing"], correct: 1, text: "Earn while sleeping." },
            { question: "Audit", options: ["IRS Check", "Car brand", "Sound"], correct: 0, text: "Keep receipts." }
        ],
        calculator: [
            { label: "Tax Bite", question: "$1000 - 20% Tax?", answer: 800, text: "Net pay." },
            { label: "Hourly", question: "$20/hr x 10 hrs?", answer: 200, text: "Gross pay." },
            { label: "Side Gig", question: "$50 per job x 4?", answer: 200, text: "Hustle." },
            { label: "Expense", question: "Earn $100. Spend $20 gas. Profit?", answer: 80, text: "Net profit." },
            { label: "Self Tax", question: "15.3% of $100?", answer: 15.3, text: "FICA tax." },
            { label: "Raise", question: "$50k + 10%?", answer: 55000, text: "New salary." },
            { label: "Weekly", question: "$52k / 52 weeks?", answer: 1000, text: "Weekly gross." },
            { label: "Tips", question: "$100 bill. 20% tip?", answer: 20, text: "Service ind." }
        ],
        tapLie: [
            { text: "Taxes", statements: [{text:"Cash tips are tax free", isLie:true}, {text:"Report all income", isLie:false}] },
            { text: "Freelance", statements: [{text:"Boss pays your tax", isLie:true}, {text:"You pay your tax", isLie:false}] },
            { text: "Deductions", statements: [{text:"Everything is free", isLie:true}, {text:"Lowers taxable income", isLie:false}] },
            { text: "Refund", statements: [{text:"Free money from govt", isLie:true}, {text:"Return of overpayment", isLie:false}] },
            { text: "Brackets", statements: [{text:"Higher bracket hurts all income", isLie:true}, {text:"Marginal rate", isLie:false}] },
            { text: "LLC", statements: [{text:"Protects assets", isLie:false}, {text:"Means no taxes", isLie:true}] },
            { text: "Resignation", statements: [{text:"2 weeks notice", isLie:false}, {text:"Ghosting is pro", isLie:true}] },
            { text: "Salary", statements: [{text:"Negotiable", isLie:false}, {text:"Fixed forever", isLie:true}] }
        ],
        meme: [
            { topText: "Gross Pay", bottomText: "Net Pay", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Freelancers", bottomText: "Paying own taxes", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "IRS", bottomText: "Watching Venmo", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Side Hustle", bottomText: "Full Time Job", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Tax Refund", bottomText: "It's my own money", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Write it off", bottomText: "I don't know what that means", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Boss makes a dollar", bottomText: "I make a dime", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Promoted", bottomText: "More work same pay", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    },
    "Stony Stocks": {
        swipe: [
            { question: "Strategy", left: "Day Trade", right: "Long Term", correct: "right", text: "Time in market." },
            { question: "Diversity", left: "1 Stock", right: "Index Fund", correct: "right", text: "Safety in numbers." },
            { question: "Market Crash", left: "Panic Sell", right: "Buy Dip", correct: "right", text: "Discount shopping." },
            { question: "Risk", left: "Crypto", right: "S&P 500", correct: "right", text: "Stability." },
            { question: "Dividends", left: "Reinvest", right: "Spend", correct: "left", text: "Compound growth." },
            { question: "Fees", left: "High Fee Fund", right: "Low Cost ETF", correct: "right", text: "Keep your gains." },
            { question: "Timing", left: "Time the market", right: "Time IN market", correct: "right", text: "Consistency." },
            { question: "Advice", left: "TikTok Guru", right: "Research", correct: "right", text: "DYOR." }
        ],
        poll: [
            { question: "S&P 500 is...", options: ["500 Companies", "500 Dollars", "Race car"], correct: 0, text: "Top US stocks." },
            { question: "Bear Market", options: ["Prices Up", "Prices Down", "Zoo"], correct: 1, text: "Optimism low." },
            { question: "Bull Market", options: ["Prices Up", "Prices Down", "Farm"], correct: 0, text: "Optimism high." },
            { question: "IPO", options: ["Initial Public Offering", "iPhone", "International"], correct: 0, text: "Going public." },
            { question: "Dividend", options: ["Fee", "Profit share", "Tax"], correct: 1, text: "Company pays you." },
            { question: "ETF", options: ["Exchange Traded Fund", "Extra Time", "Eat The Food"], correct: 0, text: "Basket of stocks." },
            { question: "Volatility", options: ["Stability", "Wild swings", "Volume"], correct: 1, text: "Risk measure." },
            { question: "Market Cap", options: ["Hat", "Total Value", "Store limit"], correct: 1, text: "Price x Shares." }
        ],
        calculator: [
            { label: "Profit", question: "Buy $10. Sell $15. Gain?", answer: 5, text: "Capital gain." },
            { label: "Loss", question: "Buy $20. Sell $10. Loss?", answer: 10, text: "Capital loss." },
            { label: "Percentage", question: "$100 to $110. %?", answer: 10, text: "10% Return." },
            { label: "Dividend", question: "3% yield on $100?", answer: 3, text: "Income." },
            { label: "Share Count", question: "$100. Share price $20. Qty?", answer: 5, text: "Shares." },
            { label: "Crash", question: "$100 drops 20%?", answer: 80, text: "Correction." },
            { label: "Double", question: "Rule 72 @ 10%?", answer: 7.2, text: "Years." },
            { label: "Fee", question: "1% fee on $1000?", answer: 10, text: "Drag." }
        ],
        tapLie: [
            { text: "Investing", statements: [{text:"Guaranteed returns exist", isLie:true}, {text:"Risk and reward correlate", isLie:false}] },
            { text: "Day Trading", statements: [{text:"Easy money", isLie:true}, {text:"High risk", isLie:false}] },
            { text: "Market", statements: [{text:"Always goes up short term", isLie:true}, {text:"Trends up long term", isLie:false}] },
            { text: "Diversification", statements: [{text:"Lowers risk", isLie:false}, {text:"Limits gains only", isLie:true}] },
            { text: "Buying", statements: [{text:"Buy low sell high", isLie:false}, {text:"Buy high sell low", isLie:true}] },
            { text: "Crypto", statements: [{text:"Is a stock", isLie:true}, {text:"Is an asset class", isLie:false}] },
            { text: "Index", statements: [{text:"Beats most pros", isLie:false}, {text:"Is for losers", isLie:true}] },
            { text: "Shorting", statements: [{text:"Betting against", isLie:false}, {text:"Buying small", isLie:true}] }
        ],
        meme: [
            { topText: "Stonks", bottomText: "Only go up", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Buying the dip", bottomText: "It keeps dipping", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "Wall Street Bets", bottomText: "Loss porn", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "S&P 500", bottomText: "Chill & Grow", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Crypto", bottomText: "Rollercoaster", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Dividend", bottomText: "$0.12 payout", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Bear Market", bottomText: "Everything is cheap", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Paper Hands", bottomText: "Sold at bottom", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    },
    "Wealth Empire": {
        swipe: [
            { question: "Asset Class", left: "Real Estate", right: "Car", correct: "left", text: "Appreciates." },
            { question: "Goal", left: "Rich", right: "Wealthy", correct: "right", text: "Wealth = Time Freedom." },
            { question: "Retire", left: "Age 65", right: "When Ready", correct: "right", text: "FIRE movement." },
            { question: "Income", left: "Active", right: "Passive", correct: "right", text: "Sleep money." },
            { question: "Lifestyle", left: "Frugal", right: "Flashy", correct: "left", text: "Stealth wealth." },
            { question: "Legacy", left: "Spend all", right: "Trust Fund", correct: "right", text: "Generational." },
            { question: "Tax", left: "Avoid (Legal)", right: "Evade (Illegal)", correct: "left", text: "Optimization." },
            { question: "Mindset", left: "Scarcity", right: "Abundance", correct: "right", text: "Growth." }
        ],
        poll: [
            { question: "Net Worth Formula", options: ["Assets - Liabilities", "Income - Expense", "Cash"], correct: 0, text: "The scorecard." },
            { question: "FIRE stands for", options: ["Financial Indep Retire Early", "Fire department", "Burn money"], correct: 0, text: "Freedom." },
            { question: "Liability is...", options: ["Makes money", "Takes money", "Friend"], correct: 1, text: "Cost." },
            { question: "Asset is...", options: ["Makes money", "Takes money", "Car"], correct: 0, text: "Income source." },
            { question: "Inflation Hedge", options: ["Cash", "Real Estate", "Savings"], correct: 1, text: "Hard assets." },
            { question: "4% Rule", options: ["Withdrawal rate", "Growth rate", "Tax rate"], correct: 0, text: "Safe withdrawal." },
            { question: "Trust Fund", options: ["Legal structure", "Friendship", "Bank"], correct: 0, text: "Protect assets." },
            { question: "Accredited Investor", options: ["Rich enough to risk", "Smart", "Certified"], correct: 0, text: "High net worth access." }
        ],
        calculator: [
            { label: "Net Worth", question: "$1M Assets - $200k Debt?", answer: 800000, text: "Equity." },
            { label: "FIRE Number", question: "$40k expense x 25?", answer: 1000000, text: "Target." },
            { label: "4% Rule", question: "4% of $1,000,000?", answer: 40000, text: "Yearly spend." },
            { label: "Rental", question: "$1000 Rent - $800 Cost?", answer: 200, text: "Cash flow." },
            { label: "Appreciation", question: "$500k House + 5%?", answer: 525000, text: "Growth." },
            { label: "Tax", question: "$1M Estate. 40% Tax?", answer: 400000, text: "Estate tax." },
            { label: "Freedom", question: "$50k passive > $40k expense?", answer: 10000, text: "Surplus." },
            { label: "Millionaire", question: "Save $10k/yr for 40 yrs @ 7%?", answer: 2000000, text: "Roughly." }
        ],
        tapLie: [
            { text: "Wealth", statements: [{text:"Lottery is a plan", isLie:true}, {text:"Time > Money", isLie:false}] },
            { text: "Real Estate", statements: [{text:"Passive income", isLie:false}, {text:"Always easy", isLie:true}] },
            { text: "Millionaire", statements: [{text:"Needs high salary", isLie:true}, {text:"Needs high savings rate", isLie:false}] },
            { text: "Taxes", statements: [{text:"Rich pay less %", isLie:false}, {text:"Rich pay 0", isLie:true}] },
            { text: "Debt", statements: [{text:"Rich use debt", isLie:false}, {text:"Debt is banned", isLie:true}] },
            { text: "Retirement", statements: [{text:"Is an age", isLie:true}, {text:"Is a number", isLie:false}] },
            { text: "Inflation", statements: [{text:"Helps debtors", isLie:false}, {text:"Hurts debtors", isLie:true}] },
            { text: "Happiness", statements: [{text:"Money buys it directly", isLie:true}, {text:"Money buys options", isLie:false}] }
        ],
        meme: [
            { topText: "Looking Rich", bottomText: "Being Rich", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Landlord", bottomText: "Fixing toilet", imageUrl: "https://i.imgflip.com/1jwhww.jpg" },
            { topText: "FIRE Movement", bottomText: "Retire at 30", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Inflation", bottomText: "My Assets", imageUrl: "https://i.imgflip.com/434i5j.jpg" },
            { topText: "Tax Loophole", bottomText: "Legal", imageUrl: "https://i.imgflip.com/1ur9b0.jpg" },
            { topText: "Generational Wealth", bottomText: "My Kids", imageUrl: "https://i.imgflip.com/26am.jpg" },
            { topText: "Passive Income", bottomText: "Work once pay forever", imageUrl: "https://i.imgflip.com/30b1gx.jpg" },
            { topText: "Net Worth", bottomText: "To the moon", imageUrl: "https://i.imgflip.com/1jwhww.jpg" }
        ]
    }
};

// Fallback pool to prevent crash if world/type missing
const FALLBACK_POOL = {
    swipe: [{question: "Save?", left: "No", right: "Yes", correct: "right", text: "Saving is good."}],
    poll: [{question: "Money?", options: ["Good", "Bad"], correct: 0, text: "Money is a tool."}],
    calculator: [{label: "Math", question: "1+1", answer: 2, text: "Basic."}],
    tapLie: [{text: "Truth", statements: [{text: "True", isLie: false}, {text: "False", isLie: true}]}],
    meme: [{topText: "Money", bottomText: "Good", imageUrl: "https://i.imgflip.com/26am.jpg"}]
};

// --- GENERATOR ---

export const generateLevelContent = (worldId: string, levelNum: number): { level: LevelData, lessons: Lesson[] } => {
    // Normalize World ID
    const worldMeta = WORLDS_METADATA.find(w => w.id === worldId || w.title === worldId);
    const worldName = worldMeta ? worldMeta.id : "Moola Basics"; 
    const levelId = `${worldName.replace(/\s+/g, '')}_l${levelNum}`;
    
    const rng = new SeededRNG(levelId);
    
    // Retrieve World Data (for Boss)
    // Note: Boss data comes from a separate mapping logic or can be added to CONTENT_POOLS if desired, 
    // but keeping the existing boss structure for now as it was working.
    // Re-using WORLD_DATA from previous implementation would be ideal, but for this file scope, 
    // let's ensure we have the Boss logic. I will inject a basic boss structure here to keep it self-contained.
    
    const BOSS_DATA: Record<string, any> = {
        "Moola Basics": { name: "Inflation Dragon", emoji: "🐲", intro: ["I eat value!", "Prices rising!"] },
        "Budget Beach": { name: "Impulse Imp", emoji: "👺", intro: ["Buy it now!", "YOLO!"] },
        "Compound Cliffs": { name: "Time Thief", emoji: "⏳", intro: ["Wait later!", "Procrastinate!"] },
        "Bank Vault": { name: "Fee Fiend", emoji: "🦇", intro: ["Overdraft!", "Service Fee!"] },
        "Debt Dungeon": { name: "Interest Ogre", emoji: "👹", intro: ["25% APR!", "Min Payment!"] },
        "Hustle Hub": { name: "Tax Titan", emoji: "🕴️", intro: ["Audit time!", "Gross Pay!"] },
        "Stony Stocks": { name: "Panic Bear", emoji: "🐻", intro: ["Sell low!", "Crash!"] },
        "Wealth Empire": { name: "Lifestyle Creep", emoji: "🧟", intro: ["Upgrade!", "Spend more!"] }
    };

    const bossInfo = BOSS_DATA[worldName] || BOSS_DATA["Moola Basics"];
    
    // Generate Boss Quiz (reuse poll questions for now, or specific boss pool if added)
    // We can pull 3 random unique polls from the pool for the boss
    const bossPool = CONTENT_POOLS[worldName]?.poll || FALLBACK_POOL.poll;
    // Deterministically pick 3 distinct questions for boss based on levelNum
    // We shift by 5 to ensure boss questions aren't the same as the level's poll lesson
    const bossQuestions = [
        bossPool[(levelNum * 3 + 0) % bossPool.length],
        bossPool[(levelNum * 3 + 1) % bossPool.length],
        bossPool[(levelNum * 3 + 2) % bossPool.length]
    ].map(q => ({
        question: q.question,
        options: q.options,
        correctIndex: q.correct,
        explanation: q.text
    }));

    const level: LevelData = {
        id: levelId,
        worldId: worldName,
        levelNumber: levelNum,
        title: `Level ${levelNum}: ${bossInfo.name}`,
        description: `Defeat ${bossInfo.name}!`,
        bossName: bossInfo.name,
        bossImage: bossInfo.emoji,
        bossIntro: bossInfo.intro[levelNum % bossInfo.intro.length],
        bossQuiz: bossQuestions
    };

    // --- LESSON GENERATION ---
    const lessons: Lesson[] = [];
    // Lesson Sequence: Intro -> Swipe -> Poll -> Meme -> Calculator -> TapLie -> Boss
    const types: LessonType[] = ['info', 'swipe', 'poll', 'meme', 'calculator', 'tapLie']; 
    
    // --- DETERMINISTIC CONTENT PICKER ---
    const getUniqueContent = (type: string, lessonIndex: number) => {
        const pool = CONTENT_POOLS[worldName]?.[type] || FALLBACK_POOL[type as keyof typeof FALLBACK_POOL];
        if (!pool) return { text: "Error loading content" };
        
        // MAGIC FORMULA: 
        // Use (Level Number) + (Lesson Index) to cycle through the pool.
        // Since each level has 1 of each type (mostly), just using LevelNum is enough to rotate.
        // We subtract 1 to make it 0-indexed.
        const uniqueIndex = (levelNum - 1) % pool.length;
        return pool[uniqueIndex];
    };

    types.forEach((type, i) => {
        const lessonId = `${levelId}_${i}`;
        let content: any = {};

        if (type === 'info') {
            // Info lessons reuse Poll content explanations or separate pool
            // Let's grab a poll question and turn it into an Info card for synergy
            const relatedPoll = getUniqueContent('poll', i);
            content = { 
                text: `${relatedPoll.question} ${relatedPoll.text}`, 
                analogy: "Knowledge is power." 
            };
        } else {
            content = getUniqueContent(type, i);
        }

        const titles = ["The Basics", "Deep Dive", "Quick Check", "Reality Hit", "Pro Tip", "Final Boss Prep"];
        
        lessons.push({
            id: lessonId,
            worldId: worldName,
            levelId,
            order: i,
            type,
            title: titles[i] || "Lesson",
            content: content,
            xpReward: 100 + (i * 20),
            coinReward: 50 + (i * 10)
        });
    });

    return { level, lessons };
};

// --- ENGAGEMENT CONTENT GENERATORS ---

export const getRandomRoast = () => {
    const roasts = [
        "My grandma budgets better than that. 👵",
        "Oof. That answer cost you $0 but still felt expensive.",
        "Your wallet is crying right now. 💸",
        "Did you guess? Be honest.",
        "Emotional damage. 💀",
        "Buy high, sell low energy.",
        "Not very cash money of you.",
        "That's a liability, not an asset.",
        "Straight to the Debt Dungeon with you.",
        "I'm telling your future accountant about this."
    ];
    return roasts[Math.floor(Math.random() * roasts.length)];
};

export const getRandomFunFact = () => {
    const facts = [
        { emoji: "🍔", text: "The Big Mac Index compares purchasing power across countries using burger prices.", source: "The Economist" },
        { emoji: "💳", text: "Credit cards were invented because a guy forgot his wallet at dinner.", source: "Diners Club History" },
        { emoji: "🌷", text: "In the 1600s, one tulip bulb cost more than a house in Amsterdam.", source: "Tulip Mania" },
        { emoji: "🎩", text: "More Monopoly money is printed annually than real US Dollars.", source: "Hasbro" },
        { emoji: "🪙", text: "The first coins were made in 600 BC in modern-day Turkey.", source: "History of Money" },
        { emoji: "🍎", text: "Apple has more cash on hand than many countries' GDP.", source: "Financial Reports" },
        { emoji: "🧊", text: "Alaska pays residents to live there (oil dividends).", source: "Alaska Permanent Fund" },
        { emoji: "♻️", text: "90% of US bills carry traces of cocaine.", source: "CNN Study" }
    ];
    return facts[Math.floor(Math.random() * facts.length)];
};

export const getRandomDeepDive = () => {
    const dives = [
        "Compounding works best with time. Starting at 25 vs 35 can double your retirement outcome.",
        "Diversification is the only 'free lunch' in investing. It reduces risk without reducing expected return.",
        "Inflation averages about 2-3% per year. If your cash isn't growing, it's shrinking.",
        "An emergency fund prevents you from selling assets during a market crash.",
        "High-interest debt (like credit cards) is a financial emergency. Pay it off ASAP.",
        "Index funds outperform 80% of active fund managers over 15 years.",
        "Your credit score is essentially an 'adulting report card' for borrowing trust.",
        "Assets put money in your pocket. Liabilities take money out."
    ];
    return dives[Math.floor(Math.random() * dives.length)];
};
