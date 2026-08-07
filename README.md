# Finora 💳 Real-Time Personal Finance & AI Copilot Platform

Finora is a state-of-the-art, full-stack personal finance management platform. It empowers users to take full control of their financial health through intelligent transaction tracking, multi-wallet management, customized budget allocation, savings goal visualizers, automated OCR receipt scanning, and **Finora Copilot**—an AI-powered financial analyst with Retrieval-Augmented Generation (RAG).

---

## 🚀 Key Features

### 🤖 Finora Copilot (AI Financial Analyst)
- **RAG & Semantic Retrieval**: Leverages vector embeddings and RAG (`ragService.js`) to ground financial advice in the user's actual historical transaction data.
- **Intent Classifier**: Automatically categorizes user queries into distinct intent buckets (`INTENT_ADVICE`, `INTENT_ANALYSIS`, `INTENT_SEARCH`, `INTENT_FAQ`, `INTENT_GENERAL`).
- **Dynamic Context Builder**: Assembles structured financial snapshots—including active budgets, wallet balances, cash flows, and relevant vector search matches—into AI prompts.
- **Personalized Insights**: Powered by Google Gemini AI (`gemini-2.5-flash` / `gemini-1.5-flash`), delivering instant, actionable spending analysis and budget optimization strategies.

### 📄 Smart OCR Receipt & Bill Import
- **Automated Data Extraction**: Upload bill or receipt images to auto-fill merchant names, total amounts, currencies, transaction dates, and categories.
- **Dual Engine OCR**: Integrates Tesseract.js client-side pre-processing with Google Gemini AI for parsing unstructured receipts.

### 🌍 Multi-Currency System
- **Real-Time Currency Conversion**: Seamlessly converts transaction balances across global currencies (USD, EUR, GBP, INR, CAD, AUD, JPY, and more).
- **Localized Wallet Balances**: Displays wallet totals and transaction entries in user-selected native currencies.

### 🔍 Smart Search & Quick Actions
- **Global Search Dropdown**: Multi-field search filtering across transaction description, category, merchant, amount, and date.
- **Quick Edit Modal**: Click directly from search results to open a global transaction editor.
- **Keyword Splitting**: Auto-populates search pills for fast navigation between expense categories.

### 📊 Dashboard & Financial Analytics
- **Financial Health Score**: Calculates an overall financial wellness rating based on income vs. expense ratios, debt-to-savings, and budget adherence.
- **Monthly Cash Flow Chart**: Visual breakdown of total income vs. total expenses per month.
- **Stat Cards & Progress Bars**: Live visual cards for total balance, monthly spending, active savings goals, and budget warnings.

### 💰 Wallet, Budget & Goal Management
- **Multi-Wallet Ledger**: Track balances across cash, credit cards, bank accounts, and investment wallets.
- **Budget Alerts**: Visual indicators and percentage bars to prevent overspending on specific categories.
- **Savings Goals**: Set target dates and target amounts with visual contribution progress bars.
- **Recurring Transactions**: Schedule repeating bills, subscriptions, and income streams.

### 📑 Automated Document Generation
- **Word (.docx) Report Generator**: Programmatically generates styled executive reports and financial statements using custom document builders (`generate_docx.js`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React, Tesseract.js |
| **Backend** | Node.js, Express.js (v5), Mongoose (MongoDB ORM), JWT Authentication |
| **AI / ML** | Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`), Vector Embeddings, RAG Service |
| **Utilities** | Docx (Word generation), Cloudinary, Nodemailer, Node-cron, Cookie Parser |

---

## 📁 Repository Structure

```
Finora/
├── backend/
│   ├── controllers/      # Route controllers (auth, wallet, transaction, copilot)
│   ├── models/           # Mongoose schemas (User, Wallet, Transaction, Goal, Budget)
│   ├── routes/           # Express API endpoints
│   ├── services/         # Gemini Service, RAG Service, Embedding Service, Copilot Pipeline
│   └── scripts/          # Vector indexing & embedding backfill scripts
├── frontend/
│   ├── public/           # Static assets & branding icons
│   └── src/
│       ├── components/   # UI components (budgets, copilot, dashboard, goals, layout)
│       ├── hooks/        # Custom React hooks (useFinanceData)
│       ├── pages/        # Application views (Analytics, Budgets, Goals, Transactions, Wallets)
│       └── utils/        # Formatters & currency conversion utilities
├── api_documentation.md  # Detailed API endpoint reference
├── generate_docx.js      # Word report generation script
├── project_guide.md      # Comprehensive project guide & setup overview
├── server.js             # Express server entry point
└── README.md             # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- **MongoDB** (Local instance or MongoDB Atlas cluster)
- **Google Gemini API Key** (from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Hardikv07/Finora.git
   cd Finora
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Configuration**
   Create a `.env` file in the project root directory:
   ```env
   PORT=7777
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/finora?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_super_secret_key
   JWT_EXPIRE=7d
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

---

## 💻 Running the Application

### Development Mode

Start backend and frontend development servers:

```bash
# Start backend server (with nodemon)
npm run dev

# In a separate terminal, start frontend dev server
cd frontend
npm run dev
```

The application will be accessible at:
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:7777`

### Vector Embedding Backfill (For Copilot RAG)

To index existing transactions for semantic vector search in Copilot AI:

```bash
node backend/scripts/createVectorIndex.js
node backend/scripts/backfillEmbeddings.js
```

---

## 📜 License

This project is licensed under the **ISC License**.
