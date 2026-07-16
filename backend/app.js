const express = require("express")
const db = require("./config/db")
const authroutes = require("./routes/authroutes");
const walletRoutes = require("./routes/walletRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();

const app = express()
app.use(express.json()) // It allows the app to parse JSON bodies
app.use(express.urlencoded({ extended: true })) // It allows the app to parse URL-encoded bodies
app.use(cookieParser());

app.use("/api/auth", authroutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/recurring", recurringRoutes);

module.exports = app