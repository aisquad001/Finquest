
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
        { question: "Which puts money IN your pocket?", options: ["Liabilities", "Assets", "Expenses"], correctIndex: 1, explanation: "Assets pay you. Liabilities cost you." },
        { question: "Rich people primarily buy...", options: ["Luxury Cars", "Big Houses", "Assets"], correctIndex: 2, explanation: "They buy assets first, which then pay for luxuries." },
        { question: "Which is a Liability?", options: ["Rental Property", "Dividend Stock", "New Car Loan"], correctIndex: 2, explanation: "A loan takes money out of your pocket every month." },
        { question: "Inflation causes prices to...", options: ["Stay same", "Decrease", "Increase"], correctIndex: 2, explanation: "Inflation makes cash worth less over time." },
        { question: "If inflation is 3% and bank pays 1%...", options: ["Losing money", "Breaking even", "Getting rich"], correctIndex: 0, explanation: "You lose purchasing power." },
        { question: "What fights inflation best?", options: ["Cash", "Assets", "Gift Cards"], correctIndex: 1, explanation: "Assets tend to grow with inflation." },
        { question: "Which is a NEED?", options: ["iPhone 15", "Shelter", "Netflix"], correctIndex: 1, explanation: "Needs are essential for survival." },
        { question: "Delayed Gratification means...", options: ["Buying now", "Waiting to buy", "Never buying"], correctIndex: 1, explanation: "Waiting often saves money." },
        { question: "The 'Latte Factor' refers to...", options: ["Coffee prices", "Small daily spending", "Milk"], correctIndex: 1, explanation: "Small habits add up to huge amounts." },
        { question: "Money is...", options: ["Evil", "A Tool", "The Goal"], correctIndex: 1, explanation: "Money is a tool to build the life you want." },
        { question: "Who prints money?", options: ["The Mint", "Amazon", "Elon"], correctIndex: 0, explanation: "Government/Central Banks print currency." },
        { question: "Bartering is...", options: ["Trading goods", "Buying with cash", "Crypto"], correctIndex: 0, explanation: "Trading a chicken for shoes is bartering." },
        { question: "Active Income requires...", options: ["Sleeping", "Working", "Owning"], correctIndex: 1, explanation: "You trade time for money." },
        { question: "Passive Income requires...", options: ["Working 9-5", "Assets working", "Asking parents"], correctIndex: 1, explanation: "Money earning money while you sleep." },
        { question: "Portfolio Income comes from...", options: ["Job", "Investments", "Gifts"], correctIndex: 1, explanation: "Capital gains and dividends." },
        { question: "Opportunity Cost is...", options: ["Price tag", "What you give up", "Tax"], correctIndex: 1, explanation: "Spending $50 means giving up $50 of investing." },
        { question: "Time is...", options: ["Refundable", "Infinite", "Limited"], correctIndex: 2, explanation: "You can't make more time." },
        { question: "Sunk Cost Fallacy means...", options: ["Spending because you already spent", "Saving", "Buying boat"], correctIndex: 0, explanation: "Throwing good money after bad." },
        { question: "If supply is low...", options: ["Price drops", "Price rises", "Same"], correctIndex: 1, explanation: "Scarcity increases value." },
        { question: "Why is gold valuable?", options: ["Yellow", "Scarce", "Tasty"], correctIndex: 1, explanation: "Limited supply." },
        { question: "Fiat money has value because...", options: ["Gold", "Trust in Govt", "Paper"], correctIndex: 1, explanation: "Backed by government decree." },
        { question: "Net Worth = ?", options: ["Income", "Assets - Liabilities", "Bank Balance"], correctIndex: 1, explanation: "What you own minus what you owe." },
        { question: "Best time to start saving?", options: ["Tomorrow", "Later", "Now"], correctIndex: 2, explanation: "Time is your biggest asset." },
        { question: "Lifestyle Inflation is...", options: ["Spending raises", "Gas prices", "Getting fat"], correctIndex: 0, explanation: "Staying broke even when earning more." }
    ],
    "Budget Beach": [
        { question: "In 50/30/20, what is 50%?", options: ["Wants", "Needs", "Savings"], correctIndex: 1, explanation: "50% for Needs (Rent, Food)." },
        { question: "Which bucket is 'Wants'?", options: ["50%", "30%", "20%"], correctIndex: 1, explanation: "30% for fun." },
        { question: "Savings should be at least...", options: ["5%", "10%", "20%"], correctIndex: 2, explanation: "Goal is 20% to build wealth." },
        { question: "Gross Income is...", options: ["Total Earned", "Take Home", "Refund"], correctIndex: 0, explanation: "Before taxes steal it." },
        { question: "Net Income is...", options: ["Before Tax", "After Tax", "Imaginary"], correctIndex: 1, explanation: "What actually hits your bank." },
        { question: "Budget based on...", options: ["Gross", "Net", "Dreams"], correctIndex: 1, explanation: "Spend only what you take home." },
        { question: "Fixed Expense...", options: ["Changes", "Stays same", "Optional"], correctIndex: 1, explanation: "Like Rent." },
        { question: "Groceries are...", options: ["Fixed", "Variable", "One-time"], correctIndex: 1, explanation: "Changes every week." },
        { question: "To save fast, cut...", options: ["Fixed", "Variable", "Income"], correctIndex: 1, explanation: "Easier to stop eating out than move house." },
        { question: "Emergency Fund is for...", options: ["PS5", "Medical/Car", "Vacation"], correctIndex: 1, explanation: "True emergencies only." },
        { question: "Full E-Fund is...", options: ["$500", "1 Month", "3-6 Months"], correctIndex: 2, explanation: "Protects against job loss." },
        { question: "Where to keep E-Fund?", options: ["Stock Market", "Checking", "HYSA"], correctIndex: 2, explanation: "Accessible but growing." },
        { question: "Sinking Fund is...", options: ["Losing money", "Saving for goal", "Debt"], correctIndex: 1, explanation: "Saving monthly for a big future bill." },
        { question: "Why Sinking Funds?", options: ["Stress", "Smooth expenses", "Hide money"], correctIndex: 1, explanation: "Prevents big bills from wrecking the month." },
        { question: "Car tires are...", options: ["Surprise", "Predictable", "Monthly"], correctIndex: 1, explanation: "You know they wear out. Save for them." },
        { question: "Zero-Based Budget means...", options: ["Spending zero", "Balance zero", "Assign every dollar"], correctIndex: 2, explanation: "Income - Expenses = 0." },
        { question: "If $100 left over...", options: ["Spend it", "Leave it", "Assign to savings"], correctIndex: 2, explanation: "Give every dollar a job." },
        { question: "Track spending...", options: ["Annually", "Weekly", "Never"], correctIndex: 1, explanation: "Catch leaks early." },
        { question: "Envelope System uses...", options: ["Checks", "Cash", "Crypto"], correctIndex: 1, explanation: "Physical limit on spending." },
        { question: "Envelopes help with...", options: ["Overspending", "Earning", "Investing"], correctIndex: 0, explanation: "Hard stop when empty." },
        { question: "Digital Envelopes are...", options: ["Emails", "Sub-accounts", "NFTs"], correctIndex: 1, explanation: "Bank buckets for goals." },
        { question: "Lifestyle Creep is...", options: ["Scary", "Spending raises", "Working less"], correctIndex: 1, explanation: "Spending more just because you earn more." },
        { question: "Pay Yourself First means...", options: ["Toys first", "Save first", "Bills last"], correctIndex: 1, explanation: "Automate savings immediately." },
        { question: "Goal of a budget is...", options: ["Restriction", "Freedom", "Math"], correctIndex: 1, explanation: "Permission to spend without guilt." }
    ],
    "Compound Cliffs": [
         { question: "Compound Interest is...", options: ["Linear", "Interest on Interest", "Fee"], correctIndex: 1, explanation: "Money earning on money." },
         { question: "Rule of 72 calculates...", options: ["Taxes", "Doubling Time", "Retirement"], correctIndex: 1, explanation: "72 / Rate = Years to double." },
         { question: "Best friend of compounding?", options: ["Money", "Time", "Luck"], correctIndex: 1, explanation: "Time is the exponent." },
         { question: "Start investing...", options: ["At 50", "At 18", "Never"], correctIndex: 1, explanation: "Earlier is better." },
         { question: "10% return doubles in...", options: ["10 yrs", "7.2 yrs", "5 yrs"], correctIndex: 1, explanation: "72/10 = 7.2" },
         { question: "Einstein called it...", options: ["Relativity", "8th Wonder", "Bad"], correctIndex: 1, explanation: "8th Wonder of the World." },
         { question: "APR is...", options: ["Annual Rate", "Apple", "All Pay"], correctIndex: 0, explanation: "Yearly cost." },
         { question: "APY includes...", options: ["Nothing", "Compounding", "Fees"], correctIndex: 1, explanation: "Yield includes compound effect." },
         { question: "High APY is good for...", options: ["Debt", "Savings", "Spending"], correctIndex: 1, explanation: "You want high earnings." },
         { question: "Frequent compounding is...", options: ["Better", "Worse", "Same"], correctIndex: 0, explanation: "Daily > Monthly > Yearly." },
         { question: "Credit cards compound...", options: ["Daily", "Monthly", "Never"], correctIndex: 0, explanation: "That's why debt explodes." },
         { question: "DCA means...", options: ["Dollar Cost Avg", "Don't Care", "Direct Cash"], correctIndex: 0, explanation: "Regular fixed investing." },
         { question: "Lump Sum vs DCA?", options: ["Lump wins", "DCA safer", "Neither"], correctIndex: 1, explanation: "DCA reduces timing risk." },
         { question: "Automating helps...", options: ["Nothing", "Remove emotion", "Lose money"], correctIndex: 1, explanation: "Robots don't panic." },
         { question: "Growth chart looks like...", options: ["Line", "Hockey Stick", "Circle"], correctIndex: 1, explanation: "Exponential curve." },
         { question: "Messy Middle is...", options: ["Boring part", "Fun part", "End"], correctIndex: 0, explanation: "When growth feels slow." },
         { question: "Exponential means...", options: ["1,2,3", "1,2,4,8", "1,1,1"], correctIndex: 1, explanation: "Doubling." },
         { question: "If market crashes...", options: ["Sell", "Hold/Buy", "Cry"], correctIndex: 1, explanation: "Don't lock in losses." },
         { question: "Wealth takes...", options: ["Days", "Decades", "Minutes"], correctIndex: 1, explanation: "Patience." },
         { question: "Enemy of compounding?", options: ["Taxes", "Interruption", "Fees"], correctIndex: 1, explanation: "Stopping resets the clock." },
         { question: "Roth IRA grows...", options: ["Taxed", "Tax-Free", "Slow"], correctIndex: 1, explanation: "Government keeps hands off." },
         { question: "Index Funds are...", options: ["Single stocks", "Baskets of stocks", "Risky"], correctIndex: 1, explanation: "Instant diversification." },
         { question: "Market average return?", options: ["2%", "10%", "50%"], correctIndex: 1, explanation: "Historically 10%." },
         { question: "Inflation avg?", options: ["0%", "3%", "10%"], correctIndex: 1, explanation: "Usually 2-3%." }
    ],
    "Bank Vault": [
        { question: "Banks make money by...", options: ["Printing", "Lending", "Charity"], correctIndex: 1, explanation: "Lending your deposits." },
        { question: "Checking is for...", options: ["Saving", "Spending", "Investing"], correctIndex: 1, explanation: "Flowing money." },
        { question: "Savings is for...", options: ["Parking cash", "Spending", "Debit"], correctIndex: 0, explanation: "Earning interest." },
        { question: "FDIC limit?", options: ["$1M", "$250k", "$50k"], correctIndex: 1, explanation: "Per bank per person." },
        { question: "Bank fails?", options: ["Lost money", "FDIC pays", "Sue"], correctIndex: 1, explanation: "Govt guarantee." },
        { question: "Crypto FDIC insured?", options: ["Yes", "No", "Maybe"], correctIndex: 1, explanation: "No protection." },
        { question: "High Yield Savings...", options: ["0.01%", "4-5%", "20%"], correctIndex: 1, explanation: "Much better than big banks." },
        { question: "Big Banks pay...", options: ["High", "Low", "None"], correctIndex: 1, explanation: "Usually near 0%." },
        { question: "Online Banks...", options: ["Scams", "Save overhead", "Print money"], correctIndex: 1, explanation: "No buildings = higher rates." },
        { question: "Overdraft fee...", options: ["Too much money", "Negative balance", "ATM use"], correctIndex: 1, explanation: "Spending what you don't have." },
        { question: "Maintenance fee...", options: ["Required", "Avoidable", "Good"], correctIndex: 1, explanation: "Avoid with min balance." },
        { question: "ATM fees...", options: ["Fair", "Waste", "Good"], correctIndex: 1, explanation: "Don't pay to get your own money." },
        { question: "Debit uses...", options: ["Bank money", "Your money", "Credit"], correctIndex: 1, explanation: "Direct from checking." },
        { question: "Debit builds credit?", options: ["Yes", "No", "Maybe"], correctIndex: 1, explanation: "No reporting." },
        { question: "Debit theft...", options: ["Harder to fix", "Easy", "Bank pays instantly"], correctIndex: 0, explanation: "Cash is gone temp." },
        { question: "ChexSystems...", options: ["Bad banking list", "Credit score", "Grades"], correctIndex: 0, explanation: "Blacklist for bank fees." },
        { question: "Second Chance acct...", options: ["VIP", "Bad history", "Kids"], correctIndex: 1, explanation: "For ChexSystems record holders." },
        { question: "Bouncing check...", options: ["Rubber", "No funds", "Closed"], correctIndex: 1, explanation: "Insufficient money." },
        { question: "2FA...", options: ["2 Apps", "Two Factor", "Too Fast"], correctIndex: 1, explanation: "Security essential." },
        { question: "Phishing...", options: ["Fish", "Fake emails", "Music"], correctIndex: 1, explanation: "Stealing login info." },
        { question: "Freeze card if...", options: ["Cold", "Lost", "Full"], correctIndex: 1, explanation: "Stop thieves." },
        { question: "CD...", options: ["Music", "Cert of Deposit", "Cash"], correctIndex: 1, explanation: "Locked savings." },
        { question: "Money Market...", options: ["Stock", "Hybrid Acct", "Illegal"], correctIndex: 1, explanation: "Checking + Savings features." },
        { question: "Credit Union...", options: ["Profit", "Member Owned", "Govt"], correctIndex: 1, explanation: "Non-profit usually." }
    ],
    "Debt Dungeon": [
        { question: "Good Debt...", options: ["Toys", "Assets", "Food"], correctIndex: 1, explanation: "Builds value." },
        { question: "Bad Debt...", options: ["Invests", "Consumes", "Tax help"], correctIndex: 1, explanation: "High interest consumerism." },
        { question: "Secured Debt...", options: ["Safe", "Has Collateral", "Free"], correctIndex: 1, explanation: "Backed by asset." },
        { question: "APR...", options: ["Annual % Rate", "Apple", "All Pay"], correctIndex: 0, explanation: "Cost of borrowing." },
        { question: "High APR...", options: ["Expensive", "Cheap", "Good"], correctIndex: 0, explanation: "Pay more interest." },
        { question: "Credit Card APR...", options: ["5%", "10%", "20%+"], correctIndex: 2, explanation: "Very expensive." },
        { question: "Min Payment...", options: ["Smart", "Trap", "Wealthy"], correctIndex: 1, explanation: "Keeps you in debt." },
        { question: "Neg Amortization...", options: ["Debt down", "Debt up", "Gone"], correctIndex: 1, explanation: "Payments don't cover interest." },
        { question: "Kill debt...", options: ["Min pay", "Extra pay", "Ignore"], correctIndex: 1, explanation: "Principal pay down." },
        { question: "Good Score...", options: ["300", "500", "750+"], correctIndex: 2, explanation: "Top tier." },
        { question: "FICO range...", options: ["0-100", "300-850", "A-F"], correctIndex: 1, explanation: "Standard model." },
        { question: "Checking score...", options: ["Hurts", "Safe", "Bad"], correctIndex: 1, explanation: "Soft pulls represent no risk." },
        { question: "Biggest factor...", options: ["Payment History", "Amount", "Age"], correctIndex: 0, explanation: "35% is paying on time." },
        { question: "Utilization...", options: ["100%", "50%", "<30%"], correctIndex: 2, explanation: "Don't max out." },
        { question: "Closing cards...", options: ["Helps", "Hurts", "Neutral"], correctIndex: 1, explanation: "Lowers age/limit." },
        { question: "Snowball...", options: ["High Rate", "Small Balance", "Random"], correctIndex: 1, explanation: "Psychological wins." },
        { question: "Avalanche...", options: ["High Rate", "Small Bal", "Big Bal"], correctIndex: 0, explanation: "Math wins." },
        { question: "Consolidation...", options: ["Free", "Combine", "Bankrupt"], correctIndex: 1, explanation: "Merge loans." },
        { question: "Payday Loans...", options: ["Helpful", "Predatory", "Cheap"], correctIndex: 1, explanation: "400% interest." },
        { question: "BNPL...", options: ["Harmless", "Overspending trap", "Free"], correctIndex: 1, explanation: "Tricks brain." },
        { question: "Co-signing...", options: ["Nice", "Liability", "Fun"], correctIndex: 1, explanation: "You pay if they don't." },
        { question: "Bankruptcy...", options: ["Easy", "Ruins 7yr", "Free"], correctIndex: 1, explanation: "Nuclear option." },
        { question: "Collections...", options: ["Nice", "Harass", "Ignore"], correctIndex: 1, explanation: "They buy debt cheap." },
        { question: "CC Strategy...", options: ["Carry balance", "Pay Full", "Cut"], correctIndex: 1, explanation: "Rewards without interest." }
    ],
    // Fillers for remaining worlds to ensure no crashes
    "Hustle Hub": Array(24).fill({ question: "Hustle Hard?", options: ["No", "Yes", "Maybe"], correctIndex: 1, explanation: "Always hustle." }),
    "Stony Stocks": Array(24).fill({ question: "Buy Low?", options: ["Sell Low", "Sell High", "Hold"], correctIndex: 1, explanation: "Buy low sell high." }),
    "Wealth Empire": Array(24).fill({ question: "Rich?", options: ["No", "Yes", "Maybe"], correctIndex: 1, explanation: "Get rich." })
};

// --- FULL CONTENT DATABASE ---
// Populated for ALL worlds to ensure fallback is not needed
const CONTENT_DB: Record<string, any> = {
    "Moola Basics": {
        swipes: [
            { q: "Found $20", left: "Save", right: "Spend", correct: "left", text: "Start the E-Fund." },
            { q: "New Phone", left: "Buy", right: "Wait", correct: "right", text: "Wait for price drop." },
            { q: "Lend $50?", left: "No", right: "Yes", correct: "left", text: "Don't lend what you can't lose." },
            { q: "Starbucks", left: "Daily", right: "Home", correct: "right", text: "$7/day is $2500/yr." },
            { q: "Gift Money", left: "Invest", right: "Toys", correct: "left", text: "Let it grow." },
            { q: "50% Off Junk", left: "Buy", right: "Pass", correct: "right", text: "Spending is not saving." }
        ],
        lies: [
            { text: "Money Myths", options: ["Trees grow money", "Inflation hurts cash", "Banks lend money", "Taxes real"], correct: 0, exp: "Only Fed prints." },
            { text: "Rich Secrets", options: ["Spend all", "Invest early", "Avoid debt", "Track"], correct: 0, exp: "Spending all makes you poor." }
        ],
        memes: [
            { cap: "Me expecting wealth", text: "Spending $0", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Inflation", text: "$10 is now $5", img: "https://i.imgflip.com/1ur9b0.jpg" }
        ],
        math: [
            { q: "$10/mo @ 8% 40yr?", a: 35000, t: "Compound magic." },
            { q: "Inflation 3% of $100?", a: 97, t: "Losing value." }
        ],
        polls: [
            { q: "Cash or Card?", o: ["Cash", "Card"], a: 1, t: "Digital future." },
            { q: "Windfall?", o: ["Spend", "Invest"], a: 1, t: "Invest it." }
        ],
        infos: [
            { t: "Money is a tool.", analogy: "Like a hammer.", img: "" },
            { t: "Spend less than earn.", analogy: "Leaky bucket.", img: "" }
        ]
    },
    "Budget Beach": {
        swipes: [
            { q: "Paycheck Hits", left: "Mall", right: "Bank", correct: "right", text: "Pay yourself first." },
            { q: "Rent Due", left: "Pay Late", right: "Pay First", correct: "right", text: "Needs > Wants." },
            { q: "Bonus $500", left: "Party", right: "Debt/Save", correct: "right", text: "Kill debt first." },
            { q: "Subscription", left: "Keep unused", right: "Cancel", correct: "right", text: "Leak in the bucket." },
            { q: "Grocery", left: "Hungry", right: "List", correct: "right", text: "Never shop hungry." },
            { q: "Raise", left: "New Car", right: "Invest", correct: "right", text: "Avoid lifestyle creep." }
        ],
        lies: [
            { text: "Budgeting Myths", options: ["It restricts", "It frees you", "It guides", "It's smart"], correct: 0, exp: "Budgets give permission to spend." },
            { text: "Credit Cards", options: ["Free money", "High Interest", "Tool", "Debt"], correct: 0, exp: "It is a loan, not income." },
            { text: "Emergency Fund", options: ["For Pizza", "For Medical", "For Job Loss", "For Car"], correct: 0, exp: "Pizza is not an emergency." }
        ],
        memes: [
            { cap: "Budgeting", text: "Expectation vs Reality", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Direct Deposit", text: "And it's gone", img: "https://i.imgflip.com/3l60ph.jpg" }
        ],
        math: [
            { q: "50% of $2000?", a: 1000, t: "For Needs." },
            { q: "30% of $2000?", a: 600, t: "For Wants." },
            { q: "20% of $2000?", a: 400, t: "For Savings." },
            { q: "$5 latte x 30 days?", a: 150, t: "Small leaks sink ships." }
        ],
        polls: [
            { q: "Hardest part?", o: ["Starting", "Sticking", "Math"], a: 1, t: "Consistency is key." },
            { q: "Method?", o: ["App", "Excel", "Paper"], a: 0, t: "Whatever works for you." }
        ],
        infos: [
            { t: "50/30/20 Rule", analogy: "Balanced Diet for Wallet", img: "" },
            { t: "Envelope System", analogy: "Cash handcuffs", img: "" }
        ]
    },
    "Compound Cliffs": {
        swipes: [
            { q: "Start Investing", left: "Age 20", right: "Age 40", correct: "left", text: "Time is money." },
            { q: "Market Crash", left: "Panic Sell", right: "Hold/Buy", correct: "right", text: "Buy the dip." },
            { q: "Interest Rate", left: "1%", right: "10%", correct: "right", text: "Higher is better for savings." },
            { q: "Frequency", left: "Yearly", right: "Daily", correct: "right", text: "More frequent = more growth." },
            { q: "Consistency", left: "Random", right: "Automated", correct: "right", text: "Set and forget." },
            { q: "Withdrawal", left: "Early", right: "Retirement", correct: "right", text: "Don't interrupt the compound." }
        ],
        lies: [
            { text: "Investing Myths", options: ["Need millions", "Start with $5", "Time matters", "Consistency key"], correct: 0, exp: "You can start with pennies." },
            { text: "Risk", options: ["Cash is risk-free", "Inflation eats cash", "Stocks fluctuate", "Diversify"], correct: 0, exp: "Inflation guarantees cash loss." }
        ],
        memes: [
            { cap: "Waiting to invest", text: "Old Skeleton", img: "https://i.imgflip.com/2b7c.jpg" },
            { cap: "Compound Interest", text: "Stonks", img: "https://i.imgflip.com/4t0m5.jpg" }
        ],
        math: [
            { q: "Rule of 72 @ 10%?", a: 7.2, t: "Years to double." },
            { q: "Rule of 72 @ 6%?", a: 12, t: "Years to double." },
            { q: "$100 dbl 10 times?", a: 102400, t: "Power of doubling." }
        ],
        polls: [
            { q: "Risk tolerance?", o: ["High", "Low"], a: 0, t: "Young people can take risk." },
            { q: "Goal?", o: ["Fast cash", "Wealth"], a: 1, t: "Wealth takes time." }
        ],
        infos: [
            { t: "Compound Interest", analogy: "Snowball rolling downhill", img: "" },
            { t: "Time in Market", analogy: "Planting a tree", img: "" }
        ]
    },
    "Bank Vault": {
        swipes: [
            { q: "Store Cash", left: "Mattress", right: "Bank", correct: "right", text: "Safer and earns interest." },
            { q: "Account Type", left: "Checking", right: "HYSA", correct: "right", text: "Earn 4% vs 0%." },
            { q: "ATM Fee", left: "Pay $3", right: "Find Network", correct: "right", text: "Don't pay for your own money." },
            { q: "Password", left: "123456", right: "Complex", correct: "right", text: "Security matters." },
            { q: "Phishing Email", left: "Click Link", right: "Report", correct: "right", text: "Never click suspicious links." },
            { q: "Overdraft", left: "Turn On", right: "Turn Off", correct: "right", text: "Don't pay fees for $0 balance." }
        ],
        lies: [
            { text: "Bank Myths", options: ["Banks hold cash", "Banks lend cash", "FDIC Insured", "Checking is for spending"], correct: 0, exp: "They lend your money out." },
            { text: "Debit Cards", options: ["Build Credit", "Use your money", "No debt", "Safe"], correct: 0, exp: "Debit does not build credit." }
        ],
        memes: [
            { cap: "Bank Fees", text: "You have no money? Fee.", img: "https://i.imgflip.com/1w7ygt.jpg" },
            { cap: "Interest Rates", text: "0.01% - Thanks Bank", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        math: [
            { q: "$10k @ 0.01%?", a: 1, t: "Big banks pay nothing." },
            { q: "$10k @ 5%?", a: 500, t: "HYSA pays $500/yr." }
        ],
        polls: [
            { q: "Bank type?", o: ["Big Bank", "Online", "Credit Union"], a: 1, t: "Online usually pays more." },
            { q: "Cash use?", o: ["Never", "Always"], a: 0, t: "Digital is king." }
        ],
        infos: [
            { t: "FDIC Insurance", analogy: "Government Safety Net", img: "" },
            { t: "Inflation vs Interest", analogy: "Race against melting ice", img: "" }
        ]
    },
    "Debt Dungeon": {
        swipes: [
            { q: "Pay Minimum", left: "Yes", right: "Pay Full", correct: "right", text: "Avoid interest." },
            { q: "Credit Score", left: "Ignore", right: "Monitor", correct: "right", text: "It controls your future." },
            { q: "Max Out Card", left: "YOLO", right: "Below 30%", correct: "right", text: "Utilization hurts score." },
            { q: "Store Card", left: "Sign Up", right: "Decline", correct: "right", text: "Usually bad rates." },
            { q: "Miss Payment", left: "Whatever", right: "Never", correct: "right", text: "35% of score is history." },
            { q: "Payday Loan", left: "Take it", right: "Run", correct: "right", text: "400% interest trap." }
        ],
        lies: [
            { text: "Credit Myths", options: ["Checking hurts score", "Paying helps", "High util is bad", "Age matters"], correct: 0, exp: "Checking your own score is safe." },
            { text: "Debt Myths", options: ["All debt bad", "Leverage exists", "Student loans invest", "Mortgage asset"], correct: 0, exp: "Some debt builds wealth (leverage)." }
        ],
        memes: [
            { cap: "Minimum Payment", text: "I will never financially recover", img: "https://i.imgflip.com/30b1gx.jpg" },
            { cap: "Credit Score", text: "800 Club", img: "https://i.imgflip.com/2gnnjh.jpg" }
        ],
        math: [
            { q: "$5k @ 20% interest?", a: 1000, t: "Cost per year." },
            { q: "Utilization of $500/$1000?", a: 50, t: "50% is too high." }
        ],
        polls: [
            { q: "Have Card?", o: ["Yes", "No"], a: 0, t: "Build history early." },
            { q: "Fear Debt?", o: ["Yes", "No"], a: 0, t: "Respect it, don't fear it." }
        ],
        infos: [
            { t: "APR", analogy: "Rental fee for money", img: "" },
            { t: "Credit Score", analogy: "Adult Report Card", img: "" }
        ]
    },
    "Hustle Hub": {
        swipes: [
            { q: "Tax Refund", left: "Spend", right: "Invest", correct: "right", text: "It's your money back." },
            { q: "Side Hustle", left: "Scalable", right: "Hourly", correct: "left", text: "Build once sell twice." },
            { q: "Raise Ask", left: "Scared", right: "Ask", correct: "right", text: "Closed mouths don't get fed." },
            { q: "Learn Skill", left: "YouTube", right: "Degree", correct: "left", text: "Skills > Paper." },
            { q: "Network", left: "Netflix", right: "Event", correct: "right", text: "Network is Net Worth." },
            { q: "LLC", left: "Start", right: "Wait", correct: "left", text: "Protect assets." }
        ],
        lies: [
            { text: "Tax Myths", options: ["Refund is free money", "Brackets are marginal", "Write-offs legal", "Pay on profit"], correct: 0, exp: "It's a loan to the govt." },
            { text: "Hustle Myths", options: ["Easy money", "Takes work", "Consistency", "Value"], correct: 0, exp: "Get rich quick is a lie." }
        ],
        memes: [
            { cap: "Gross Pay", text: "Net Pay", img: "https://i.imgflip.com/1ur9b0.jpg" },
            { cap: "IRS", text: "I'll take that", img: "https://i.imgflip.com/24y43o.jpg" }
        ],
        math: [
            { q: "$100k - 30% tax?", a: 70000, t: "Net income." },
            { q: "$50/hr x 10hrs?", a: 500, t: "Active income." }
        ],
        polls: [
            { q: "Goal?", o: ["CEO", "Founder"], a: 1, t: "Equity is king." },
            { q: "Work?", o: ["Remote", "Office"], a: 0, t: "Freedom." }
        ],
        infos: [
            { t: "Gross vs Net", analogy: "Whole pizza vs Slices left", img: "" },
            { t: "Passive Income", analogy: "Planting seeds", img: "" }
        ]
    },
    "Stony Stocks": {
        swipes: [
            { q: "Market Dip", left: "Sell", right: "Buy", correct: "right", text: "Discount." },
            { q: "Single Stock", left: "YOLO", right: "Diversify", correct: "right", text: "ETF is safer." },
            { q: "Dividend", left: "Spend", right: "Reinvest", correct: "right", text: "Compound it." },
            { q: "Timeframe", left: "Day", right: "Decade", correct: "right", text: "Long term wins." },
            { q: "Research", left: "TikTok", right: "Filings", correct: "right", text: "Trust data not influencers." },
            { q: "Fees", left: "High", right: "Low/Zero", correct: "right", text: "Fees eat profit." }
        ],
        lies: [
            { text: "Stock Myths", options: ["It's gambling", "Ownership", "Long term", "Dividends"], correct: 0, exp: "It's owning businesses." },
            { text: "Timing", options: ["Predictable", "Random short term", "Trend up", "Hard"], correct: 0, exp: "No one can predict short term." }
        ],
        memes: [
            { cap: "Stonks", text: "Only go up", img: "https://i.imgflip.com/4t0m5.jpg" },
            { cap: "Day Trader", text: "Lost it all", img: "https://i.imgflip.com/30b1gx.jpg" }
        ],
        math: [
            { q: "10% of $1000?", a: 100, t: "Avg return." },
            { q: "Div Yield $2 on $100?", a: 2, t: "2% Yield." }
        ],
        polls: [
            { q: "Strategy?", o: ["DCA", "Timing"], a: 0, t: "DCA wins." },
            { q: "Asset?", o: ["Tech", "Index"], a: 1, t: "Index is safer." }
        ],
        infos: [
            { t: "Stock Market", analogy: "Supermarket for Companies", img: "" },
            { t: "Volatility", analogy: "Rollercoaster vs Train", img: "" }
        ]
    },
    "Wealth Empire": {
        swipes: [
            { q: "Surplus Cash", left: "Lifestyle", right: "Assets", correct: "right", text: "Feed the empire." },
            { q: "Real Estate", left: "Rent", right: "Own", correct: "right", text: "Equity." },
            { q: "Estate Plan", left: "Later", right: "Now", correct: "right", text: "Protect legacy." },
            { q: "Giving", left: "Keep", right: "Help", correct: "right", text: "Legacy." },
            { q: "Automation", left: "Manual", right: "Auto", correct: "right", text: "Systems scale." },
            { q: "Retirement", left: "65", right: "When Ready", correct: "right", text: "FI/RE." }
        ],
        lies: [
            { text: "Wealth Myths", options: ["Income = Wealth", "Net Worth = Wealth", "Assets Key", "Debt leverage"], correct: 0, exp: "High income with high spend is broke." },
            { text: "Real Estate", options: ["Passive", "Active work", "Leverage", "Tax break"], correct: 0, exp: "It takes work to manage." }
        ],
        memes: [
            { cap: "Net Worth", text: "To the moon", img: "https://i.imgflip.com/2gnnjh.jpg" },
            { cap: "Landlord", text: "Passive?", img: "https://i.imgflip.com/1w7ygt.jpg" }
        ],
        math: [
            { q: "4% of $1M?", a: 40000, t: "Safe withdrawal." },
            { q: "$1M - $200k Debt?", a: 800000, t: "Net Worth." }
        ],
        polls: [
            { q: "Retire?", o: ["Beach", "Work Fun"], a: 1, t: "Purpose matters." },
            { q: "Legacy?", o: ["Kids", "Charity"], a: 0, t: "Personal choice." }
        ],
        infos: [
            { t: "Net Worth", analogy: "Financial Scorecard", img: "" },
            { t: "FI/RE", analogy: "Buying Freedom", img: "" }
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
    // Fallback to Moola Basics if world DB missing, but keys should match WORLDS_METADATA
    const worldDB = CONTENT_DB[worldName] || CONTENT_DB["Moola Basics"]; 

    // 1. BOSS GENERATION (UNIQUE PER WORLD & LEVEL)
    const bossNames = ["Goblin", "Troll", "Dragon", "Vampire", "Reaper", "Titan", "Golem", "Wizard"];
    const bossName = `${worldName.split(' ')[1] || "Money"} ${bossNames[(levelNum - 1) % bossNames.length]}`;
    
    // Pick unique boss questions for this SPECIFIC LEVEL
    // Logic: Slice 3 questions based on level number to ensure 0 repeats.
    const allWorldQuestions = BOSS_BATTLES[worldName] || BOSS_BATTLES["Moola Basics"];
    
    // Calculate index range. Level 1 = 0-2, Level 2 = 3-5, etc.
    // We use modulo just in case the array length is shorter than 24, wrapping around gracefully instead of crashing.
    const startIndex = ((levelNum - 1) * 3) % allWorldQuestions.length;
    
    let levelBossQuestions = allWorldQuestions.slice(startIndex, startIndex + 3);
    
    // Fallback: If we don't have enough questions left in the slice (e.g. end of array), wrap around to start
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

    // 2. LESSON GENERATION (6 Unique Lessons)
    const lessons: Lesson[] = [];
    const types: LessonType[] = ['swipe', 'tapLie', 'meme', 'calculator', 'info', 'poll']; 
    
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
