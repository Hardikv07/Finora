const Loan = require("../models/loan");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

/**
 * Helper: Calculate exact monthly EMI using standard financial formula:
 * E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 * @param {Number} P - Principal
 * @param {Number} annualRate - Annual interest rate (e.g. 8.5 for 8.5%)
 * @param {Number} n - Tenure in months
 * @returns {Number} Monthly EMI rounded to 2 decimal places
 */
const calculateEmiFormula = (P, annualRate, n) => {
    if (!annualRate || annualRate === 0) return Number((P / n).toFixed(2));
    const r = annualRate / (12 * 100);
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Number(emi.toFixed(2));
};

/**
 * @desc    Standalone EMI Calculator API (Preview EMI and total interest without saving)
 * @route   POST /api/loans/calculate-emi
 * @access  Private / Public
 */
const calculateEmiPreview = async (req, res) => {
    try {
        const { principalAmount, interestRatePerAnnum, tenureMonths } = req.body;
        
        const P = Number(principalAmount);
        const rate = Number(interestRatePerAnnum);
        const n = Number(tenureMonths);

        if (!P || P <= 0 || !n || n <= 0 || rate < 0) {
            return res.status(400).json({ message: "Invalid input parameters for EMI calculation." });
        }

        const monthlyEmi = calculateEmiFormula(P, rate, n);
        const totalAmountPayable = Number((monthlyEmi * n).toFixed(2));
        const totalInterestPayable = Number((totalAmountPayable - P).toFixed(2));

        // Generate quick amortization breakdown for the first 12 months
        const previewAmortization = [];
        let balance = P;
        const monthlyRate = rate / (12 * 100);

        for (let month = 1; month <= Math.min(n, 12); month++) {
            const interestPart = Number((balance * monthlyRate).toFixed(2));
            const principalPart = Number((monthlyEmi - interestPart).toFixed(2));
            balance = Number(Math.max(0, balance - principalPart).toFixed(2));

            previewAmortization.push({
                month,
                emi: monthlyEmi,
                interestComponent: interestPart,
                principalComponent: principalPart,
                remainingPrincipal: balance
            });
        }

        res.status(200).json({
            principalAmount: P,
            interestRatePerAnnum: rate,
            tenureMonths: n,
            monthlyEmi,
            totalInterestPayable,
            totalAmountPayable,
            previewAmortization
        });
    } catch (error) {
        console.error("Error in calculateEmiPreview:", error);
        res.status(500).json({ message: "Error calculating EMI preview", error: error.message });
    }
};

/**
 * @desc    Create new loan tracking entry
 * @route   POST /api/loans
 * @access  Private
 */
const createLoan = async (req, res) => {
    try {
        const {
            loanName, loanType, lenderName, principalAmount, remainingBalance,
            interestRatePerAnnum, tenureMonths, monthlyEmi, startDate,
            nextDueDate, dueAlertsEnabled, wallet, notes
        } = req.body;

        if (!loanName || !principalAmount || principalAmount <= 0 || !tenureMonths || tenureMonths <= 0) {
            return res.status(400).json({ message: "Loan name, valid principal amount, and tenure in months are required." });
        }

        const calculatedEmi = monthlyEmi ? Number(monthlyEmi) : calculateEmiFormula(Number(principalAmount), Number(interestRatePerAnnum || 0), Number(tenureMonths));

        const loan = new Loan({
            user: req.user._id,
            wallet: wallet || null,
            loanName,
            loanType: loanType || "Personal Loan",
            lenderName,
            principalAmount: Number(principalAmount),
            remainingBalance: remainingBalance !== undefined ? Number(remainingBalance) : Number(principalAmount),
            interestRatePerAnnum: Number(interestRatePerAnnum || 0),
            tenureMonths: Number(tenureMonths),
            monthlyEmi: calculatedEmi,
            startDate: startDate ? new Date(startDate) : new Date(),
            nextDueDate: nextDueDate ? new Date(nextDueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days ahead
            dueAlertsEnabled: dueAlertsEnabled !== undefined ? (dueAlertsEnabled === true || dueAlertsEnabled === "true") : true,
            notes
        });

        await loan.save();

        res.status(201).json({
            message: "Loan added and EMI schedule setup successfully!",
            loan
        });
    } catch (error) {
        console.error("Error creating loan:", error);
        res.status(500).json({ message: "Failed to create loan", error: error.message });
    }
};

/**
 * @desc    Get all user loans along with debt dashboard summary
 * @route   GET /api/loans
 * @access  Private
 */
const getLoans = async (req, res) => {
    try {
        const { isClosed, loanType } = req.query;
        const filter = { user: req.user._id };

        if (isClosed !== undefined) {
            filter.isClosed = isClosed === "true";
        }
        if (loanType && loanType !== "ALL") {
            filter.loanType = loanType;
        }

        const loans = await Loan.find(filter).sort({ nextDueDate: 1 });

        // Calculate Debt Summary
        let totalPrincipalDebt = 0;
        let totalRemainingDebt = 0;
        let totalMonthlyEmiBurden = 0;
        let totalInterestPaid = 0;
        let totalPrincipalPaid = 0;

        loans.forEach(loan => {
            if (!loan.isClosed) {
                totalRemainingDebt += loan.remainingBalance;
                totalMonthlyEmiBurden += loan.monthlyEmi;
            }
            totalPrincipalDebt += loan.principalAmount;
            totalInterestPaid += (loan.totalInterestPaidSoFar || 0);
            totalPrincipalPaid += (loan.totalPrincipalPaidSoFar || 0);
        });

        res.status(200).json({
            summary: {
                totalPrincipalDebt: Number(totalPrincipalDebt.toFixed(2)),
                totalRemainingDebt: Number(totalRemainingDebt.toFixed(2)),
                totalMonthlyEmiBurden: Number(totalMonthlyEmiBurden.toFixed(2)),
                totalInterestPaid: Number(totalInterestPaid.toFixed(2)),
                totalPrincipalPaid: Number(totalPrincipalPaid.toFixed(2)),
                activeLoansCount: loans.filter(l => !l.isClosed).length
            },
            loans
        });
    } catch (error) {
        console.error("Error fetching loans:", error);
        res.status(500).json({ message: "Failed to retrieve loans", error: error.message });
    }
};

/**
 * @desc    Get single loan details
 * @route   GET /api/loans/:id
 * @access  Private
 */
const getLoanById = async (req, res) => {
    try {
        const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id }).populate("wallet", "name type balance currency");
        if (!loan) {
            return res.status(404).json({ message: "Loan account not found." });
        }
        res.status(200).json({ loan });
    } catch (error) {
        console.error("Error fetching loan by id:", error);
        res.status(500).json({ message: "Failed to retrieve loan details", error: error.message });
    }
};

/**
 * @desc    Pay monthly EMI for a loan (deducts from wallet, records transaction, splits principal vs interest)
 * @route   POST /api/loans/:id/pay-emi
 * @access  Private
 */
const payLoanEmi = async (req, res) => {
    try {
        const { amountPaid, walletId, paymentDate, notes } = req.body;
        
        const loan = await Loan.findOne({ _id: req.params.id, user: req.user._id });
        if (!loan) {
            return res.status(404).json({ message: "Loan account not found." });
        }
        if (loan.isClosed || loan.remainingBalance <= 0) {
            return res.status(400).json({ message: "This loan is already fully closed/settled." });
        }

        const paymentAmount = amountPaid ? Number(amountPaid) : loan.monthlyEmi;
        if (paymentAmount <= 0) {
            return res.status(400).json({ message: "Payment amount must be greater than zero." });
        }

        const targetWalletId = walletId || loan.wallet;
        if (!targetWalletId) {
            return res.status(400).json({ message: "Please specify a wallet from which to deduct the EMI payment." });
        }

        const wallet = await Wallet.findOne({ _id: targetWalletId, user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: "Selected wallet not found or unauthorized." });
        }
        if (wallet.balance < paymentAmount) {
            return res.status(400).json({ message: `Insufficient funds in wallet "${wallet.name}" (Balance: ₹${wallet.balance}) to pay EMI of ₹${paymentAmount}.` });
        }

        // Calculate interest component vs principal component
        const monthlyRate = (loan.interestRatePerAnnum || 0) / (12 * 100);
        const interestPart = Number((loan.remainingBalance * monthlyRate).toFixed(2));
        const principalPart = Number(Math.max(0, paymentAmount - interestPart).toFixed(2));

        // Create transaction entry for EMI payment (Mongoose post-save hook will deduct balance from wallet!)
        const transaction = new Transaction({
            user: req.user._id,
            wallet: targetWalletId,
            type: "EXPENSE",
            amount: paymentAmount,
            currency: wallet.currency,
            category: "EMI / Loan Payment",
            subCategory: loan.loanType,
            merchant: loan.lenderName || "Lender",
            notes: notes || `EMI payment for ${loan.loanName} (Principal: ₹${principalPart}, Interest: ₹${interestPart})`,
            date: paymentDate ? new Date(paymentDate) : new Date()
        });
        await transaction.save();

        // Update Loan balance and payment history
        loan.remainingBalance = Number(Math.max(0, loan.remainingBalance - principalPart).toFixed(2));
        loan.totalInterestPaidSoFar = Number((loan.totalInterestPaidSoFar + interestPart).toFixed(2));
        loan.totalPrincipalPaidSoFar = Number((loan.totalPrincipalPaidSoFar + principalPart).toFixed(2));

        loan.paymentHistory.push({
            paymentDate: transaction.date,
            amountPaid: paymentAmount,
            principalComponent: principalPart,
            interestComponent: interestPart,
            notes: notes || `Paid EMI via ${wallet.name}`,
            transactionId: transaction._id
        });

        if (loan.remainingBalance <= 0) {
            loan.isClosed = true;
        } else {
            // Advance nextDueDate by 1 month
            const currentDueDate = new Date(loan.nextDueDate || Date.now());
            currentDueDate.setMonth(currentDueDate.getMonth() + 1);
            loan.nextDueDate = currentDueDate;
        }

        await loan.save();

        res.status(200).json({
            message: loan.isClosed ? `🎉 EMI paid! Loan "${loan.loanName}" is now FULLY SETTLED!` : `EMI of ₹${paymentAmount} paid successfully! Remaining principal balance: ₹${loan.remainingBalance}.`,
            loan,
            transactionSummary: {
                transactionId: transaction._id,
                amountPaid: paymentAmount,
                principalComponent: principalPart,
                interestComponent: interestPart,
                newRemainingBalance: loan.remainingBalance,
                nextDueDate: loan.nextDueDate
            }
        });
    } catch (error) {
        console.error("Error processing EMI payment:", error);
        res.status(500).json({ message: "Failed to process EMI payment", error: error.message });
    }
};

/**
 * @desc    Delete a loan tracking record
 * @route   DELETE /api/loans/:id
 * @access  Private
 */
const deleteLoan = async (req, res) => {
    try {
        const loan = await Loan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!loan) {
            return res.status(404).json({ message: "Loan account not found." });
        }
        res.status(200).json({ message: "Loan tracking record deleted successfully." });
    } catch (error) {
        console.error("Error deleting loan:", error);
        res.status(500).json({ message: "Failed to delete loan", error: error.message });
    }
};

module.exports = {
    calculateEmiPreview,
    createLoan,
    getLoans,
    getLoanById,
    payLoanEmi,
    deleteLoan
};
