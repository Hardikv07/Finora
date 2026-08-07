/**
 * =======================================================
 *  FINORA — Full Database Seed Script (500+ Entries)
 *  Populates: Wallets (4), Transactions (550+), Budgets (7),
 *             Goals (6), Bills (10), Investments (8), Loans (3), Recurring (8)
 *  Target user: hp486727@gmail.com
 * 
 *  NOTE: Uses direct DB inserts to bypass Mongoose hooks
 *  so that seeding is ultra-fast and handles large datasets.
 * =======================================================
 */

global.crypto = require("crypto");
require("dotenv").config();
const mongoose = require("mongoose");

// Models
const User        = require("./backend/models/user");
const Wallet      = require("./backend/models/wallet");
const Transaction = require("./backend/models/transaction");
const Budget      = require("./backend/models/budget");
const Goal        = require("./backend/models/goal");
const Bill        = require("./backend/models/bill");
const Investment  = require("./backend/models/investment");
const Loan        = require("./backend/models/loan");
const Recurring   = require("./backend/models/recurring");

// ─── Helpers ───────────────────────────────────────────
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysAgoMax) {
    const now = new Date();
    const past = new Date(now);
    past.setDate(now.getDate() - daysAgoMax);
    return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function futureDate(daysAhead) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d;
}

function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Realistic Data Pools for 500+ RAG Testing ────────
const EXPENSE_MAP = {
    "Food & Dining": {
        merchants: ["Swiggy", "Zomato", "Dominos", "Starbucks", "Haldiram's", "Pizza Hut", "McDonald's", "Barbeque Nation", "Burger King", "KFC", "Blue Tokai", "SubWay", "Chaayos", "Baskin Robbins", "Dunkin Donuts"],
        range: [80, 2800],
        subs: ["Restaurant", "Fast Food", "Coffee", "Delivery", "Bakery", "Fine Dining"]
    },
    "Groceries": {
        merchants: ["BigBasket", "Blinkit", "D-Mart", "Reliance Fresh", "JioMart", "Zepto", "Nature's Basket", "More Supermarket", "Instamart"],
        range: [120, 5200],
        subs: ["Vegetables", "Dairy", "Fruits", "Snacks", "Organic", "Household Essentials"]
    },
    "Transport": {
        merchants: ["Ola", "Uber", "Rapido", "IRCTC", "Indian Oil", "HP Petrol Pump", "Bharat Petroleum", "Metro Card Recharge", "Shell Fuel", "Fastag Recharge", "Indigo Airlines", "MakeMyTrip Flights"],
        range: [40, 6500],
        subs: ["Cab", "Fuel", "Metro", "Train", "Flight", "Toll", "Parking"]
    },
    "Rent": {
        merchants: ["Landlord - Flat Rent", "PG Accommodation", "Society Maintenance Fee"],
        range: [8000, 25000],
        subs: ["Monthly Rent", "Maintenance", "Deposit"]
    },
    "Utilities": {
        merchants: ["Tata Power", "Mahanagar Gas", "Jio Fiber", "Airtel Broadband", "BSES Rajdhani", "Adani Electricity", "Delhi Jal Board", "Vi Postpaid", "Tata Play DTH"],
        range: [199, 4200],
        subs: ["Electricity", "Gas", "Internet", "Water", "DTH", "Postpaid Mobile"]
    },
    "Entertainment": {
        merchants: ["Netflix", "Spotify", "BookMyShow", "Amazon Prime", "Disney+ Hotstar", "PVR Cinemas", "Steam", "SonyLIV", "YouTube Premium", "Gaming Zone", "Concert Tickets"],
        range: [99, 2500],
        subs: ["Streaming", "Movies", "Gaming", "Events", "Music"]
    },
    "Health": {
        merchants: ["Apollo Pharmacy", "PharmEasy", "1mg", "Dr. Consultation", "Cult.fit", "Practo", "Lal PathLabs", "Max Healthcare", "LensKart", "MuscleBlaze"],
        range: [150, 7500],
        subs: ["Medicine", "Consultation", "Gym", "Lab Test", "Eyewear", "Supplements"]
    },
    "Shopping": {
        merchants: ["Amazon", "Flipkart", "Myntra", "Ajio", "Croma", "Nykaa", "Reliance Digital", "Apple Store", "Nike", "Zara", "H&M", "Ikea", "Decathlon", "Uniqlo", "Tata CLiQ"],
        range: [250, 15000],
        subs: ["Electronics", "Clothing", "Cosmetics", "Home Decor", "Sports Equipment", "Gadgets", "Footwear"]
    },
    "Education": {
        merchants: ["Udemy", "Coursera", "Unacademy", "Book Purchase", "Skill Share", "Medium Subscription", "ChatGPT Plus", "GitHub Pro", "LinkedIn Premium"],
        range: [299, 8500],
        subs: ["Online Course", "Books", "Tuition", "Certification", "SaaS Tools"]
    },
    "Travel & Hotels": {
        merchants: ["Airbnb", "MakeMyTrip", "Oyo Rooms", "Taj Hotels", "Yatra", "Goibibo", "Zoomcar", "Uber Outstation"],
        range: [1200, 18000],
        subs: ["Hotels", "Resorts", "Car Rental", "Tour Packages"]
    },
    "Personal Care": {
        merchants: ["Urban Company", "Kaya Clinic", "Jawed Habib Salon", "Spa & Wellness", "Grooming Products"],
        range: [300, 4500],
        subs: ["Salon", "Spa", "House Cleaning", "Appliance Repair"]
    }
};

const INCOME_MAP = {
    "Salary": {
        merchants: ["TCS Payroll", "Infosys Salary", "Wipro HR", "Company Payroll", "Accenture Payroll"],
        range: [45000, 85000]
    },
    "Freelance": {
        merchants: ["Fiverr Client", "Upwork Payment", "Direct Client Transfer", "Toptal Project", "UI/UX Design Client", "Consultancy Fee"],
        range: [5000, 40000]
    },
    "Investment Returns": {
        merchants: ["Zerodha Dividend", "Groww Returns", "SBI MF Dividend", "HDFC AMC Payout", "Crypto Capital Gain"],
        range: [500, 20000]
    },
    "Gift": {
        merchants: ["Birthday Gift", "Festival Gift", "Wedding Gift", "Family Transfer"],
        range: [500, 15000]
    },
    "Cashback & Rewards": {
        merchants: ["CRED Cashback", "Paytm Cashback", "Amazon Pay Reward", "PhonePe Reward", "Google Pay Scratch Card"],
        range: [20, 750]
    },
    "Interest Income": {
        merchants: ["SBI Savings Bank Interest", "HDFC Bank FD Interest Payout"],
        range: [250, 4500]
    }
};

const WALLET_CONFIGS = [
    { name: "HDFC Savings",      type: "Bank",        color: "#004B87", isDefault: true,  accountNumber: "XXXX4521" },
    { name: "Paytm Wallet",      type: "Paytm",       color: "#00BAF2", isDefault: false, accountNumber: null },
    { name: "Cash in Hand",      type: "Cash",        color: "#2E7D32", isDefault: false, accountNumber: null },
    { name: "ICICI Credit Card", type: "Credit Card", color: "#F57C00", isDefault: false, accountNumber: "XXXX8832" },
];

async function seed() {
    try {
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected!\n");

        // ── 1. Find target user ───────────────
        const user = await User.findOne({ email: "hp486727@gmail.com" });
        if (!user) {
            console.error("❌ User hp486727@gmail.com not found. Please register first.");
            process.exit(1);
        }
        console.log(`👤 Found user: ${user.name} (${user.email})\n`);
        const userId = user._id;

        // ── 2. Clean old data ─────────────────
        console.log("🧹 Cleaning old data...");
        await Promise.all([
            Transaction.deleteMany({ user: userId }),
            Wallet.deleteMany({ user: userId }),
            Budget.deleteMany({ user: userId }),
            Goal.deleteMany({ user: userId }),
            Bill.deleteMany({ user: userId }),
            Investment.deleteMany({ user: userId }),
            Loan.deleteMany({ user: userId }),
            Recurring.deleteMany({ user: userId }),
        ]);
        console.log("   ✓ All old data cleared\n");

        // ── 3. Create Wallets ─────────────────
        console.log("💳 Creating wallets...");
        const now = new Date();
        const walletDocs = WALLET_CONFIGS.map(cfg => ({
            _id: new mongoose.Types.ObjectId(),
            user: userId,
            name: cfg.name,
            type: cfg.type,
            balance: 0,
            currency: "INR",
            isDefault: cfg.isDefault,
            color: cfg.color,
            accountNumber: cfg.accountNumber,
            createdAt: now,
            updatedAt: now,
        }));

        await Wallet.insertMany(walletDocs);
        const [defaultWallet, paytmWallet, cashWallet, ccWallet] = walletDocs;
        for (const w of walletDocs) console.log(`   ✓ ${w.name} (${w.type})`);
        console.log();

        // ── 4. Generate 550+ Transactions ──────────────
        console.log("📊 Generating 550+ transactions for deep RAG testing...");
        const txnDocs = [];
        let totalIncome = 0, totalExpense = 0;

        // A. Monthly Salary credits for the past 12 months (guaranteed)
        for (let m = 0; m < 12; m++) {
            const salaryDate = new Date();
            salaryDate.setMonth(salaryDate.getMonth() - m);
            salaryDate.setDate(1);
            const salaryAmt = randomBetween(58000, 68000);
            const salaryMerchant = pick(INCOME_MAP["Salary"].merchants);
            txnDocs.push({
                user: userId,
                wallet: defaultWallet._id,
                type: "INCOME",
                amount: salaryAmt,
                currency: "INR",
                category: "Salary",
                merchant: salaryMerchant,
                tags: ["salary", "essential", "income", "monthly"],
                date: salaryDate,
                notes: `Monthly salary credit from ${salaryMerchant} - ${salaryDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
                createdAt: salaryDate,
                updatedAt: salaryDate,
            });
            totalIncome += salaryAmt;
        }

        // B. Monthly Rent payments for past 12 months (guaranteed)
        for (let m = 0; m < 12; m++) {
            const rentDate = new Date();
            rentDate.setMonth(rentDate.getMonth() - m);
            rentDate.setDate(5);
            const rentAmt = 15000;
            txnDocs.push({
                user: userId,
                wallet: defaultWallet._id,
                type: "EXPENSE",
                amount: rentAmt,
                currency: "INR",
                category: "Rent",
                subCategory: "Monthly Rent",
                merchant: "Landlord - Flat Rent",
                tags: ["rent", "essential", "fixed-cost"],
                date: rentDate,
                notes: `Flat rent paid for ${rentDate.toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
                createdAt: rentDate,
                updatedAt: rentDate,
            });
            totalExpense += rentAmt;
        }

        // C. Monthly Internet/Fiber bills for past 12 months
        for (let m = 0; m < 12; m++) {
            const billDate = new Date();
            billDate.setMonth(billDate.getMonth() - m);
            billDate.setDate(10);
            const billAmt = 999;
            txnDocs.push({
                user: userId,
                wallet: ccWallet._id,
                type: "EXPENSE",
                amount: billAmt,
                currency: "INR",
                category: "Utilities",
                subCategory: "Internet",
                merchant: "Jio Fiber",
                tags: ["internet", "broadband", "utility"],
                date: billDate,
                notes: `Jio Fiber monthly plan payment for ${billDate.toLocaleString("en-IN", { month: "long" })}`,
                createdAt: billDate,
                updatedAt: billDate,
            });
            totalExpense += billAmt;
        }

        // D. High-value milestone purchases (for testing RAG thresholds & specific queries)
        const milestonePurchases = [
            { merchant: "Apple Store", category: "Shopping", subCategory: "Electronics", amount: 124900, notes: "iPhone 16 Pro Max Purchase 256GB Space Black", tags: ["high-value", "apple", "gadgets", "luxury"] },
            { merchant: "Croma", category: "Shopping", subCategory: "Electronics", amount: 48500, notes: "Sony 55-inch 4K Smart OLED TV", tags: ["high-value", "electronics", "home"] },
            { merchant: "MakeMyTrip Flights", category: "Transport", subCategory: "Flight", amount: 28400, notes: "Round trip flight tickets Delhi to Goa for vacation", tags: ["travel", "flight", "high-value"] },
            { merchant: "Taj Hotels", category: "Travel & Hotels", subCategory: "Hotels", amount: 35000, notes: "3 nights weekend stay at Taj Exotica Goa", tags: ["travel", "luxury", "hotel"] },
            { merchant: "Decathlon", category: "Shopping", subCategory: "Sports Equipment", amount: 18500, notes: "BTWIN Rockrider Mountain Bike purchase", tags: ["sports", "fitness", "outdoor"] },
            { merchant: "Ikea", category: "Shopping", subCategory: "Home Decor", amount: 24000, notes: "Ergonomic standing desk & mesh office chair", tags: ["workfromhome", "furniture"] },
        ];

        for (const mp of milestonePurchases) {
            const pDate = randomDate(250);
            txnDocs.push({
                user: userId,
                wallet: ccWallet._id,
                type: "EXPENSE",
                amount: mp.amount,
                currency: "INR",
                category: mp.category,
                subCategory: mp.subCategory,
                merchant: mp.merchant,
                tags: mp.tags,
                date: pDate,
                notes: mp.notes,
                createdAt: pDate,
                updatedAt: pDate,
            });
            totalExpense += mp.amount;
        }

        // E. 515+ random diverse transactions over past 365 days
        const expenseCategories = Object.keys(EXPENSE_MAP);
        const incomeCategories  = Object.keys(INCOME_MAP);
        const walletPool = [defaultWallet, paytmWallet, cashWallet, ccWallet];

        const targetRandomCount = 515;
        for (let i = 0; i < targetRandomCount; i++) {
            const isExpense = Math.random() < 0.78; // 78% expenses, 22% income
            const type = isExpense ? "EXPENSE" : "INCOME";

            let category, merchant, amount, subCategory, wallet;

            if (isExpense) {
                category = pick(expenseCategories);
                const info = EXPENSE_MAP[category];
                merchant = pick(info.merchants);
                amount = randomBetween(info.range[0], info.range[1]);
                subCategory = pick(info.subs);

                if (category === "Shopping" || category === "Travel & Hotels" || category === "Education") {
                    wallet = pick([ccWallet, defaultWallet]);
                } else if (category === "Transport" || category === "Food & Dining" || category === "Personal Care") {
                    wallet = pick([paytmWallet, cashWallet, defaultWallet]);
                } else {
                    wallet = pick(walletPool);
                }
                totalExpense += amount;
            } else {
                category = pick(incomeCategories);
                const info = INCOME_MAP[category];
                merchant = pick(info.merchants);
                amount = randomBetween(info.range[0], info.range[1]);
                subCategory = null;
                wallet = category === "Cashback & Rewards" ? paytmWallet : defaultWallet;
                totalIncome += amount;
            }

            const tags = [];
            if (amount > 5000) tags.push("high-value");
            if (type === "EXPENSE" && amount < 250) tags.push("micro-spend");
            if (category === "Food & Dining") tags.push("food");
            if (category === "Shopping") tags.push("online");
            if (category === "Travel & Hotels") tags.push("travel");
            if (category === "Health") tags.push("health");

            const txDate = randomDate(365);
            txnDocs.push({
                user: userId,
                wallet: wallet._id,
                type,
                amount,
                currency: "INR",
                category,
                subCategory,
                merchant,
                tags,
                date: txDate,
                notes: `${type === "INCOME" ? "Received from" : "Paid to"} ${merchant}${subCategory ? ` (${subCategory})` : ''}`,
                createdAt: txDate,
                updatedAt: txDate,
            });
        }

        await Transaction.insertMany(txnDocs);
        console.log(`   ✓ Total ${txnDocs.length} transactions inserted into MongoDB!`);
        console.log(`     Total Income:  ₹${totalIncome.toLocaleString("en-IN")}`);
        console.log(`     Total Expense: ₹${totalExpense.toLocaleString("en-IN")}\n`);

        // ── 5. Recalculate Wallet Balances ────
        console.log("🔄 Recalculating wallet balances...");
        for (const w of walletDocs) {
            const [result] = await Transaction.aggregate([
                { $match: { wallet: w._id } },
                { $group: {
                    _id: null,
                    income:  { $sum: { $cond: [{ $eq: ["$type", "INCOME"] },  "$amount", 0] } },
                    expense: { $sum: { $cond: [{ $eq: ["$type", "EXPENSE"] }, "$amount", 0] } },
                }}
            ]);
            const balance = result ? result.income - result.expense : 0;
            await Wallet.updateOne({ _id: w._id }, { $set: { balance } });
            console.log(`   ✓ ${w.name}: ₹${balance.toLocaleString("en-IN")}`);
        }
        console.log();

        // ── 6. Create Budgets ──────────────────
        console.log("📋 Creating budgets...");
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const budgetData = [
            { category: "Food & Dining",  amountLimit: 12000, period: "MONTHLY" },
            { category: "Transport",      amountLimit: 6000,  period: "MONTHLY" },
            { category: "Shopping",       amountLimit: 15000, period: "MONTHLY" },
            { category: "Entertainment",  amountLimit: 3500,  period: "MONTHLY" },
            { category: "Utilities",      amountLimit: 8000,  period: "MONTHLY" },
            { category: "Health",         amountLimit: 5000,  period: "MONTHLY" },
            { category: null,             amountLimit: 65000, period: "MONTHLY", alertThreshold: 85 },
        ];

        await Budget.insertMany(budgetData.map(b => ({
            user: userId,
            category: b.category,
            amountLimit: b.amountLimit,
            period: b.period,
            startDate: monthStart,
            endDate: monthEnd,
            alertThreshold: b.alertThreshold || 80,
            createdAt: now,
            updatedAt: now,
        })));
        for (const b of budgetData) console.log(`   ✓ ${b.category || "Overall"}: ₹${b.amountLimit.toLocaleString("en-IN")}/mo`);
        console.log();

        // ── 7. Create Savings Goals ────────────
        console.log("🎯 Creating savings goals...");
        const goalData = [
            { title: "Emergency Fund",        targetAmount: 300000, currentAmount: 110000, deadline: futureDate(365), priority: "High", autoContributePercent: 10 },
            { title: "MacBook Pro M4",        targetAmount: 180000, currentAmount: 75000,  deadline: futureDate(180), priority: "Med" },
            { title: "Goa Trip with Friends", targetAmount: 40000,  currentAmount: 28000,  deadline: futureDate(45),  priority: "Low" },
            { title: "New Bike Down Payment", targetAmount: 60000,  currentAmount: 32000,  deadline: futureDate(210), priority: "Med" },
            { title: "Japan Vacation 2027",   targetAmount: 250000, currentAmount: 45000,  deadline: futureDate(500), priority: "Low" },
            { title: "Skill Course Fund",     targetAmount: 20000,  currentAmount: 20000,  deadline: futureDate(30),  priority: "High", isCompleted: true },
        ];

        await Goal.insertMany(goalData.map(g => ({
            user: userId,
            ...g,
            createdAt: now,
            updatedAt: now,
        })));
        for (const g of goalData) {
            const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
            console.log(`   ✓ ${g.title}: ${pct}% done${g.isCompleted ? " ✅" : ""}`);
        }
        console.log();

        // ── 8. Create Bills ────────────────────
        console.log("📑 Creating bills...");
        const billData = [
            { title: "Tata Power Electricity",  category: "Electricity",  billerNameOrProvider: "Tata Power",   amount: 2450,  dueDate: futureDate(10), status: "PENDING", repeatMonthly: true },
            { title: "Jio Fiber Internet",      category: "Internet",     billerNameOrProvider: "Jio",          amount: 999,   dueDate: futureDate(6),  status: "PENDING", repeatMonthly: true },
            { title: "Airtel Mobile Recharge",  category: "Mobile",       billerNameOrProvider: "Airtel",       amount: 799,   dueDate: futureDate(4),  status: "PENDING", repeatMonthly: true },
            { title: "Flat Rent August",        category: "Rent",         billerNameOrProvider: "Landlord",     amount: 15000, dueDate: futureDate(2),  status: "PENDING", repeatMonthly: true },
            { title: "ICICI Credit Card Bill",  category: "Credit Card",  billerNameOrProvider: "ICICI Bank",   amount: 14250, dueDate: futureDate(15), status: "PENDING" },
            { title: "Star Health Insurance",   category: "Insurance",    billerNameOrProvider: "Star Health",  amount: 14500, dueDate: futureDate(40), status: "PENDING" },
            { title: "Netflix Subscription",    category: "Subscription", billerNameOrProvider: "Netflix",      amount: 649,   dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3), status: "OVERDUE" },
            { title: "Spotify Family Plan",     category: "Subscription", billerNameOrProvider: "Spotify",      amount: 179,   dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), status: "OVERDUE" },
            { title: "Mahanagar Gas Bill",      category: "Gas",          billerNameOrProvider: "Mahanagar Gas", amount: 580,  dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8), status: "PAID" },
            { title: "BSES Electricity Bill",   category: "Electricity",  billerNameOrProvider: "BSES Rajdhani", amount: 1890, dueDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12), status: "PAID" },
        ];

        await Bill.insertMany(billData.map(b => ({
            user: userId,
            ...b,
            createdAt: now,
            updatedAt: now,
        })));
        for (const b of billData) {
            const icon = b.status === "PAID" ? "✅" : b.status === "OVERDUE" ? "⚠️" : "⏳";
            console.log(`   ${icon} ${b.title}: ₹${b.amount} (${b.status})`);
        }
        console.log();

        // ── 9. Create Investments ──────────────
        console.log("📈 Creating investments...");
        const investData = [
            { name: "HDFC Top 100 Fund",       symbolOrTicker: "HDFCTOP100", assetType: "Mutual Funds", investedAmount: 85000,  currentValue: 98400,  quantity: 580.5,  purchasePricePerUnit: 146.42, interestRateOrExpectedCAGR: 14, isSIP: true, sipMonthlyAmount: 5000, sipNextDueDate: futureDate(15) },
            { name: "Nifty 50 Index Fund",     symbolOrTicker: "UTINIFTY50", assetType: "Mutual Funds", investedAmount: 120000, currentValue: 142000, quantity: 950.0,  purchasePricePerUnit: 126.31, interestRateOrExpectedCAGR: 13.5, isSIP: true, sipMonthlyAmount: 10000, sipNextDueDate: futureDate(10) },
            { name: "Reliance Industries Ltd",  symbolOrTicker: "RELIANCE",   assetType: "Stocks",       investedAmount: 45000,  currentValue: 53800,  quantity: 18,     purchasePricePerUnit: 2500 },
            { name: "Tata Motors Ltd",          symbolOrTicker: "TATAMOTORS", assetType: "Stocks",       investedAmount: 25000,  currentValue: 28200,  quantity: 35,     purchasePricePerUnit: 714.28, dividendsReceived: 450 },
            { name: "Bitcoin",                  symbolOrTicker: "BTC",        assetType: "Crypto",       investedAmount: 50000,  currentValue: 72500,  quantity: 0.0078, purchasePricePerUnit: 6410256 },
            { name: "SBI FD 1-Year",            symbolOrTicker: "SBIFD",      assetType: "FD",           investedAmount: 150000, currentValue: 160650, quantity: 1,      purchasePricePerUnit: 150000, interestRateOrExpectedCAGR: 7.1, maturityDate: futureDate(180) },
            { name: "Sovereign Gold Bond 2024", symbolOrTicker: "SGB2024",    assetType: "Gold",         investedAmount: 75000,  currentValue: 88500,  quantity: 1.5,    purchasePricePerUnit: 50000, interestRateOrExpectedCAGR: 2.5, dividendsReceived: 1875 },
            { name: "Axis Bluechip SIP",        symbolOrTicker: "AXISBLU",    assetType: "SIP",          investedAmount: 48000,  currentValue: 54200,  quantity: 1350,   purchasePricePerUnit: 35.55, interestRateOrExpectedCAGR: 12, isSIP: true, sipMonthlyAmount: 4000, sipNextDueDate: futureDate(12) },
        ];

        await Investment.insertMany(investData.map(inv => ({
            user: userId,
            wallet: defaultWallet._id,
            currency: "INR",
            purchaseDate: randomDate(240),
            ...inv,
            createdAt: now,
            updatedAt: now,
        })));
        for (const inv of investData) {
            const roi = ((inv.currentValue - inv.investedAmount + (inv.dividendsReceived || 0)) / inv.investedAmount * 100).toFixed(1);
            const arrow = roi >= 0 ? "↗" : "↘";
            console.log(`   ${arrow} ${inv.name}: ₹${inv.currentValue.toLocaleString("en-IN")} (${roi}%)`);
        }
        console.log();

        // ── 10. Create Loans ───────────────────
        console.log("🏦 Creating loans...");
        const loanData = [
            { loanName: "HDFC Education Loan",   loanType: "Education Loan", lenderName: "HDFC Bank",     principalAmount: 500000, remainingBalance: 320000, interestRatePerAnnum: 8.5,  tenureMonths: 60, monthlyEmi: 10253, startDate: new Date("2024-03-01"), nextDueDate: futureDate(25), totalInterestPaidSoFar: 42000, totalPrincipalPaidSoFar: 180000 },
            { loanName: "Bajaj Personal Loan",   loanType: "Personal Loan",  lenderName: "Bajaj Finance", principalAmount: 100000, remainingBalance: 25000,  interestRatePerAnnum: 14,   tenureMonths: 24, monthlyEmi: 4800,  startDate: new Date("2024-09-01"), nextDueDate: futureDate(20), totalInterestPaidSoFar: 13200, totalPrincipalPaidSoFar: 75000 },
            { loanName: "ICICI Car Loan",        loanType: "Car Loan",       lenderName: "ICICI Bank",    principalAmount: 400000, remainingBalance: 290000, interestRatePerAnnum: 9.2,  tenureMonths: 48, monthlyEmi: 9980,  startDate: new Date("2025-01-15"), nextDueDate: futureDate(15), totalInterestPaidSoFar: 18500, totalPrincipalPaidSoFar: 110000 },
        ];

        await Loan.insertMany(loanData.map(l => ({
            user: userId,
            wallet: defaultWallet._id,
            ...l,
            createdAt: now,
            updatedAt: now,
        })));
        for (const l of loanData) {
            const paidPct = Math.round(((l.principalAmount - l.remainingBalance) / l.principalAmount) * 100);
            console.log(`   ✓ ${l.loanName}: ₹${l.remainingBalance.toLocaleString("en-IN")} remaining (${paidPct}% paid)`);
        }
        console.log();

        // ── 11. Create Recurring Transactions ──
        console.log("🔁 Creating recurring transactions...");
        const recurringData = [
            { type: "EXPENSE",  amount: 999,   category: "Utilities",     subCategory: "Internet",     frequency: "MONTHLY", nextRunDate: futureDate(6),  notes: "Jio Fiber monthly auto-debit" },
            { type: "EXPENSE",  amount: 649,   category: "Entertainment", subCategory: "Streaming",    frequency: "MONTHLY", nextRunDate: futureDate(27), notes: "Netflix subscription" },
            { type: "EXPENSE",  amount: 179,   category: "Entertainment", subCategory: "Streaming",    frequency: "MONTHLY", nextRunDate: futureDate(14), notes: "Spotify family premium" },
            { type: "INCOME",   amount: 65000, category: "Salary",                                     frequency: "MONTHLY", nextRunDate: futureDate(28), notes: "Monthly salary credit" },
            { type: "EXPENSE",  amount: 15000, category: "Rent",          subCategory: "Monthly Rent", frequency: "MONTHLY", nextRunDate: futureDate(2),  notes: "Flat rent auto-debit" },
            { type: "EXPENSE",  amount: 5000,  category: "Investment Returns",                         frequency: "MONTHLY", nextRunDate: futureDate(15), notes: "SIP auto-debit for HDFC Top 100" },
            { type: "EXPENSE",  amount: 10000, category: "Investment Returns",                         frequency: "MONTHLY", nextRunDate: futureDate(10), notes: "SIP auto-debit for Nifty 50 Index Fund" },
            { type: "EXPENSE",  amount: 2450,  category: "Utilities",     subCategory: "Electricity",  frequency: "MONTHLY", nextRunDate: futureDate(10), notes: "Tata Power auto-pay" },
        ];

        await Recurring.insertMany(recurringData.map(r => ({
            user: userId,
            wallet: defaultWallet._id,
            ...r,
            createdAt: now,
            updatedAt: now,
        })));
        for (const r of recurringData) console.log(`   ✓ ${r.category}: ₹${r.amount.toLocaleString("en-IN")} (${r.frequency})`);
        console.log();

        // ── Summary ────────────────────────────
        const totalDocs = walletDocs.length + txnDocs.length + budgetData.length + goalData.length + billData.length + investData.length + loanData.length + recurringData.length;
        console.log("═".repeat(55));
        console.log(` 🎉 SEED COMPLETE — ${totalDocs} DATABASE ENTRIES INSERTED!`);
        console.log("═".repeat(55));
        console.log(`  Wallets:       ${walletDocs.length}`);
        console.log(`  Transactions:  ${txnDocs.length} (EXPENSE + INCOME)`);
        console.log(`  Budgets:       ${budgetData.length}`);
        console.log(`  Goals:         ${goalData.length}`);
        console.log(`  Bills:         ${billData.length}`);
        console.log(`  Investments:   ${investData.length}`);
        console.log(`  Loans:         ${loanData.length}`);
        console.log(`  Recurring:     ${recurringData.length}`);
        console.log("═".repeat(55));
        console.log(`  Target User:   hp486727@gmail.com`);
        console.log("═".repeat(55));

    } catch (err) {
        console.error("❌ Error during seeding:", err);
    } finally {
        await mongoose.connection.close();
        console.log("\n🔌 Database connection closed.");
    }
}

seed();
