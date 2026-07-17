// Realistic Fintech SaaS Initial Dataset for Finora

export const INITIAL_USER = {
  name: "John Doe",
  email: "john.doe@finora.ai",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  currency: "INR",
  financialHealthScore: 84,
  joinedDate: "2025-01-15"
};

export const INITIAL_WALLETS = [
  {
    _id: "w1",
    name: "HDFC Salary Account",
    type: "bank",
    balance: 342500,
    currency: "INR",
    accountNumber: "**** 4829",
    color: "from-blue-600 to-indigo-700",
    isPrimary: true
  },
  {
    _id: "w2",
    name: "Axis Bank Credit Card",
    type: "credit_card",
    balance: -18400,
    creditLimit: 200000,
    currency: "INR",
    accountNumber: "**** 9102",
    color: "from-purple-600 to-pink-600",
    isPrimary: false
  },
  {
    _id: "w3",
    name: "Paytm Digital Wallet",
    type: "digital_wallet",
    balance: 14200,
    currency: "INR",
    accountNumber: "9876543210",
    color: "from-cyan-500 to-blue-500",
    isPrimary: false
  },
  {
    _id: "w4",
    name: "Petty Cash Pocket",
    type: "cash",
    balance: 5000,
    currency: "INR",
    accountNumber: "Physical Cash",
    color: "from-emerald-600 to-teal-700",
    isPrimary: false
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    _id: "t1",
    type: "income",
    amount: 160000,
    category: "Salary",
    merchant: "TechCorp India Ltd.",
    date: "2026-07-01T09:30:00Z",
    walletId: "w1",
    paymentMethod: "Bank Transfer",
    notes: "July 2026 Monthly Salary",
    tags: ["Salary", "Regular Income"],
    hasReceipt: false
  },
  {
    _id: "t2",
    type: "expense",
    amount: 30000,
    category: "Housing & Rent",
    merchant: "Skyline Apartments",
    date: "2026-07-02T11:15:00Z",
    walletId: "w1",
    paymentMethod: "Bank Transfer",
    notes: "Monthly House Rent",
    tags: ["Rent", "Fixed Bill"],
    hasReceipt: true
  },
  {
    _id: "t3",
    type: "expense",
    amount: 4500,
    category: "Food & Dining",
    merchant: "BigBasket Supermarket",
    date: "2026-07-04T18:20:00Z",
    walletId: "w2",
    paymentMethod: "Credit Card",
    notes: "Weekly Organic Groceries",
    tags: ["Groceries", "Household"],
    hasReceipt: true
  },
  {
    _id: "t4",
    type: "expense",
    amount: 1200,
    category: "Utilities & Bills",
    merchant: "Jio Fiber Broadband",
    date: "2026-07-05T14:10:00Z",
    walletId: "w3",
    paymentMethod: "UPI / PhonePe",
    notes: "High-Speed Internet Bill",
    tags: ["Internet", "Utilities"],
    hasReceipt: false
  },
  {
    _id: "t5",
    type: "expense",
    amount: 2800,
    category: "Entertainment",
    merchant: "PVR Cinemas & Dining",
    date: "2026-07-08T21:45:00Z",
    walletId: "w2",
    paymentMethod: "Credit Card",
    notes: "Weekend Movie & Dinner with friends",
    tags: ["Leisure", "Weekend"],
    hasReceipt: true
  },
  {
    _id: "t6",
    type: "income",
    amount: 45000,
    category: "Freelance & Consulting",
    merchant: "DesignCraft Studios USA",
    date: "2026-07-10T16:00:00Z",
    walletId: "w1",
    paymentMethod: "Bank Transfer",
    notes: "UI/UX System Design Project Milestone 2",
    tags: ["Freelance", "Side Hustle"],
    hasReceipt: false
  },
  {
    _id: "t7",
    type: "expense",
    amount: 649,
    category: "Entertainment",
    merchant: "Netflix India",
    date: "2026-07-11T08:00:00Z",
    walletId: "w2",
    paymentMethod: "Credit Card",
    notes: "4K Premium Monthly Subscription",
    tags: ["Subscription", "Digital"],
    hasReceipt: false
  },
  {
    _id: "t8",
    type: "expense",
    amount: 3200,
    category: "Transportation",
    merchant: "Uber / Ola Cabs",
    date: "2026-07-12T19:30:00Z",
    walletId: "w3",
    paymentMethod: "UPI / PhonePe",
    notes: "Commute & Airport Transfers",
    tags: ["Commute", "Travel"],
    hasReceipt: false
  },
  {
    _id: "t9",
    type: "expense",
    amount: 15000,
    category: "Investments",
    merchant: "Zerodha Broking Ltd.",
    date: "2026-07-13T10:15:00Z",
    walletId: "w1",
    paymentMethod: "Bank Transfer",
    notes: "Monthly Mutual Fund SIP Allocation",
    tags: ["SIP", "Wealth Generation"],
    hasReceipt: true
  },
  {
    _id: "t10",
    type: "expense",
    amount: 8500,
    category: "Shopping",
    merchant: "Amazon India",
    date: "2026-07-14T15:20:00Z",
    walletId: "w2",
    paymentMethod: "Credit Card",
    notes: "Ergonomic Office Chair & Desk Accessories",
    tags: ["Workstation", "Gadgets"],
    hasReceipt: true
  },
  {
    _id: "t11",
    type: "expense",
    amount: 2100,
    category: "Food & Dining",
    merchant: "Swiggy Gourmet Delivery",
    date: "2026-07-15T20:10:00Z",
    walletId: "w3",
    paymentMethod: "UPI / PhonePe",
    notes: "Italian Pasta & Gelato order",
    tags: ["Food Delivery", "Dining"],
    hasReceipt: false
  }
];

export const INITIAL_BUDGETS = [
  {
    _id: "b1",
    category: "Housing & Rent",
    limit: 30000,
    spent: 30000,
    period: "Monthly",
    alertThreshold: 85,
    icon: "Home",
    color: "indigo"
  },
  {
    _id: "b2",
    category: "Food & Dining",
    limit: 15000,
    spent: 6600,
    period: "Monthly",
    alertThreshold: 80,
    icon: "Utensils",
    color: "orange"
  },
  {
    _id: "b3",
    category: "Entertainment",
    limit: 8000,
    spent: 3449,
    period: "Monthly",
    alertThreshold: 80,
    icon: "Film",
    color: "pink"
  },
  {
    _id: "b4",
    category: "Shopping",
    limit: 10000,
    spent: 8500,
    period: "Monthly",
    alertThreshold: 85,
    icon: "ShoppingBag",
    color: "purple"
  },
  {
    _id: "b5",
    category: "Transportation",
    limit: 6000,
    spent: 3200,
    period: "Monthly",
    alertThreshold: 80,
    icon: "Car",
    color: "blue"
  }
];

export const INITIAL_GOALS = [
  {
    _id: "g1",
    title: "Emergency Fund Shield",
    targetAmount: 500000,
    currentAmount: 380000,
    deadline: "2026-12-31",
    priority: "High",
    category: "Savings",
    autoContribute: true,
    monthlyContribution: 25000
  },
  {
    _id: "g2",
    title: "New MacBook Pro M4 Max",
    targetAmount: 200000,
    currentAmount: 145000,
    deadline: "2026-10-15",
    priority: "Medium",
    category: "Gadgets",
    autoContribute: false,
    monthlyContribution: 15000
  },
  {
    _id: "g3",
    title: "Euro Trip Vacation Pool",
    targetAmount: 350000,
    currentAmount: 120000,
    deadline: "2027-05-01",
    priority: "Low",
    category: "Travel",
    autoContribute: true,
    monthlyContribution: 12000
  }
];

export const INITIAL_RECURRING = [
  {
    _id: "r1",
    title: "Monthly Base Salary",
    amount: 160000,
    type: "income",
    frequency: "Monthly",
    nextDueDate: "2026-08-01",
    category: "Salary",
    walletId: "w1",
    autoProcess: true
  },
  {
    _id: "r2",
    title: "Apartment Monthly Rent",
    amount: 30000,
    type: "expense",
    frequency: "Monthly",
    nextDueDate: "2026-08-02",
    category: "Housing & Rent",
    walletId: "w1",
    autoProcess: true
  },
  {
    _id: "r3",
    title: "High-Speed Fiber Broadband",
    amount: 1200,
    type: "expense",
    frequency: "Monthly",
    nextDueDate: "2026-08-05",
    category: "Utilities & Bills",
    walletId: "w3",
    autoProcess: true
  },
  {
    _id: "r4",
    title: "Netflix 4K Premium Plan",
    amount: 649,
    type: "expense",
    frequency: "Monthly",
    nextDueDate: "2026-08-11",
    category: "Entertainment",
    walletId: "w2",
    autoProcess: true
  }
];

export const INITIAL_ANALYTICS = {
  monthlyComparison: [
    { month: "Feb", income: 155000, expense: 62000, savings: 93000 },
    { month: "Mar", income: 160000, expense: 68000, savings: 92000 },
    { month: "Apr", income: 180000, expense: 71000, savings: 109000 },
    { month: "May", income: 160000, expense: 59000, savings: 101000 },
    { month: "Jun", income: 195000, expense: 78000, savings: 117000 },
    { month: "Jul", income: 205000, expense: 66949, savings: 138051 }
  ],
  anomalies: [
    {
      id: "a1",
      title: "Unusual Shopping Spree Detected",
      description: "You spent ₹8,500 on Shopping on July 14th, which is 135% above your average daily shopping expenditure.",
      severity: "warning",
      date: "2026-07-14"
    },
    {
      id: "a2",
      title: "Savings Rate Peak Achieved",
      description: "Your net savings rate for July reached an impressive 67.3%, well above your 50% target threshold.",
      severity: "success",
      date: "2026-07-16"
    }
  ],
  insights: [
    "You spent 18% less on Food & Dining this month compared to your 6-month average.",
    "Your recurring subscription overhead is ₹1,849/month across digital platforms.",
    "At your current monthly saving pace of ₹1,38,051, your 'New MacBook Pro' goal will be reached 45 days early!"
  ]
};
