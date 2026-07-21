const express = require("express")
const db = require("./config/db")
const authroutes = require("./routes/authroutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const investmentRoutes = require("./routes/investmentRoutes");
const loanRoutes = require("./routes/loanRoutes");
const billRoutes = require("./routes/billRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const timelineRoutes = require("./routes/timelineRoutes");
const reportRoutes = require("./routes/reportRoutes");
const searchRoutes = require("./routes/searchRoutes");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express()
const cors = require("cors");
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json()) // It allows the app to parse JSON bodies
app.use(express.urlencoded({ extended: true })) // It allows the app to parse URL-encoded bodies
app.use(cookieParser());

app.use("/api/auth", authroutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/investments", investmentRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/bills", billRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/timeline", timelineRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/search", searchRoutes);

module.exports = app