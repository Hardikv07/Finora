# Finora API Documentation

This document outlines the API endpoints available in the Finora Personal Finance Management platform.

## 1. Authentication (`/api/auth`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new user | `registerUser` | None |
| `POST` | `/login` | Authenticate user & return JWT | `login` | None |
| `POST` | `/forgotpassword` | Send password reset link | `forgotPassword` | None |
| `POST` | `/resetpassword` | Reset password using OTP | `resetPasswordWithOTP` | None |
| `POST` | `/refresh` | Refresh JWT access token | `refreshTokenController` | None |
| `POST` | `/logout` | Log out user and clear cookies | `logoutController` | None |
| `POST` | `/verify-email/send` | Send email verification OTP | `sendVerificationEmail` | `protect` |
| `POST` | `/verify-email` | Verify email with OTP | `verifyEmailOTP` | `protect` |
| `POST` | `/2fa/enable` | Enable Two-Factor Auth | `enable2FA` | `protect` |
| `POST` | `/google` | Google OAuth login | `googleOAuthLogin` | None |

## 2. Wallets (`/api/wallets`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/transfer` | Transfer funds between wallets | `transferFunds` | `protect` |
| `POST` | `/` | Create a new wallet | `createWallet` | `protect` |
| `GET` | `/` | Get all user wallets | `getWallets` | `protect` |
| `GET` | `/:id` | Get specific wallet details | `getWalletById` | `protect` |
| `PUT` | `/:id` | Update a wallet | `updateWallet` | `protect` |
| `DELETE` | `/:id` | Delete a wallet | `deleteWallet` | `protect` |

## 3. Transactions (`/api/transactions`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/parse-ocr` | Parse text from client-side OCR | `parseOcrText` | `protect` |
| `POST` | `/parse-bill` | Upload & parse receipt via Gemini AI | `parseBillFromUpload` | `protect`, `uploadReceipt`, `handleReceiptUpload` |
| `POST` | `/` | Create a transaction (with receipt) | `createTransaction` | `protect`, `uploadReceipt`, `handleReceiptUpload` |
| `GET` | `/` | Get all user transactions | `getTransactions` | `protect` |
| `PUT` | `/:id` | Update a transaction | `updateTransaction` | `protect`, `uploadReceipt`, `handleReceiptUpload` |
| `DELETE` | `/:id` | Delete a transaction | `deleteTransaction` | `protect` |

## 4. Budgets (`/api/budgets`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/rollover` | Rollover budget to next month | `rolloverBudget` | `protect` |
| `POST` | `/` | Create a new budget | `createBudget` | `protect` |
| `GET` | `/` | Get all budgets | `getBudgets` | `protect` |
| `PUT` | `/:id` | Update budget amount/details | `updateBudget` | `protect` |

## 5. Goals (`/api/goals`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/:id/contribute` | Add funds to a goal | `contributeToGoal` | `protect` |
| `POST` | `/` | Create a financial goal | `createGoal` | `protect` |
| `GET` | `/` | Get all goals | `getGoals` | `protect` |
| `PUT` | `/:id` | Update goal details | `updateGoal` | `protect` |
| `DELETE` | `/:id` | Delete a goal | `deleteGoal` | `protect` |

## 6. Recurring Transactions (`/api/recurring`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/process` | Manually process due recurrences | `processDueRecurring...` | `protect` |
| `POST` | `/` | Create a recurring transaction | `createRecurringTrans...` | `protect` |
| `GET` | `/` | Get all recurring setups | `getRecurringTrans...` | `protect` |
| `PUT` | `/:id` | Update recurring setup | `updateRecurringTrans...` | `protect` |
| `DELETE` | `/:id` | Delete recurring setup | `deleteRecurringTrans...` | `protect` |

## 7. Loans (`/api/loans`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/calculate-emi` | Preview EMI calculations | `calculateEmiPreview` | None |
| `POST` | `/` | Create a loan record | `createLoan` | `protect`, `logAudit("CREATED_LOAN")` |
| `GET` | `/` | Get all loans | `getLoans` | `protect` |
| `GET` | `/:id` | Get specific loan details | `getLoanById` | `protect` |
| `DELETE` | `/:id` | Delete a loan | `deleteLoan` | `protect`, `logAudit("DELETED_LOAN")` |
| `POST` | `/:id/pay-emi` | Pay loan EMI | `payLoanEmi` | `protect`, `logAudit("PAID_LOAN_EMI")` |

## 8. Investments (`/api/investments`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/` | Add an investment | `createInvestment` | `protect`, `logAudit("CREATED_INVESTMENT")` |
| `GET` | `/` | Get all investments | `getInvestments` | `protect` |
| `GET` | `/:id` | Get investment details | `getInvestmentById` | `protect` |
| `PUT` | `/:id` | Update investment | `updateInvestment` | `protect`, `logAudit("UPDATED_INVESTMENT")` |
| `DELETE` | `/:id` | Delete investment | `deleteInvestment` | `protect`, `logAudit("DELETED_INVESTMENT")` |

## 9. Analytics & Dashboard (`/api/analytics`, `/api/dashboard`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/` | Get aggregated dashboard data | `getDashboardData` | `protect` |
| `GET` | `/api/analytics/` | Get detailed analytics | (Analytics Controller) | `protect` |
| `GET` | `/api/analytics/search` | Search analytic metrics | (Analytics Controller) | `protect` |

## 10. AI Copilot & Search (`/api/copilot`, `/api/search`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/copilot/chat` | Interact with Gemini AI Copilot | `chat` | `protect` |
| `GET` | `/api/search/suggestions` | Get search suggestions (Trie) | `getSuggestions` | `protect` |
| `GET` | `/api/search/transactions` | Search specific transactions | `searchTransactions` | `protect` |

## 11. Timeline (`/api/timeline`)
| Method | Endpoint | Purpose | Controller | Middleware |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Get user activity timeline | `getActivityTimeline` | `protect` |

---

### Detailed Endpoint Example: Create Transaction
**Endpoint:** `POST /api/transactions`
**Purpose:** Creates a new financial transaction, optionally parsing and saving an uploaded receipt.
**Authorization Required?** Yes (Bearer Token)
**Middleware:** `protect` (auth verification), `uploadReceipt` (Multer setup), `handleReceiptUpload` (Cloudinary upload logic).
**Models Used:** `Transaction`, `Wallet` (to update balance)
**Used By Frontend:** `TransactionForm` component inside Dashboard / Ledgers.

**Example Request:**
```json
{
  "amount": 120.50,
  "category": "Food",
  "type": "Expense",
  "wallet": "64a2b1c...",
  "date": "2023-10-14",
  "description": "Groceries at Walmart"
}
```

**Example Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "64b5c2d...",
    "amount": 120.50,
    "category": "Food",
    "type": "Expense",
    "wallet": "64a2b1c...",
    "receiptUrl": "https://res.cloudinary.com/.../receipt.jpg"
  }
}
```

**Possible Edge Cases:**
- Wallet ID is invalid or does not belong to the user.
- Insufficient balance in wallet (if logic enforces it).
- Uploaded receipt file is too large or unsupported format.
