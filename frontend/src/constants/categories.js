// Categories for Transactions and Budgets
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: '#f97316' },
  { id: 'housing', name: 'Housing & Rent', icon: 'Home', color: '#6366f1' },
  { id: 'transport', name: 'Transportation', icon: 'Car', color: '#3b82f6' },
  { id: 'entertainment', name: 'Entertainment', icon: 'Film', color: '#ec4899' },
  { id: 'utilities', name: 'Utilities & Bills', icon: 'Zap', color: '#eab308' },
  { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: '#a855f7' },
  { id: 'health', name: 'Healthcare & Fitness', icon: 'Heart', color: '#ef4444' },
  { id: 'education', name: 'Education', icon: 'GraduationCap', color: '#14b8a6' },
  { id: 'travel', name: 'Travel & Vacations', icon: 'Plane', color: '#06b6d4' },
  { id: 'other_expense', name: 'Other Expense', icon: 'MoreHorizontal', color: '#64748b' }
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: 'Monthly Salary', icon: 'Briefcase', color: '#10b981' },
  { id: 'freelance', name: 'Freelance & Consulting', icon: 'Laptop', color: '#3b82f6' },
  { id: 'investments', name: 'Investment Dividends', icon: 'TrendingUp', color: '#8b5cf6' },
  { id: 'rental', name: 'Rental Income', icon: 'Building', color: '#06b6d4' },
  { id: 'other_income', name: 'Other Income', icon: 'DollarSign', color: '#64748b' }
];

export const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI / PhonePe', icon: 'Smartphone' },
  { id: 'credit_card', name: 'Credit Card', icon: 'CreditCard' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: 'Building2' },
  { id: 'paytm', name: 'Paytm Wallet', icon: 'Wallet' },
  { id: 'cash', name: 'Cash', icon: 'Banknote' }
];

export const WALLET_TYPES = [
  { id: 'bank', name: 'Bank Account', icon: 'Landmark' },
  { id: 'credit_card', name: 'Credit Card', icon: 'CreditCard' },
  { id: 'digital_wallet', name: 'Digital Wallet', icon: 'Wallet' },
  { id: 'cash', name: 'Cash Pocket', icon: 'Coins' }
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' }
];
