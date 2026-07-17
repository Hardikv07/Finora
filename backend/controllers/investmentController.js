const Investment = require("../models/investment");
const Wallet = require("../models/wallet");

/**
 * @desc    Create new portfolio investment entry
 * @route   POST /api/investments
 * @access  Private
 */
const createInvestment = async (req, res) => {
    try {
        const {
            name, symbolOrTicker, assetType, investedAmount, currentValue,
            quantity, purchasePricePerUnit, purchaseDate, currency,
            isSIP, sipMonthlyAmount, sipNextDueDate, interestRateOrExpectedCAGR,
            maturityDate, dividendsReceived, notes, wallet
        } = req.body;

        if (!name || investedAmount === undefined || currentValue === undefined) {
            return res.status(400).json({ message: "Asset name, invested amount, and current value are required." });
        }

        // Optional: If a wallet is provided and user wants to deduct investment cost from wallet balance
        if (wallet && req.body.deductFromWallet === true) {
            const walletDoc = await Wallet.findOne({ _id: wallet, user: req.user._id });
            if (!walletDoc) {
                return res.status(404).json({ message: "Specified wallet not found or unauthorized." });
            }
            if (walletDoc.balance < Number(investedAmount)) {
                return res.status(400).json({ message: `Insufficient wallet balance (${walletDoc.balance}) for this investment (${investedAmount}).` });
            }
            walletDoc.balance -= Number(investedAmount);
            await walletDoc.save();
        }

        const investment = new Investment({
            user: req.user._id,
            wallet: wallet || null,
            name,
            symbolOrTicker,
            assetType: assetType || "Stocks",
            investedAmount: Number(investedAmount),
            currentValue: Number(currentValue),
            quantity: quantity ? Number(quantity) : 1,
            purchasePricePerUnit: purchasePricePerUnit ? Number(purchasePricePerUnit) : Number(investedAmount) / (Number(quantity) || 1),
            purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
            currency: currency || "INR",
            isSIP: isSIP === true || isSIP === "true",
            sipMonthlyAmount: sipMonthlyAmount ? Number(sipMonthlyAmount) : 0,
            sipNextDueDate: sipNextDueDate ? new Date(sipNextDueDate) : null,
            interestRateOrExpectedCAGR: interestRateOrExpectedCAGR ? Number(interestRateOrExpectedCAGR) : 0,
            maturityDate: maturityDate ? new Date(maturityDate) : null,
            dividendsReceived: dividendsReceived ? Number(dividendsReceived) : 0,
            notes
        });

        await investment.save();

        res.status(201).json({
            message: "Investment added successfully to your portfolio!",
            investment
        });
    } catch (error) {
        console.error("Error creating investment:", error);
        res.status(500).json({ message: "Failed to add investment", error: error.message });
    }
};

/**
 * @desc    Get all user investments with complete portfolio analytics and asset allocation summary
 * @route   GET /api/investments
 * @access  Private
 */
const getInvestments = async (req, res) => {
    try {
        const { assetType, isSIP, search } = req.query;
        const filter = { user: req.user._id };

        if (assetType && assetType !== "ALL") {
            filter.assetType = assetType;
        }
        if (isSIP !== undefined) {
            filter.isSIP = isSIP === "true";
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { symbolOrTicker: { $regex: search, $options: "i" } }
            ];
        }

        const investments = await Investment.find(filter).sort({ currentValue: -1 });

        // Calculate total portfolio summary across all investments
        let totalInvested = 0;
        let totalCurrentValue = 0;
        let totalDividends = 0;
        const allocationMap = {};

        investments.forEach(inv => {
            totalInvested += inv.investedAmount;
            totalCurrentValue += inv.currentValue;
            totalDividends += (inv.dividendsReceived || 0);

            const type = inv.assetType || "Other";
            if (!allocationMap[type]) {
                allocationMap[type] = { amount: 0, count: 0 };
            }
            allocationMap[type].amount += inv.currentValue;
            allocationMap[type].count += 1;
        });

        const totalProfitOrLoss = Number((totalCurrentValue - totalInvested + totalDividends).toFixed(2));
        const overallRoiPercentage = totalInvested > 0 
            ? Number(((totalProfitOrLoss / totalInvested) * 100).toFixed(2)) 
            : 0;

        // Convert allocation map to array with percentage weights for Pie/Donut Chart rendering
        const assetAllocation = Object.keys(allocationMap).map(type => ({
            assetType: type,
            value: Number(allocationMap[type].amount.toFixed(2)),
            count: allocationMap[type].count,
            percentage: totalCurrentValue > 0 
                ? Number(((allocationMap[type].amount / totalCurrentValue) * 100).toFixed(2)) 
                : 0
        }));

        res.status(200).json({
            summary: {
                totalInvested: Number(totalInvested.toFixed(2)),
                totalCurrentValue: Number(totalCurrentValue.toFixed(2)),
                totalDividends: Number(totalDividends.toFixed(2)),
                totalProfitOrLoss,
                overallRoiPercentage,
                totalAssetsCount: investments.length,
                assetAllocation
            },
            investments
        });
    } catch (error) {
        console.error("Error fetching investments:", error);
        res.status(500).json({ message: "Failed to retrieve investments", error: error.message });
    }
};

/**
 * @desc    Get single investment asset detail
 * @route   GET /api/investments/:id
 * @access  Private
 */
const getInvestmentById = async (req, res) => {
    try {
        const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
        if (!investment) {
            return res.status(404).json({ message: "Investment asset not found." });
        }
        res.status(200).json({ investment });
    } catch (error) {
        console.error("Error fetching investment by id:", error);
        res.status(500).json({ message: "Failed to retrieve investment detail", error: error.message });
    }
};

/**
 * @desc    Update investment valuation, quantity, dividends, or notes
 * @route   PUT /api/investments/:id
 * @access  Private
 */
const updateInvestment = async (req, res) => {
    try {
        const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
        if (!investment) {
            return res.status(404).json({ message: "Investment asset not found." });
        }

        const updatableFields = [
            "name", "symbolOrTicker", "assetType", "investedAmount", "currentValue",
            "quantity", "purchasePricePerUnit", "purchaseDate", "currency",
            "isSIP", "sipMonthlyAmount", "sipNextDueDate", "interestRateOrExpectedCAGR",
            "maturityDate", "dividendsReceived", "notes", "wallet"
        ];

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (["investedAmount", "currentValue", "quantity", "purchasePricePerUnit", "sipMonthlyAmount", "interestRateOrExpectedCAGR", "dividendsReceived"].includes(field)) {
                    investment[field] = Number(req.body[field]);
                } else if (["purchaseDate", "sipNextDueDate", "maturityDate"].includes(field)) {
                    investment[field] = req.body[field] ? new Date(req.body[field]) : null;
                } else if (field === "isSIP") {
                    investment[field] = req.body[field] === true || req.body[field] === "true";
                } else {
                    investment[field] = req.body[field];
                }
            }
        });

        await investment.save();
        res.status(200).json({ message: "Investment updated successfully", investment });
    } catch (error) {
        console.error("Error updating investment:", error);
        res.status(500).json({ message: "Failed to update investment", error: error.message });
    }
};

/**
 * @desc    Delete an investment asset
 * @route   DELETE /api/investments/:id
 * @access  Private
 */
const deleteInvestment = async (req, res) => {
    try {
        const investment = await Investment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!investment) {
            return res.status(404).json({ message: "Investment asset not found." });
        }
        res.status(200).json({ message: "Investment asset removed from portfolio successfully." });
    } catch (error) {
        console.error("Error deleting investment:", error);
        res.status(500).json({ message: "Failed to delete investment", error: error.message });
    }
};

module.exports = {
    createInvestment,
    getInvestments,
    getInvestmentById,
    updateInvestment,
    deleteInvestment
};
