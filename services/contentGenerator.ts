
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

// NEW: Massive Question Database for Boss Battles
const BOSS_QUESTIONS_DB: Record<string, Array<{ q: string, o: string[], a: number, e: string }>> = {
    world1: [ // Basics
        { q: "You find $20 on the street. What's the move?", o: ["Buy V-Bucks instantly", "Save it (Free W)", "Burn it for clout"], a: 1, e: "Found money is a blessing. Don't fumble the bag." },
        { q: "The ATM wants a $5 fee. You...", o: ["Pay it (I'm lazy)", "Walk to my bank (Free)", "Cry"], a: 1, e: "ATM fees are literal scams. Walk 2 blocks." },
        { q: "Inflation makes your money worth...", o: ["More", "Less", "The same"], a: 1, e: "Prices go up, money value goes down. It's the silent tax." },
        { q: "What is 'Fiat' money?", o: ["A fast Italian car", "Govt-backed paper", "Fake crypto"], a: 1, e: "Fiat is money backed by 'trust me bro' from the govt." },
        { q: "Why do banks pay you interest?", o: ["They love you", "To borrow your cash", "It's a glitch"], a: 1, e: "They lend your money out at 7% and pay you 0.01%. Rud." },
        { q: "A 'Need' is essential. Like:", o: ["Food & Shelter", "Netflix & Chill", "Gucci Slides"], a: 0, e: "You can survive without Netflix (barely)." },
        { q: "Which loses value over time?", o: ["Gold", "Cash under mattress", "Real Estate"], a: 1, e: "Inflation eats cash. Invest it or lose it." },
        { q: "Gross Income is:", o: ["Money before taxes", "Disgusting money", "What you keep"], a: 0, e: "Gross is the total. Net is what hits your bank." },
        { q: "Bartering means:", o: ["Trading goods directly", "Stealing", "Buying online"], a: 0, e: "Swapping a skin for a battle pass is bartering." },
        { q: "If supply is low and demand is high, price goes...", o: ["Down", "Up", "Sideways"], a: 1, e: "Basic Econ. Rare stuff costs more." },
        { q: "The 'Opportunity Cost' of studying is:", o: ["Getting smarter", "Missing the party", "Zero"], a: 1, e: "It's what you give up to do something else." },
        { q: "Deflation means prices are:", o: ["Going up", "Going down", "Staying flat"], a: 1, e: "Sounds good, but usually means the economy is crashing." },
        { q: "Liquid Assets are:", o: ["Water bottles", "Cash/Easy to sell stuff", "Frozen houses"], a: 1, e: "Liquidity = how fast you can buy tacos with it." },
        { q: "The main function of money is:", o: ["To look cool", "Medium of exchange", "To eat"], a: 1, e: "It helps us trade without carrying goats around." },
        { q: "Scarcity means:", o: ["Unlimited resources", "Not enough for everyone", "Scary city"], a: 1, e: "Things have value because they are limited." }
    ],
    world2: [ // Budgeting
        { q: "The 50/30/20 rule says 50% goes to:", o: ["Wants", "Needs", "Savings"], a: 1, e: "50% Needs, 30% Fun, 20% Future You." },
        { q: "Spending $5/day on coffee is approx:", o: ["$150/month", "$50/month", "$10/month"], a: 0, e: "That's $1,800 a year! Make it at home." },
        { q: "A budget is:", o: ["A punishment", "A plan for your money", "For poor people"], a: 1, e: "A budget tells your money where to go instead of wondering where it went." },
        { q: "Impulse buying is:", o: ["Buying without thinking", "Strategic investing", "Buying needs"], a: 0, e: "Wait 24 hours before buying. The urge usually fades." },
        { q: "Which is a 'Fixed Expense'?", o: ["Groceries", "Rent", "Movie Tickets"], a: 1, e: "Fixed means same price every month. Like rent or Spotify." },
        { q: "Emergency fund size should be:", o: ["$20", "3-6 months expenses", "Zero"], a: 1, e: "Enough to survive a zombie apocalypse (or job loss)." },
        { q: "Tracking expenses helps you:", o: ["Feel guilty", "See leaks in wallet", "Waste time"], a: 1, e: "You can't fix what you don't track." },
        { q: "The 'Envelope Method' uses:", o: ["Email", "Cash categories", "Stamps"], a: 1, e: "Cash in envelopes. When it's gone, you stop spending." },
        { q: "Zero-Based Budgeting means:", o: ["You have $0", "Every dollar has a job", "Spending nothing"], a: 1, e: "Income minus Expenses equals Zero. Assign every dollar." },
        { q: "Pay Yourself First means:", o: ["Buy clothes first", "Save before spending", "Eat lunch first"], a: 1, e: "Transfer to savings on payday, spend the rest." },
        { q: "Lifestyle Creep is:", o: ["Walking slowly", "Spending more as you earn more", "A weird neighbor"], a: 1, e: "Avoid it. If you get a raise, save the difference." },
        { q: "A 'Want' becomes a 'Need' when:", o: ["You really want it", "It keeps you alive", "Never"], a: 1, e: "Don't gaslight yourself. New Jordans are a WANT." },
        { q: "Variable expenses:", o: ["Stay the same", "Change every month", "Are illegal"], a: 1, e: "Groceries, gas, entertainment. Harder to predict." },
        { q: "Sinking Funds are for:", o: ["Boats", "Saving for big purchases", "Losing money"], a: 1, e: "Saving a little each month for a big future bill." },
        { q: "The 'Latte Factor' refers to:", o: ["Coffee prices", "Small habits adding up", "Milk allergies"], a: 1, e: "Small daily spends wreck your wealth over time." }
    ],
    world3: [ // Compound Interest
        { q: "Compound interest is:", o: ["Interest on interest", "Simple addition", "A bank fee"], a: 0, e: "Money having babies, and those babies having babies." },
        { q: "The biggest factor in compounding is:", o: ["Money amount", "Time", "Luck"], a: 1, e: "Start young. Time does the heavy lifting." },
        { q: "Rule of 72 calculates:", o: ["Retirement age", "Years to double money", "Tax rate"], a: 1, e: "72 divided by interest rate = years to double." },
        { q: "APR stands for:", o: ["Annual Percentage Rate", "Apple Pear Rice", "All People Rich"], a: 0, e: "The yearly cost of borrowing or earning." },
        { q: "Who gets richer?", o: ["Invests at 20", "Invests at 40", "Plays Lotto"], a: 0, e: "The 20-year-old wins by a landslide due to time." },
        { q: "Is high interest good?", o: ["Yes for savings, No for debt", "Always Yes", "Always No"], a: 0, e: "You want high returns on assets, low rates on loans." },
        { q: "A High Yield Savings Account (HYSA) pays:", o: ["0.01%", "4-5%", "50%"], a: 1, e: "Regular banks pay dust. HYSAs actually pay you." },
        { q: "Inflation vs Investing:", o: ["Inflation wins", "Investing beats inflation", "Same thing"], a: 1, e: "If you don't invest, inflation eats your cash." },
        { q: "Albert Einstein called Compound Interest:", o: ["Boring", "The 8th Wonder of the World", "A scam"], a: 1, e: "He who understands it, earns it. He who doesn't, pays it." },
        { q: "Simple Interest is calculated on:", o: ["Principal only", "Principal + Interest", "Your credit score"], a: 0, e: "Simple interest doesn't grow as fast as compound." },
        { q: "Exponential Growth looks like:", o: ["A straight line", "A hockey stick curve", "A circle"], a: 1, e: "Starts slow, then explodes upwards." },
        { q: "To maximize compounding, you should:", o: ["Withdraw often", "Reinvest dividends", "Panic sell"], a: 1, e: "Keep the money in the pot to keep it growing." },
        { q: "APY (Annual Percentage Yield) includes:", o: ["Compounding frequency", "Just the rate", "Hidden fees"], a: 0, e: "APY is the real number you earn per year." },
        { q: "The 'Snowball Effect' in investing refers to:", o: ["Cold cash", "Momentum building up", "Freezing assets"], a: 1, e: "Small gains build on each other to become massive." },
        { q: "Does debt compound?", o: ["No", "Yes, against you", "Only on Tuesdays"], a: 1, e: "Yes! Unpaid interest gets added to the balance. Dangerous." }
    ],
    world4: [ // Banking
        { q: "FDIC Insurance covers up to:", o: ["$1,000", "$250,000", "$1 Million"], a: 1, e: "If the bank fails, the govt covers you up to $250k." },
        { q: "Overdraft Fees happen when:", o: ["You spend $0", "You spend more than you have", "You save too much"], a: 1, e: "Banks charge you $35 for being broke. Turn off overdraft protection!" },
        { q: "Checking accounts are for:", o: ["Long term savings", "Daily spending", "Crypto trading"], a: 1, e: "Checking is a revolving door. Savings is a vault." },
        { q: "A Routing Number identifies:", o: ["You", "Your Bank", "Your Password"], a: 1, e: "Like an address for your bank." },
        { q: "Direct Deposit means:", o: ["Paycheck goes straight to bank", "Walking to bank", "Mailing cash"], a: 0, e: "It's faster, safer, and usually waives fees." },
        { q: "Should you share your PIN?", o: ["With BFFs", "Never", "With Mom"], a: 1, e: "Never. Not even with the bank staff." },
        { q: "Credit Unions are:", o: ["For-profit", "Non-profit member owned", "Govt agency"], a: 1, e: "They usually have lower fees and better service than big banks." },
        { q: "A CD (Certificate of Deposit) locks money for:", o: ["Higher interest", "Lower interest", "Fun"], a: 0, e: "You trade access for a better rate." },
        { q: "Minimum Balance Fees are:", o: ["Rewards", "Penalties for being poor", "Optional"], a: 1, e: "Avoid banks that charge you for having low balances." },
        { q: "Two-Factor Auth (2FA) is:", o: ["Annoying", "Essential security", "Double spending"], a: 1, e: "Always enable 2FA to stop hackers." },
        { q: "Phishing is:", o: ["Catching fish", "Fake emails stealing info", "A band"], a: 1, e: "Don't click sus links claiming your account is locked." },
        { q: "ATM Skimmers are:", o: ["Card readers that steal data", "People who skim milk", "Fast ATMs"], a: 0, e: "Wiggle the card reader before using an ATM." },
        { q: "Peer-to-Peer (P2P) payments are like:", o: ["Cash App/Venmo", "Writing a check", "Wire transfer"], a: 0, e: "Instant transfers between friends." },
        { q: "Can you negotiate bank fees?", o: ["No, never", "Yes, often", "Only if rich"], a: 1, e: "Call them. They often waive fees if you ask nicely." },
        { q: "Unbanked means:", o: ["Having no bank account", "Hating banks", "Bank closed"], a: 0, e: "Relying on cash/check cashing places is expensive." }
    ],
    world5: [ // Debt
        { q: "Good Debt vs Bad Debt:", o: ["All debt is bad", "Mortgage (Good) vs Credit Card (Bad)", "Credit Card (Good)"], a: 1, e: "Debt that buys assets (house) is okay. Debt for shoes is bad." },
        { q: "If you miss a payment, credit score:", o: ["Goes up", "Goes down", "Stays same"], a: 1, e: "Payment history is 35% of your score. Don't miss it." },
        { q: "The 'Principal' is:", o: ["School boss", "Original loan amount", "Interest"], a: 1, e: "You pay interest on the principal." },
        { q: "Payday Loans are:", o: ["Helpful", "Scams (300%+ APR)", "Govt grants"], a: 1, e: "Legal loan sharking. Avoid at all costs." },
        { q: "Paying only the Minimum Balance:", o: ["Is smart", "Keeps you in debt forever", "Boosts score"], a: 1, e: "You mostly pay interest, barely touching the debt." },
        { q: "A Cosigner is:", o: ["A witness", "Responsible if you don't pay", "A friend"], a: 1, e: "Never cosign unless you are ready to pay the whole debt." },
        { q: "Bankruptcy stays on report for:", o: ["1 year", "7-10 years", "Forever"], a: 1, e: "It's the financial nuclear option." },
        { q: "The Snowball Method:", o: ["Pay smallest debt first", "Pay highest interest first", "Ignore debt"], a: 0, e: "Psychological wins help you keep going." },
        { q: "The Avalanche Method:", o: ["Pay smallest debt first", "Pay highest interest first", "Buy snow"], a: 1, e: "Mathematically cheapest way to pay off debt." },
        { q: "Credit Utilization should be below:", o: ["100%", "30%", "0%"], a: 1, e: "Don't max out your cards. It hurts your score." },
        { q: "Predatory Lending targets:", o: ["Rich people", "Desperate people", "Banks"], a: 1, e: "They trick you with hidden fees and insane rates." },
        { q: "Student Loans are:", o: ["Free money", "Debt that doesn't go away", "Scholarships"], a: 1, e: "Even bankruptcy rarely clears student loans." },
        { q: "Secured Credit Card:", o: ["Requires a deposit", "Is free", "Has no limit"], a: 0, e: "Great way to build credit if you have none." },
        { q: "Hard Inquiry vs Soft Inquiry:", o: ["Hard hurts score", "Soft hurts score", "Both same"], a: 0, e: "Applying for credit (Hard) dips score temporarily." },
        { q: "Debt-to-Income Ratio (DTI):", o: ["How much you owe vs earn", "Social score", "Tax rate"], a: 0, e: "Banks check this before giving you a mortgage." }
    ],
    world6: [ // Income
        { q: "Net Income is:", o: ["Gross - Taxes", "Gross + Bonus", "Total Salary"], a: 0, e: "Net is what actually hits your bank account." },
        { q: "W-2 form is for:", o: ["Employees", "Freelancers", "Stocks"], a: 0, e: "Standard employees get W-2s. Taxes usually withheld." },
        { q: "1099 form is for:", o: ["Employees", "Freelancers/Gig Work", "Lottery"], a: 1, e: "You gotta pay your own taxes on 1099 income!" },
        { q: "Income Tax pays for:", o: ["Roads & Military", "Netflix", "Amazon"], a: 0, e: "It funds public services (and politicians)." },
        { q: "A Tax Refund means:", o: ["Free money", "You overpaid the govt", "Bonus"], a: 1, e: "You gave the govt an interest-free loan all year." },
        { q: "Passive Income is:", o: ["Working hard", "Money earned while sleeping", "Lottery"], a: 1, e: "Assets paying you without daily work." },
        { q: "Active Income is:", o: ["Trading time for money", "Dividends", "Rent checks"], a: 0, e: "If you stop working, the money stops." },
        { q: "Progressive Tax System:", o: ["Everyone pays same", "Earn more = Pay higher %", "Earn more = Pay less"], a: 1, e: "Rich people (theoretically) pay a higher rate." },
        { q: "FICA taxes fund:", o: ["Social Security & Medicare", "NASA", "Schools"], a: 0, e: "For old people (future you)." },
        { q: "Sales Tax is paid:", o: ["On income", "At the register", "Yearly"], a: 1, e: "Consumption tax on stuff you buy." },
        { q: "Capital Gains Tax is on:", o: ["Salary", "Profit from selling assets", "Gifts"], a: 1, e: "Selling stocks or houses for profit." },
        { q: "Gig Economy jobs (Uber) are:", o: ["Stable", "Flexible but no benefits", "Passive"], a: 1, e: "You are your own boss, but also your own HR." },
        { q: "Salary Negotiation:", o: ["Is rude", "Is expected", "Is illegal"], a: 1, e: "Always negotiate. The first offer is rarely the best." },
        { q: "Direct Deposit:", o: ["Safety hazard", "Convenient & Fast", "Expensive"], a: 1, e: "Required for most jobs now." },
        { q: "Gross Pay looks:", o: ["Smaller than Net", "Bigger than Net", "Same"], a: 1, e: "Gross is the big number before the govt takes a bite." }
    ],
    world7: [ // Investing
        { q: "A Stock represents:", o: ["A loan", "Ownership share", "A product"], a: 1, e: "You own a tiny piece of the company." },
        { q: "Diversification means:", o: ["YOLO into one stock", "Don't put eggs in one basket", "Saving cash"], a: 1, e: "Spread risk. If one crashes, others might survive." },
        { q: "Bull Market means:", o: ["Prices going Up", "Prices going Down", "Animals allowed"], a: 0, e: "Bull horns go up. Optimism." },
        { q: "Bear Market means:", o: ["Prices going Up", "Prices going Down", "Camping trip"], a: 1, e: "Bear claws swipe down. Pessimism." },
        { q: "S&P 500 is:", o: ["A race car", "Top 500 US Companies", "A crypto coin"], a: 1, e: "Buying the whole haystack instead of finding the needle." },
        { q: "Dividends are:", o: ["Fees", "Profit payouts", "Taxes"], a: 1, e: "Thank you money for holding the stock." },
        { q: "Buy Low, Sell...", o: ["Lower", "High", "Never"], a: 1, e: "The golden rule of trading." },
        { q: "FOMO investing leads to:", o: ["Wealth", "Buying at the top", "Happiness"], a: 1, e: "Fear Of Missing Out makes you the exit liquidity." },
        { q: "Volatility is:", o: ["Price stability", "Wild price swings", "Volume"], a: 1, e: "How bumpy the ride is." },
        { q: "A Bond is:", o: ["James Bond", "Loan to govt/company", "A stock"], a: 1, e: "You lend money, they pay interest." },
        { q: "Market Cap is:", o: ["Total value of company", "A hat", "Max price"], a: 0, e: "Share Price x Number of Shares." },
        { q: "IPO stands for:", o: ["Initial Public Offering", "I Pay Often", "International Police"], a: 0, e: "When a company first sells stock to the public." },
        { q: "ETF (Exchange Traded Fund):", o: ["Basket of stocks", "Electronic Transfer", "Alien"], a: 0, e: "Like a mutual fund but trades like a stock." },
        { q: "Risk vs Reward:", o: ["Higher risk = Higher potential return", "No correlation", "Risk is bad"], a: 0, e: "You get paid for taking risks (smart ones)." },
        { q: "Diamond Hands 💎🙌:", o: ["Holding through drops", "Selling quickly", "Wearing jewelry"], a: 0, e: "Not panicking when the line goes down." }
    ],
    world8: [ // Wealth
        { q: "Assets vs Liabilities:", o: ["Assets take money", "Assets make money", "Same thing"], a: 1, e: "Rich people collect assets. Poor collect liabilities." },
        { q: "Roth IRA benefit:", o: ["Tax-free growth", "Free money", "No limits"], a: 0, e: "Pay tax now, zero tax when you retire." },
        { q: "Net Worth = ", o: ["Income + Expenses", "Assets - Liabilities", "Cash only"], a: 1, e: "The real scoreboard of wealth." },
        { q: "The 4% Rule:", o: ["Tipping amount", "Safe withdrawal rate", "Interest rate"], a: 1, e: "Don't spend more than 4% of portfolio to last forever." },
        { q: "Inflation Hedge:", o: ["Cash", "Assets like Gold/Real Estate", "Savings account"], a: 1, e: "Something that rises in value when dollar drops." },
        { q: "Depreciation:", o: ["Value goes up", "Value goes down", "Depression"], a: 1, e: "Cars depreciate. Houses usually appreciate." },
        { q: "Appreciation:", o: ["Saying thanks", "Value goes up", "Value goes down"], a: 1, e: "Real estate and stocks usually appreciate." },
        { q: "Liquid Net Worth:", o: ["Boats", "Cash/Stocks you can sell fast", "House value"], a: 1, e: "Net worth you can actually spend today." },
        { q: "Estate Planning:", o: ["Building a mansion", "Will & Trust", "Gardening"], a: 1, e: "Deciding who gets your stuff when you die." },
        { q: "Financial Independence (FI):", o: ["Being rich", "Work is optional", "Turning 18"], a: 1, e: "Assets cover your living expenses." },
        { q: "FIRE Movement:", o: ["Arson", "Financial Independence Retire Early", "Hot sauce"], a: 1, e: "Saving aggressively to quit jobs young." },
        { q: "Lifestyle Inflation:", o: ["Getting fat", "Spending raises immediately", "Exercise"], a: 1, e: "The enemy of wealth. Keep living cheap." },
        { q: "Generational Wealth:", o: ["Passing assets to kids", "Winning lotto", "Spending it all"], a: 0, e: "Building something that lasts beyond you." },
        { q: "Umbrella Insurance:", o: ["For rain", "Extra liability protection", "Beach gear"], a: 1, e: "Protects rich people from lawsuits." },
        { q: "Arbitrage:", o: ["Buying low here, selling high there", "Stealing", "Art"], a: 0, e: "Profiting from price differences." }
    ]
};

// EXPANDED SCENARIOS (For Swipe Lessons)
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
    { text: "Unsubscribing from marketing emails", isRight: true, label: "Focus" }
];

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
// These are exact matches from the "Gold Standard" JSON
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
    "world1_l1_les1": {
        type: 'tap_lie',
        title: "Tap the LIE",
        content: { statements: [
            { text: "Money grows on trees", isLie: true },
            { text: "Inflation exists", isLie: false },
            { text: "Savings matter", isLie: false }
        ]}
    },
    "world1_l1_les2": {
        type: 'meme',
        title: "Drake on Money",
        content: {
            imageUrl: "https://i.imgflip.com/30b1gx.jpg",
            topText: "REJECTING SAVINGS",
            bottomText: "CHASING TIKTOK TRENDS",
            explanation: "Save first, scroll second."
        }
    },
    "world1_l1_les3": {
        type: 'calculator',
        title: "$10 Allowance Magic",
        content: {
            label: "$10/month at 8% from age 14 → 18",
            formula: "auto",
            resultLabel: "$720 from lunch money. Start now."
        }
    },
    "world1_l1_les4": {
        type: 'info',
        title: "Inflation Sneak Attack",
        content: { text: "Your $10 boba was $5 in 2020. That’s **Inflation** eating your allowance 🥷" }
    },

    // World 1 Level 2
    "world1_l2_les0": {
        type: 'swipe',
        title: "School Lunch or Skin?",
        content: { cards: [
            { text: "Buying a Skin instead of lunch", isRight: false, label: "Hungry" },
            { text: "Eating real food", isRight: true, label: "Fuel" }
        ]}
    },
    
    // World 2 Level 1
    "world2_l1_les0": {
        type: 'drag_drop',
        title: "50/30/20 Buckets",
        content: {
            buckets: ["Needs", "Wants", "Savings"],
            items: [
                { id: "r1", text: "Rent", category: "Needs" },
                { id: "r2", text: "Stanley Cup", category: "Wants" },
                { id: "r3", text: "Netflix", category: "Wants" },
                { id: "r4", text: "Emergency Fund", category: "Savings" }
            ]
        }
    },

    // World 5 Level 1
    "world5_l1_les0": {
        type: 'meme',
        title: "Klarna Trap",
        content: {
            imageUrl: "https://i.imgflip.com/1g8my4.jpg",
            topText: "KLARNA 0% INTEREST",
            bottomText: "29% AFTER 4 PAYMENTS",
            explanation: "That’s not shopping, that’s a subscription to regret 💀"
        }
    },
    
    // World 7 Level 1
    "world7_l1_les0": {
        type: 'swipe',
        title: "Stocks or Savings?",
        content: { cards: [
            { text: "Savings Account (0.01%)", isRight: false, label: "Slow" },
            { text: "S&P 500 (10% avg)", isRight: true, label: "Fast" },
            { text: "Copying smart kids", isRight: true, label: "A+" }
        ]}
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
    
    // Deterministic shuffle based on seed
    const shuffledTypes = [...lessonTypes].sort(() => 0.5 - rng.next());

    for (let i = 0; i < 6; i++) {
        const lessonId = `${levelId}_les${i}`;
        
        // CHECK FOR OVERRIDE FIRST
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

        // PROCEDURAL FALLBACK
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
                { text: "Emergency funds are essential", isLie: false }
            ];
            return { statements: rng.pickSubset(liePool, 5) };
        case 'drag_drop':
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
                { id: 's15', text: "Roth IRA", category: "Savings" }
            ];
            return { 
                buckets: ['Needs', 'Wants', 'Savings'],
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
