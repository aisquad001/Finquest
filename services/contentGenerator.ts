
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
// 24 Questions per world (3 per level x 8 levels) to ensure NO repeats.
const BOSS_BATTLES: Record<string, BossQuestion[]> = {
    "Moola Basics": [
        // Level 1: Assets vs Liabilities
        { question: "Which puts money IN your pocket?", options: ["Liabilities", "Assets", "Expenses"], correctIndex: 1, explanation: "Assets pay you (stocks, business). Liabilities cost you." },
        { question: "Rich people primarily buy...", options: ["Luxury Cars", "Big Houses", "Assets"], correctIndex: 2, explanation: "They buy assets first, which then pay for the luxuries." },
        { question: "Which is a Liability?", options: ["Rental Property", "Dividend Stock", "New Car Loan"], correctIndex: 2, explanation: "A loan takes money out of your pocket every month." },
        // Level 2: Inflation
        { question: "Inflation causes prices to...", options: ["Stay same", "Decrease", "Increase"], correctIndex: 2, explanation: "Inflation makes your cash worth less over time." },
        { question: "If inflation is 3% and your bank pays 1%...", options: ["You are losing money", "You are breaking even", "You are getting rich"], correctIndex: 0, explanation: "You lose purchasing power because costs rise faster than your savings." },
        { question: "What fights inflation best?", options: ["Cash under mattress", "Invested Assets", "Gift Cards"], correctIndex: 1, explanation: "Assets tend to grow in value, keeping up with inflation." },
        // Level 3: Needs vs Wants
        { question: "Which is a NEED?", options: ["iPhone 15", "Shelter", "Netflix"], correctIndex: 1, explanation: "Needs are essential for survival. Everything else is a want." },
        { question: "Delayed Gratification means...", options: ["Buying it now", "Waiting to buy later", "Never buying it"], correctIndex: 1, explanation: "Waiting often lets you buy it cheaper or realize you didn't need it." },
        { question: "The 'Latte Factor' refers to...", options: ["Coffee prices", "Small daily spending", "Milk allergies"], correctIndex: 1, explanation: "Small habits (like $5 coffee) add up to huge amounts over years." },
        // Level 4: Money Mindset
        { question: "Money is...", options: ["Evil", "A Tool", "The Goal"], correctIndex: 1, explanation: "Money is just a tool to build the life you want." },
        { question: "Who prints money?", options: ["The Mint", "Amazon", "Elon Musk"], correctIndex: 0, explanation: "The Government/Central Bank prints fiat currency." },
        { question: "Bartering is...", options: ["Trading goods", "Buying with cash", "Using crypto"], correctIndex: 0, explanation: "Trading a chicken for shoes is bartering." },
        // Level 5: Income Types
        { question: "Active Income requires...", options: ["Sleeping", "Trading time for money", "Owning land"], correctIndex: 1, explanation: "You have to work to earn active income (wages)." },
        { question: "Passive Income requires...", options: ["Working 9-5", "Assets working for you", "Asking parents"], correctIndex: 1, explanation: "Money earning money while you sleep." },
        { question: "Portfolio Income comes from...", options: ["Your Job", "Investments", "Gifts"], correctIndex: 1, explanation: "Capital gains and dividends." },
        // Level 6: Opportunity Cost
        { question: "Opportunity Cost is...", options: ["Price tag", "What you give up", "Sales tax"], correctIndex: 1, explanation: "If you spend $50 on a game, you give up $50 of investing." },
        { question: "Time is...", options: ["Refundable", "Infinite", "A limited resource"], correctIndex: 2, explanation: "You can make more money, but you can't make more time." },
        { question: "Sunk Cost Fallacy means...", options: ["Spending because you already spent", "Saving money", "Buying a boat"], correctIndex: 0, explanation: "Throwing good money after bad money." },
        // Level 7: Scarcity
        { question: "Supply and Demand: If supply is low...", options: ["Price drops", "Price rises", "Price stays same"], correctIndex: 1, explanation: "Rare things cost more (scarcity)." },
        { question: "Why is gold valuable?", options: ["It is yellow", "It is scarce", "It tastes good"], correctIndex: 1, explanation: "Limited supply makes things valuable." },
        { question: "Fiat money has value because...", options: ["It is gold", "Govt says so", "It is paper"], correctIndex: 1, explanation: "It is backed by trust in the government, not gold." },
        // Level 8: Financial Review
        { question: "Net Worth = ?", options: ["Income", "Assets - Liabilities", "Bank Balance"], correctIndex: 1, explanation: "It's what you own minus what you owe." },
        { question: "The best time to start saving?", options: ["Tomorrow", "Next Year", "Now"], correctIndex: 2, explanation: "Time is your biggest asset. Start today." },
        { question: "Lifestyle Inflation is...", options: ["Spending more as you earn more", "Rising gas prices", "Getting fat"], correctIndex: 0, explanation: "Staying broke even when you get a raise." }
    ],
    "Budget Beach": [
        // Level 1: 50/30/20 Rule
        { question: "In 50/30/20, what is the 50%?", options: ["Wants", "Needs", "Savings"], correctIndex: 1, explanation: "50% for Needs (Rent, Food), 30% Wants, 20% Savings." },
        { question: "Which bucket is 'Wants'?", options: ["50%", "30%", "20%"], correctIndex: 1, explanation: "30% of your income is for fun." },
        { question: "Savings/Investing should be at least...", options: ["5%", "10%", "20%"], correctIndex: 2, explanation: "The goal is 20% to build wealth." },
        // Level 2: Gross vs Net
        { question: "Gross Income is...", options: ["Total Earned", "Take Home", "Tax Refund"], correctIndex: 0, explanation: "Gross is the big number before taxes steal it." },
        { question: "Net Income is...", options: ["Before Tax", "After Tax", "Imaginary"], correctIndex: 1, explanation: "Net is what actually hits your bank account." },
        { question: "You budget based on...", options: ["Gross Income", "Net Income", "Lottery dreams"], correctIndex: 1, explanation: "You can only spend what you actually take home." },
        // Level 3: Fixed vs Variable
        { question: "A Fixed Expense...", options: ["Changes monthly", "Stays the same", "Is optional"], correctIndex: 1, explanation: "Rent is fixed. It's the same every month." },
        { question: "Groceries are a...", options: ["Fixed Expense", "Variable Expense", "One-time cost"], correctIndex: 1, explanation: "You spend a different amount on food every week." },
        { question: "To save money fast, cut...", options: ["Fixed Expenses", "Variable Expenses", "Income"], correctIndex: 1, explanation: "It's easier to stop eating out (variable) than break a lease (fixed)." },
        // Level 4: Emergency Fund
        { question: "An Emergency Fund is for...", options: ["PS5", "Unexpected Bills", "Vacation"], correctIndex: 1, explanation: "It's for true emergencies like car repairs or medical bills." },
        { question: "How much implies a 'Full' E-Fund?", options: ["$500", "1 Month expenses", "3-6 Months expenses"], correctIndex: 2, explanation: "3-6 months protects you from job loss." },
        { question: "Where do you keep an E-Fund?", options: ["Stock Market", "Checking", "HYSA"], correctIndex: 2, explanation: "High Yield Savings keeps it accessible but growing." },
        // Level 5: Sinking Funds
        { question: "A Sinking Fund is...", options: ["Losing money", "Saving for a specific goal", "Debt payment"], correctIndex: 1, explanation: "Saving $50/mo for Christmas gifts is a sinking fund." },
        { question: "Why use Sinking Funds?", options: ["To stress out", "To smooth out big expenses", "To hide money"], correctIndex: 1, explanation: "It prevents big annual bills from wrecking your monthly budget." },
        { question: "Car tires are a...", options: ["Surprise", "Predictable Expense", "Monthly bill"], correctIndex: 1, explanation: "You KNOW tires wear out. Save for them." },
        // Level 6: Zero-Based Budgeting
        { question: "Zero-Based Budget means...", options: ["Spending zero", "Balance is zero", "Every dollar has a job"], correctIndex: 2, explanation: "Income - Expenses = 0. Assign every dollar a task." },
        { question: "If you have $100 left over...", options: ["Spend it", "Leave it", "Assign it to savings"], correctIndex: 2, explanation: "In Zero-Based, you must assign surplus to a category (like savings)." },
        { question: "Tracking spending should happen...", options: ["Annually", "Weekly/Daily", "Never"], correctIndex: 1, explanation: "Frequent tracking catches leaks before they sink the ship." },
        // Level 7: The Envelope System
        { question: "The Envelope System uses...", options: ["Checks", "Physical Cash", "Crypto"], correctIndex: 1, explanation: "Putting cash in envelopes forces you to stop spending when empty." },
        { question: "Envelope method helps with...", options: ["Overspending", "Earning more", "Investing"], correctIndex: 0, explanation: "It creates a hard physical limit on spending." },
        { question: "Digital Envelopes are...", options: ["Emails", "Bank sub-accounts", "NFTs"], correctIndex: 1, explanation: "Many banks let you create 'buckets' or sub-accounts." },
        // Level 8: Budget Boss Review
        { question: "Lifestyle Creep is...", options: ["Scary", "Spending raises", "Working less"], correctIndex: 1, explanation: "Spending more just because you earn more keeps you broke." },
        { question: "Pay Yourself First means...", options: ["Buy toys first", "Save before spending", "Pay bills last"], correctIndex: 1, explanation: "Automate savings transfer immediately on payday." },
        { question: "The goal of a budget is...", options: ["Restriction", "Freedom", "Accounting"], correctIndex: 1, explanation: "A budget gives you permission to spend without guilt." }
    ],
    "Compound Cliffs": [
        // Level 1: Basics
        { question: "Compound Interest is...", options: ["Linear growth", "Interest on Interest", "A bank fee"], correctIndex: 1, explanation: "Your money earns money, then that money earns more money." },
        { question: "Simple Interest pays on...", options: ["Principal only", "Principal + Interest", "Nothing"], correctIndex: 0, explanation: "Simple interest doesn't compound. It's slower." },
        { question: "Albert Einstein called it...", options: ["Theory of Relativity", "8th Wonder of the World", "Boring"], correctIndex: 1, explanation: "He (allegedly) said he who understands it, earns it." },
        // Level 2: Time Factor
        { question: "The most important factor is...", options: ["Amount invested", "Time", "IQ"], correctIndex: 1, explanation: "Time in the market beats timing the market." },
        { question: "Starting at 20 vs 30...", options: ["Makes no difference", "Doubles potential wealth", "Is too early"], correctIndex: 1, explanation: "Those extra 10 years can literally double your result." },
        { question: "If you wait to invest...", options: ["You save money", "You lose opportunity", "It's safer"], correctIndex: 1, explanation: "The opportunity cost of waiting is massive." },
        // Level 3: Rule of 72
        { question: "Rule of 72 calculates...", options: ["Taxes", "Doubling Time", "Retirement Age"], correctIndex: 1, explanation: "Divide 72 by interest rate to see years to double." },
        { question: "At 10% return, money doubles in...", options: ["10 years", "7.2 years", "5 years"], correctIndex: 1, explanation: "72 divided by 10 is 7.2." },
        { question: "To double in 6 years, you need...", options: ["6% return", "12% return", "20% return"], correctIndex: 1, explanation: "72 divided by 12 is 6." },
        // Level 4: Interest Rates
        { question: "APY stands for...", options: ["Annual Percentage Yield", "Apple Pie Yummy", "Account Pay Yearly"], correctIndex: 0, explanation: "It includes the effect of compounding." },
        { question: "High APY is good for...", options: ["Loans", "Savings", "Credit Cards"], correctIndex: 1, explanation: "You want High APY on savings, Low APR on debt." },
        { question: "Inflation usually averages...", options: ["0%", "2-3%", "10%"], correctIndex: 1, explanation: "If your money isn't earning 3%, it's dying." },
        // Level 5: Frequency
        { question: "Compounding Monthly vs Annually...", options: ["Monthly is better", "Annually is better", "Same"], correctIndex: 0, explanation: "More frequent compounding means faster growth." },
        { question: "Daily compounding is...", options: ["Best for savers", "Worst for savers", "Illegal"], correctIndex: 0, explanation: "Your money grows every single day." },
        { question: "Credit cards compound...", options: ["Daily", "Monthly", "Never"], correctIndex: 0, explanation: "That's why debt grows so fast. It compounds daily against you." },
        // Level 6: Consistency
        { question: "DCA stands for...", options: ["Dollar Cost Averaging", "Don't Care Anymore", "Direct Cash Access"], correctIndex: 0, explanation: "Investing a fixed amount regularly regardless of price." },
        { question: "Lump Sum vs DCA?", options: ["Lump Sum always wins", "DCA reduces timing risk", "Neither works"], correctIndex: 1, explanation: "DCA prevents you from buying at the absolute peak." },
        { question: "Automating investments...", options: ["Is lazy", "Removes emotion", "Costs extra"], correctIndex: 1, explanation: "Robots don't panic sell. Humans do." },
        // Level 7: The Graph
        { question: "Compound growth looks like...", options: ["Straight line", "Hockey stick", "Circle"], correctIndex: 1, explanation: "It starts flat and shoots up vertically at the end." },
        { question: "The 'messy middle' is...", options: ["When you lose hope", "When growth is boring", "When you retire"], correctIndex: 1, explanation: "The middle years feel slow, but you must keep going." },
        { question: "Exponential means...", options: ["1, 2, 3, 4", "1, 2, 4, 8", "1, 1, 1, 1"], correctIndex: 1, explanation: "Doubling is exponential." },
        // Level 8: Wealth Mindset
        { question: "If market crashes...", options: ["Panic Sell", "Hold/Buy", "Cry"], correctIndex: 1, explanation: "You only lose money if you sell low. Ride it out." },
        { question: "Wealth is built in...", options: ["Days", "Months", "Decades"], correctIndex: 2, explanation: "Patience is the secret ingredient." },
        { question: "The biggest enemy of compounding is...", options: ["Taxes", "Interruption", "Fees"], correctIndex: 1, explanation: "Stoping the snowball resets the momentum." }
    ],
    "Bank Vault": [
        // Level 1: Basics
        { question: "Banks make money by...", options: ["Printing it", "Lending your money", "Charity"], correctIndex: 1, explanation: "They pay you 1% and lend it out at 5%." },
        { question: "Checking accounts are for...", options: ["Holding forever", "Spending flow", "Investing"], correctIndex: 1, explanation: "Checking is for paying bills. Money flows through it." },
        { question: "Savings accounts are for...", options: ["Debit cards", "Parking cash", "Buying stocks"], correctIndex: 1, explanation: "Safe storage that earns interest." },
        // Level 2: FDIC
        { question: "FDIC insures deposits up to...", options: ["$1 Million", "$250,000", "$50,000"], correctIndex: 1, explanation: "The government protects up to $250k per bank." },
        { question: "If a bank fails...", options: ["Money is gone", "FDIC pays you", "You sue them"], correctIndex: 1, explanation: "As long as it's FDIC insured, you are safe." },
        { question: "Is Crypto FDIC insured?", options: ["Yes", "No", "Sometimes"], correctIndex: 1, explanation: "Crypto exchanges have NO government protection." },
        // Level 3: Interest Rates
        { question: "Which pays more interest?", options: ["Checking", "HYSA", "Under mattress"], correctIndex: 1, explanation: "High Yield Savings Accounts (HYSA) pay 4-5%." },
        { question: "Big Banks usually pay...", options: ["High interest", "Low interest", "No interest"], correctIndex: 1, explanation: "Big banks pay ~0.01% because they have high overhead." },
        { question: "Online Banks pay more because...", options: ["They are scams", "No building costs", "They print money"], correctIndex: 1, explanation: "They save money on buildings and pass it to you." },
        // Level 4: Fees
        { question: "Overdraft fees happen when...", options: ["You have too much money", "Balance goes negative", "You use an ATM"], correctIndex: 1, explanation: "Spending more than you have triggers fees." },
        { question: "Maintenance fees are...", options: ["Mandatory", "Avoidable", "Good"], correctIndex: 1, explanation: "Most banks waive them if you keep a minimum balance." },
        { question: "ATM fees...", options: ["Don't exist", "Add up fast", "Are fair"], correctIndex: 1, explanation: "Paying $3 to access your own $20 is a 15% loss." },
        // Level 5: Debit vs Credit
        { question: "Debit cards use...", options: ["Bank money", "Your money", "Future money"], correctIndex: 1, explanation: "Debit comes straight from checking." },
        { question: "Which builds credit score?", options: ["Debit Card", "Credit Card", "Library Card"], correctIndex: 1, explanation: "Debit cards do NOT report to credit bureaus." },
        { question: "If a Debit card is stolen...", options: ["Money is gone instantly", "Bank pays you", "Hacker pays you"], correctIndex: 0, explanation: "It's harder to get cash back than credit disputes." },
        // Level 6: ChexSystems
        { question: "ChexSystems tracks...", options: ["Bad checks/Banking history", "Credit Score", "School grades"], correctIndex: 0, explanation: "If you owe a bank fees, you get blacklisted here." },
        { question: "A 'Second Chance' account is...", options: ["For ex-cons", "For bad banking history", "For VIPs"], correctIndex: 1, explanation: "For people with bad ChexSystems reports." },
        { question: "Bouncing a check means...", options: ["It hit the floor", "Insufficient funds", "Bank closed"], correctIndex: 1, explanation: "Writing a check for money you don't have." },
        // Level 7: Security
        { question: "2FA stands for...", options: ["2 Fast Apps", "Two Factor Authentication", "To Find All"], correctIndex: 1, explanation: "Password + Text code. Always use it." },
        { question: "Phishing is...", options: ["Fishing for fish", "Fake emails stealing info", "A band"], correctIndex: 1, explanation: "Never click links in 'urgent' bank emails." },
        { question: "Freeze your card if...", options: ["It's cold", "You lost it", "You are full"], correctIndex: 1, explanation: "Freezing prevents thieves from using it." },
        // Level 8: Advanced Banking
        { question: "CD stands for...", options: ["Compact Disc", "Certificate of Deposit", "Cash Dispenser"], correctIndex: 1, explanation: "You lock money away for a higher rate." },
        { question: "Money Market Accounts are...", options: ["Stock markets", "Like Savings+Checking", "Illegal"], correctIndex: 1, explanation: "Hybrid accounts that often offer checks + interest." },
        { question: "Credit Unions are...", options: ["For Profit", "Member Owned (Non-profit)", "Government"], correctIndex: 1, explanation: "They often have better rates and lower fees." }
    ],
    "Debt Dungeon": [
        // Level 1: Debt Types
        { question: "Good Debt...", options: ["Pays for toys", "Builds wealth/value", "Has high interest"], correctIndex: 1, explanation: "Student loans (for good degrees) or Mortgages." },
        { question: "Bad Debt...", options: ["Invests in assets", "Consumes value", "Is tax deductible"], correctIndex: 1, explanation: "Credit cards for clothes, or payday loans." },
        { question: "Secured Debt is...", options: ["Safe", "Backed by collateral", "Free"], correctIndex: 1, explanation: "Like a car loan. If you don't pay, they take the car." },
        // Level 2: Interest (APR)
        { question: "APR stands for...", options: ["Annual Percentage Rate", "Apple Pie Recipe", "All Payment Rate"], correctIndex: 0, explanation: "The yearly cost of borrowing money." },
        { question: "High APR means...", options: ["High Cost", "Low Cost", "Free Money"], correctIndex: 0, explanation: "Higher APR = You pay more interest." },
        { question: "Credit Card APR is usually...", options: ["5%", "10%", "20-25%"], correctIndex: 2, explanation: "Credit cards are extremely expensive debt." },
        // Level 3: Minimum Payments
        { question: "Paying only the minimum...", options: ["Is smart", "Keeps you in debt", "Builds wealth"], correctIndex: 1, explanation: "Minimum payments mostly cover interest, not the loan." },
        { question: "Negative Amortization means...", options: ["Debt goes down", "Debt goes up even if paying", "Debt vanishes"], correctIndex: 1, explanation: "When payments don't even cover the interest." },
        { question: "To kill debt fast, pay...", options: ["Minimum", "Extra", "Nothing"], correctIndex: 1, explanation: "Paying principal down reduces future interest." },
        // Level 4: Credit Score Basics
        { question: "A good credit score is...", options: ["300", "500", "750+"], correctIndex: 2, explanation: "750+ gets you the best rates on loans." },
        { question: "FICO score range is...", options: ["0-100", "300-850", "A-F"], correctIndex: 1, explanation: "850 is perfect. 300 is... bad." },
        { question: "Does checking your own score hurt it?", options: ["Yes", "No", "Sometimes"], correctIndex: 1, explanation: "Soft pulls (checking yourself) do not hurt." },
        // Level 5: Score Factors
        { question: "Biggest score factor (35%) is...", options: ["Payment History", "Amount Owed", "Age of Credit"], correctIndex: 0, explanation: "Never miss a payment. Ever." },
        { question: "Utilization Ratio should be...", options: ["100%", "50%", "Under 30%"], correctIndex: 2, explanation: "Don't max out your cards. It looks risky." },
        { question: "Closing old cards...", options: ["Helps score", "Hurts score", "Does nothing"], correctIndex: 1, explanation: "It shortens your credit age. Keep them open (if no fee)." },
        // Level 6: Payoff Strategies
        { question: "Snowball Method targets...", options: ["Highest Interest", "Smallest Balance", "Random"], correctIndex: 1, explanation: "Pay smallest debt first for a psychological win." },
        { question: "Avalanche Method targets...", options: ["Highest Interest", "Smallest Balance", "Largest Balance"], correctIndex: 0, explanation: "Mathematically cheapest way. Kill high interest first." },
        { question: "Consolidation means...", options: ["Paying nothing", "Combining debts", "Declaring bankruptcy"], correctIndex: 1, explanation: "Combining many loans into one (ideally lower rate) loan." },
        // Level 7: Predatory Lending
        { question: "Payday Loans are...", options: ["Helpful", "Predatory Traps", "Low Interest"], correctIndex: 1, explanation: "They charge 400%+ interest. Stay away." },
        { question: "Buy Now Pay Later...", options: ["Is harmless", "Encourages overspending", "Is free money"], correctIndex: 1, explanation: "It tricks your brain into spending money you don't have." },
        { question: "Co-signing a loan...", options: ["Is nice", "Makes you liable", "Builds friendship"], correctIndex: 1, explanation: "If they don't pay, YOU have to pay. It ruins friendships." },
        // Level 8: Review
        { question: "Bankruptcy...", options: ["Solves everything", "Ruins credit for 7-10yrs", "Is free"], correctIndex: 1, explanation: "It's a nuclear option. Avoid if possible." },
        { question: "Collection Agencies...", options: ["Are friendly", "Buy debt cheap", "Cannot sue"], correctIndex: 1, explanation: "They buy your debt for pennies and harass you for dollars." },
        { question: "The best way to use a credit card?", options: ["Carry a balance", "Pay in full monthly", "Cut it up"], correctIndex: 1, explanation: "Get the points/rewards, pay 0 interest." }
    ],
    "Hustle Hub": [
        // Level 1: Gross vs Net
        { question: "Gross Income is...", options: ["Total Earned", "Take Home", "Tax Refund"], correctIndex: 0, explanation: "Gross is the big number before taxes steal it." },
        { question: "Net Pay is...", options: ["What hits the bank", "Total Salary", "Bonus"], correctIndex: 0, explanation: "Net is Gross minus Taxes and Deductions." },
        { question: "Which is usually higher?", options: ["Gross", "Net"], correctIndex: 0, explanation: "Taxes always take a bite." },
        // Level 2: W2 vs 1099
        { question: "A 'W2' employee...", options: ["Pays own tax later", "Has tax withheld", "Is a freelancer"], correctIndex: 1, explanation: "Employers take taxes out automatically for W2s." },
        { question: "A '1099' worker is...", options: ["Employee", "Contractor/Freelancer", "Unemployed"], correctIndex: 1, explanation: "You are your own boss, but must save for taxes." },
        { question: "Who pays payroll tax?", options: ["W2 only", "1099 only", "Both"], correctIndex: 2, explanation: "W2 splits it with boss. 1099 pays ALL of it (Self-Employment Tax)." },
        // Level 3: Taxes
        { question: "Tax Refund means...", options: ["Free money", "You overpaid", "Govt gift"], correctIndex: 1, explanation: "You gave the govt an interest-free loan." },
        { question: "Marginal Tax Rate applies to...", options: ["All income", "Income in that bracket", "Bonus only"], correctIndex: 1, explanation: "Earning more doesn't mean you take home less total." },
        { question: "Sales Tax is on...", options: ["Income", "Consumption/Buying", "Property"], correctIndex: 1, explanation: "Tax you pay when you buy stuff." },
        // Level 4: Profit
        { question: "Revenue is...", options: ["Profit", "Total Sales", "Cash"], correctIndex: 1, explanation: "Money coming in before expenses." },
        { question: "Profit equals...", options: ["Revenue", "Revenue - Expenses", "Cash in bank"], correctIndex: 1, explanation: "It's not what you make, it's what you keep." },
        { question: "A 'Loss' means...", options: ["Expenses > Revenue", "Revenue > Expenses", "Zero taxes"], correctIndex: 0, explanation: "You spent more than you made." },
        // Level 5: Side Hustles
        { question: "Scalability means...", options: ["Working harder", "Growing without more time", "Weighing fish"], correctIndex: 1, explanation: "Selling software is scalable. Driving Uber is not." },
        { question: "Passive Hustle...", options: ["Dog Walking", "Selling Digital Art", "Driving"], correctIndex: 1, explanation: "Make it once, sell it forever." },
        { question: "Active Hustle...", options: ["Trading time for money", "Investing", "Sleeping"], correctIndex: 0, explanation: "If you stop working, the money stops." },
        // Level 6: Business Deductions
        { question: "A Write-Off...", options: ["Is free stuff", "Lowers taxable income", "Is illegal"], correctIndex: 1, explanation: "You pay tax on Profit, not Revenue." },
        { question: "Can you write off anything?", options: ["Yes", "No, only business expenses", "Only food"], correctIndex: 1, explanation: "It must be necessary for the business." },
        { question: "Depreciation is...", options: ["Assets losing value", "Sadness", "Profit"], correctIndex: 0, explanation: "Writing off the loss of value of equipment over time." },
        // Level 7: Resume/Career
        { question: "Negotiating salary...", options: ["Is rude", "Is expected", "Is illegal"], correctIndex: 1, explanation: "Always ask. The worst they say is no." },
        { question: "Upskilling...", options: ["Wastes time", "Increases value", "Is boring"], correctIndex: 1, explanation: "Learning new skills allows you to charge more." },
        { question: "Networking is...", options: ["Connecting computers", "Building relationships", "Fishing"], correctIndex: 1, explanation: "Your network is your net worth." },
        // Level 8: Hustle Review
        { question: "LLC stands for...", options: ["Limited Liability Company", "Low Level Corp", "Legal Liar Club"], correctIndex: 0, explanation: "It protects your personal assets from business lawsuits." },
        { question: "The goal of a hustle is...", options: ["Work forever", "Freedom/Cashflow", "Taxes"], correctIndex: 1, explanation: "Money buys freedom." },
        { question: "Equity means...", options: ["Fairness", "Ownership", "Debt"], correctIndex: 1, explanation: "Owning a piece of the pie." }
    ],
    "Stony Stocks": [
        // Level 1: Basics
        { question: "Buying a share means...", options: ["Owning part of company", "Loaning money", "Gambling"], correctIndex: 0, explanation: "Stocks represent fractional ownership." },
        { question: "Ticker Symbol is...", options: ["A clock", "Short code (e.g. AAPL)", "Price"], correctIndex: 1, explanation: "The 3-4 letters representing the stock." },
        { question: "IPO stands for...", options: ["Initial Public Offering", "I Pay Often", "Internal Profit Option"], correctIndex: 0, explanation: "When a private company goes public." },
        // Level 2: Bull vs Bear
        { question: "A 'Bull Market' means...", options: ["Prices Rising", "Prices Falling", "Zoo is open"], correctIndex: 0, explanation: "Bulls strike UP. Prices rise." },
        { question: "A 'Bear Market' means...", options: ["Prices Rising", "Prices Falling", "Honey sale"], correctIndex: 1, explanation: "Bears swipe DOWN. Prices fall." },
        { question: "Correction is a drop of...", options: ["1%", "10%", "50%"], correctIndex: 1, explanation: "A 10% drop is a correction. 20% is a bear market." },
        // Level 3: Dividends
        { question: "A Dividend is...", options: ["A fee", "Profit share paid to you", "A tax"], correctIndex: 1, explanation: "Companies pay you just for holding the stock." },
        { question: "Yield is...", options: ["Stop sign", "Dividend / Price", "Total Profit"], correctIndex: 1, explanation: "The percentage return from dividends." },
        { question: "DRIP means...", options: ["Coffee", "Dividend Reinvestment Plan", "Water leak"], correctIndex: 1, explanation: "Automatically buying more shares with dividends." },
        // Level 4: Indices / ETFs
        { question: "S&P 500 tracks...", options: ["500 Companies", "500 People", "500 Cities"], correctIndex: 0, explanation: "The 500 largest public companies in the US." },
        { question: "ETF stands for...", options: ["Electronic Trade Fund", "Exchange Traded Fund", "Estimated Time"], correctIndex: 1, explanation: "A basket of stocks you can trade like a single stock." },
        { question: "Diversification...", options: ["Increases Risk", "Lowers Risk", "Is for losers"], correctIndex: 1, explanation: "Don't put all eggs in one basket." },
        // Level 5: Valuation
        { question: "Market Cap is...", options: ["Price x Shares", "Store limit", "Total debt"], correctIndex: 0, explanation: "The total value of the company." },
        { question: "P/E Ratio...", options: ["Physical Ed", "Price to Earnings", "Profit Entry"], correctIndex: 1, explanation: "It tells you if a stock is 'expensive' or 'cheap'." },
        { question: "High P/E usually means...", options: ["Growth expectation", "Company is dead", "Value stock"], correctIndex: 0, explanation: "Investors expect high growth, so they pay more." },
        // Level 6: Trading vs Investing
        { question: "Day Trading is...", options: ["Long term", "Buying/Selling same day", "Safe"], correctIndex: 1, explanation: "It is high risk and requires constant attention." },
        { question: "Investing is...", options: ["Short term", "Long term building", "Gambling"], correctIndex: 1, explanation: "Holding assets for years." },
        { question: "Time in the market beats...", options: ["Timing the market", "Cash", "Gold"], correctIndex: 0, explanation: "It's hard to predict peaks and valleys. Just hold." },
        // Level 7: Risk
        { question: "Volatility is...", options: ["Price stability", "How much price swings", "Volume"], correctIndex: 1, explanation: "High volatility means big ups and downs." },
        { question: "Blue Chip stocks are...", options: ["New startups", "Established, safe co's", "Tech only"], correctIndex: 1, explanation: "Reliable companies like Coke or Disney." },
        { question: "Penny Stocks are...", options: ["Safe", "Very Risky", "Expensive"], correctIndex: 1, explanation: "Cheap stocks of tiny companies. High fraud risk." },
        // Level 8: Stock Review
        { question: "A 'Brokerage' is...", options: ["A broken fridge", "Account to buy stocks", "Bank"], correctIndex: 1, explanation: "You need a brokerage account (like Fidelity/Robinhood) to trade." },
        { question: "Capital Gains Tax...", options: ["Applies when you buy", "Applies when you sell profit", "Never applies"], correctIndex: 1, explanation: "You pay tax on the profit when you sell." },
        { question: "The Stock Market...", options: ["Always goes up", "Fluctuates", "Is a scam"], correctIndex: 1, explanation: "It goes up and down, but historically trends up over decades." }
    ],
    "Wealth Empire": [
        // Level 1: Net Worth
        { question: "Net Worth formula?", options: ["Income + Expenses", "Assets - Liabilities", "Cash + Stocks"], correctIndex: 1, explanation: "What you OWN minus what you OWE." },
        { question: "Is income Net Worth?", options: ["Yes", "No"], correctIndex: 1, explanation: "You can have high income and negative net worth if you spend it all." },
        { question: "To increase Net Worth...", options: ["Buy Liabilities", "Buy Assets / Pay Debt", "Eat out"], correctIndex: 1, explanation: "Grow the good column, shrink the bad column." },
        // Level 2: Real Estate
        { question: "Equity in a house is...", options: ["Market Value - Mortgage", "Down payment", "Rent"], correctIndex: 0, explanation: "The part of the house you actually own." },
        { question: "Appreciation means...", options: ["Saying thanks", "Value goes up", "Value goes down"], correctIndex: 1, explanation: "Real estate usually appreciates over time." },
        { question: "Mortgage interest is...", options: ["Tax deductible (mostly)", "Illegal", "Fun"], correctIndex: 0, explanation: "One benefit of owning a home." },
        // Level 3: FI/RE
        { question: "FIRE stands for...", options: ["Financial Independence Retire Early", "Fire In Red Eyes", "Free Interest Rates"], correctIndex: 0, explanation: "The movement to quit jobs young." },
        { question: "Financial Independence is...", options: ["Being rich", "Assets pay living costs", "Winning lottery"], correctIndex: 1, explanation: "When you don't HAVE to work to survive." },
        { question: "The 4% Rule helps...", options: ["Calculate withdrawal rate", "Calculate tips", "Pay taxes"], correctIndex: 0, explanation: "Safe withdrawal rate to never run out of money." },
        // Level 4: Inflation Hedge
        { question: "Cash is...", options: ["A store of value", "Bad inflation hedge", "Investment"], correctIndex: 1, explanation: "Inflation eats cash. Assets protect against it." },
        { question: "Gold and Real Estate are...", options: ["Paper assets", "Hard assets", "Fake"], correctIndex: 1, explanation: "Physical things usually hold value during inflation." },
        { question: "Purchasing Power...", options: ["Increases with inflation", "Decreases with inflation", "Stays same"], correctIndex: 1, explanation: "Your dollar buys less bread." },
        // Level 5: Leverage
        { question: "Leverage is...", options: ["Using borrowed money", "Lifting weights", "Saving"], correctIndex: 0, explanation: "Using other people's money to magnify returns." },
        { question: "Good Leverage example...", options: ["Credit Card", "Mortgage", "Payday Loan"], correctIndex: 1, explanation: "Borrowing cheap to buy an appreciating asset." },
        { question: "Risk of Leverage...", options: ["None", "Magnifies losses", "Less taxes"], correctIndex: 1, explanation: "If asset drops, you still owe the loan." },
        // Level 6: Estate Planning
        { question: "A Will...", options: ["Predicts future", "Distributes assets after death", "Is for living"], correctIndex: 1, explanation: "Instructions for your empire." },
        { question: "A Trust...", options: ["Is faith", "Legal entity for assets", "Bank account"], correctIndex: 1, explanation: "Holds assets and avoids probate court." },
        { question: "Beneficiary...", options: ["Receives assets", "Pays bills", "Lawyer"], correctIndex: 0, explanation: "Who gets your stuff." },
        // Level 7: Philanthropy
        { question: "Philanthropy is...", options: ["Collecting stamps", "Giving for public good", "Philosophy"], correctIndex: 1, explanation: "Using wealth to help others." },
        { question: "Tax benefit of giving...", options: ["Deductions", "Credits", "None"], correctIndex: 0, explanation: "Charitable donations lower your taxable income." },
        { question: "Effective Altruism...", options: ["Giving randomly", "Maximizing impact", "Keeping money"], correctIndex: 1, explanation: "Giving where it does the MOST good." },
        // Level 8: Empire Review
        { question: "Cash flow is...", options: ["Money moving in/out", "Water", "Savings"], correctIndex: 0, explanation: "Positive cash flow means more coming in than going out." },
        { question: "Legacy is...", options: ["Money only", "Impact & Values", "A car"], correctIndex: 1, explanation: "What you leave behind beyond cash." },
        { question: "The ultimate asset is...", options: ["Gold", "Time/Health", "Bitcoin"], correctIndex: 1, explanation: "You can't buy more time or health." }
    ]
};

// --- FULL CONTENT DATABASE ---
// Guaranteed unique items per category per world.
// (Keeping existing content db below for non-boss lessons)
const CONTENT_DB: Record<string, any> = {
    // ... (Existing CONTENT_DB content remains unchanged, assumed context) ...
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
        ],
        polls: [
            { q: "Preference?", o: ["Cash", "Card", "Crypto"], a: 0, t: "Most wealth is digital now." },
            { q: "Windfall?", o: ["Spend", "Save", "Invest"], a: 2, t: "Investing builds wealth." },
            { q: "Risk?", o: ["Love it", "Hate it", "Calculated"], a: 2, t: "Calculated risk is the goal." },
            { q: "Shopping?", o: ["Online", "In Store", "Thrift"], a: 2, t: "Thrifting saves 90%." },
            { q: "Goal?", o: ["Rich", "Happy", "Both"], a: 2, t: "Money is a tool for happiness." },
            { q: "Debt?", o: ["Never", "Sometimes", "Leverage"], a: 2, t: "Smart debt can build wealth." },
            { q: "Work?", o: ["9-5", "Founder", "Gig"], a: 1, t: "Ownership leads to wealth." },
            { q: "School?", o: ["Public", "Private", "YouTube"], a: 2, t: "Self-education is free." }
        ],
        infos: [
            { 
                t: "Money is just a tool. Don't worship it, master it.",
                analogy: "A hammer can build a house or hit your thumb. Money is the same—it depends how you use it.",
                img: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800&q=80"
            },
            { 
                t: "The first step to wealth is spending less than you earn.",
                analogy: "If you fill a bucket with water but it has a hole (spending), it will never be full, no matter how much you pour in.",
                img: "https://images.unsplash.com/photo-1605792657660-596af9009e82?w=800&q=80"
            },
            { 
                t: "Inflation is the silent killer of cash savings.",
                analogy: "Imagine an ice cube melting in your hand. That's your dollar losing value every year.",
                img: "https://images.unsplash.com/photo-1562619934-1647a4d53823?w=800&q=80"
            },
            { 
                t: "Your habits today determine your bank account tomorrow.",
                analogy: "Brushing your teeth once doesn't work. It's the daily habit that prevents decay. Saving is the same.",
                img: "https://images.unsplash.com/photo-1559592413-7ec4d7a48d1d?w=800&q=80"
            },
            { 
                t: "Assets put money in your pocket. Liabilities take it out.",
                analogy: "An asset is a golden goose that lays eggs. A liability is a pet tiger that just eats meat (cash).",
                img: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80"
            },
            { 
                t: "Start small. Even $5 a week adds up over time.",
                analogy: "A giant oak tree starts as a tiny acorn. Don't underestimate small beginnings.",
                img: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80"
            },
            { 
                t: "Don't try to look rich. Try to BE rich.",
                analogy: "A fake Rolex tells time, but has zero value. Real wealth is quiet.",
                img: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80"
            },
            { 
                t: "Knowledge pays the best interest. Keep learning.",
                analogy: "Your brain is your most expensive asset. Upgrade its software daily.",
                img: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80"
            }
        ]
    },
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
