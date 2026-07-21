# Finora

Finora is a comprehensive personal finance management application designed to help users track transactions, manage budgets, monitor wallets, and achieve their financial goals.

## Features

- **User Authentication**: Secure sign-up and login functionality.
- **Transaction Management**: Add, categorize, and organize your daily financial transactions.
- **Advanced Search**: Fast, Trie-based search functionality to quickly find specific transactions.
- **Budgets & Wallets**: Manage different wallets and set customized budgets to keep your spending in check.
- **Financial Reports**: Generate detailed reports of your financial activities to better understand your spending habits.
- **Goal Tracking**: Set, track, and evaluate your long-term and short-term financial goals.

## Technologies Used

- **Frontend**: React, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Hardikv07/Finora.git
   cd Finora
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Environment Variables:
   Create a `.env` file in the `backend` directory with the necessary configuration (e.g., `PORT`, `MONGO_URI`, `JWT_SECRET`).

5. Running the Application:
   Start the backend and frontend development servers in separate terminals.
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```
