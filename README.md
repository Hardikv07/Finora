# Finora

Finora is a comprehensive personal finance management application designed to help users track transactions, manage budgets, monitor wallets, and achieve their financial goals.

## Features

- **User Authentication**: Secure sign-up and login functionality.
- **Transaction Management**: Add, categorize, and organize your daily financial transactions.
- **Gemini AI Bill Import**: OCR integration to extract transaction details (merchant, paid amount, currency, date, category) using Gemini AI from uploaded receipts.
- **Smart Global Search & Actions**: Split keyword suggestions and matching transaction records in search results dropdown. Selecting keywords redirects to the pre-filtered Ledger tab, and selecting transactions opens the Edit modal globally.
- **Budgets & Wallets**: Manage different wallets and set customized budgets to keep your spending in check.
- **Financial Reports**: Generate detailed reports of your financial activities to better understand your spending habits.
- **Goal Tracking**: Set, track, and evaluate your long-term and short-term financial goals.

## Technologies Used

- **Frontend**: React, Tailwind CSS, Tesseract.js (client-side OCR)
- **Backend**: Node.js, Express.js, Google Gemini API (gemini-1.5-flash)
- **Database**: MongoDB (Mongoose)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hardikv07/Finora.git
   cd Finora
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Environment Variables:
   Create a `.env` file in the root directory with the necessary configuration:
   ```env
   PORT=7777
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Running the Application:
   Start the application in development mode:
   ```bash
   npm run dev
   ```
