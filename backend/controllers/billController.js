const Bill = require("../models/bill");
const Wallet = require("../models/wallet");
const Transaction = require("../models/transaction");

/**
 * @desc    Create new recurring/upcoming utility bill
 * @route   POST /api/bills
 * @access  Private
 */
const createBill = async (req, res) => {
    try {
        const {
            title, category, billerNameOrProvider, amount, dueDate,
            autoReminder, repeatMonthly, notes, receiptUrl, receiptPublicId
        } = req.body;

        if (!title || amount === undefined || !dueDate) {
            return res.status(400).json({ message: "Bill title, amount, and due date are required." });
        }

        const bill = new Bill({
            user: req.user._id,
            title,
            category: category || "Electricity",
            billerNameOrProvider,
            amount: Number(amount),
            dueDate: new Date(dueDate),
            autoReminder: autoReminder !== undefined ? (autoReminder === true || autoReminder === "true") : true,
            repeatMonthly: repeatMonthly === true || repeatMonthly === "true",
            status: new Date(dueDate) < new Date() ? "OVERDUE" : "PENDING",
            attachedInvoiceUrl: receiptUrl || req.body.attachedInvoiceUrl || null,
            attachedInvoicePublicId: receiptPublicId || req.body.attachedInvoicePublicId || null,
            notes
        });

        await bill.save();

        res.status(201).json({
            message: "Bill created successfully!",
            bill
        });
    } catch (error) {
        console.error("Error creating bill:", error);
        res.status(500).json({ message: "Failed to create bill", error: error.message });
    }
};

/**
 * @desc    Get all user bills with status filtering and upcoming due alerts summary
 * @route   GET /api/bills
 * @access  Private
 */
const getBills = async (req, res) => {
    try {
        const { status, category } = req.query;
        const filter = { user: req.user._id };

        if (status && status !== "ALL") {
            filter.status = status;
        }
        if (category && category !== "ALL") {
            filter.category = category;
        }

        const bills = await Bill.find(filter).sort({ dueDate: 1 });

        // Check if any PENDING bills are past due and auto-mark them as OVERDUE
        const now = new Date();
        const updatedBills = [];
        let totalPendingAmount = 0;
        let totalOverdueAmount = 0;
        let upcomingBillsCount = 0;

        for (let bill of bills) {
            if (bill.status === "PENDING" && new Date(bill.dueDate) < now) {
                bill.status = "OVERDUE";
                await bill.save();
            }

            if (bill.status === "PENDING") {
                totalPendingAmount += bill.amount;
                const daysDifference = (new Date(bill.dueDate) - now) / (1000 * 60 * 60 * 24);
                if (daysDifference >= 0 && daysDifference <= 7) {
                    upcomingBillsCount += 1;
                }
            } else if (bill.status === "OVERDUE") {
                totalOverdueAmount += bill.amount;
            }

            updatedBills.push(bill);
        }

        res.status(200).json({
            summary: {
                totalPendingAmount: Number(totalPendingAmount.toFixed(2)),
                totalOverdueAmount: Number(totalOverdueAmount.toFixed(2)),
                totalUnpaidAmount: Number((totalPendingAmount + totalOverdueAmount).toFixed(2)),
                upcomingDueIn7DaysCount: upcomingBillsCount,
                unpaidBillsCount: updatedBills.filter(b => b.status !== "PAID").length
            },
            bills: updatedBills
        });
    } catch (error) {
        console.error("Error fetching bills:", error);
        res.status(500).json({ message: "Failed to retrieve bills", error: error.message });
    }
};

/**
 * @desc    Get single bill details
 * @route   GET /api/bills/:id
 * @access  Private
 */
const getBillById = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
        if (!bill) {
            return res.status(404).json({ message: "Bill not found." });
        }
        res.status(200).json({ bill });
    } catch (error) {
        console.error("Error fetching bill by id:", error);
        res.status(500).json({ message: "Failed to retrieve bill details", error: error.message });
    }
};

/**
 * @desc    Pay a bill (deducts from wallet, records transaction, and optionally creates next month's bill if repeatMonthly)
 * @route   POST /api/bills/:id/pay
 * @access  Private
 */
const markBillPaid = async (req, res) => {
    try {
        const { walletId, amountPaid, paymentDate, notes } = req.body;

        const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
        if (!bill) {
            return res.status(404).json({ message: "Bill not found." });
        }
        if (bill.status === "PAID") {
            return res.status(400).json({ message: "This bill is already marked as paid." });
        }

        if (!walletId) {
            return res.status(400).json({ message: "Please specify the wallet used to pay this bill." });
        }

        const wallet = await Wallet.findOne({ _id: walletId, user: req.user._id });
        if (!wallet) {
            return res.status(404).json({ message: "Specified wallet not found or unauthorized." });
        }

        const payAmount = amountPaid ? Number(amountPaid) : bill.amount;
        if (wallet.balance < payAmount) {
            return res.status(400).json({ message: `Insufficient funds in wallet "${wallet.name}" (Balance: ₹${wallet.balance}) to pay bill of ₹${payAmount}.` });
        }

        // Create Expense Transaction (triggers post-save hook to deduct balance!)
        const transaction = new Transaction({
            user: req.user._id,
            wallet: walletId,
            type: "EXPENSE",
            amount: payAmount,
            currency: wallet.currency,
            category: "Utility Bill",
            subCategory: bill.category,
            merchant: bill.billerNameOrProvider || bill.title,
            receiptUrl: bill.attachedInvoiceUrl || null,
            notes: notes || `Paid utility bill: ${bill.title}`,
            date: paymentDate ? new Date(paymentDate) : new Date()
        });
        await transaction.save();

        // Update bill status and payment history
        bill.status = "PAID";
        bill.paymentHistory.push({
            paidOn: transaction.date,
            amountPaid: payAmount,
            walletUsed: walletId,
            transactionId: transaction._id,
            receiptUrl: bill.attachedInvoiceUrl
        });

        await bill.save();

        // If repeatMonthly is enabled, generate next month's bill instance automatically
        let nextMonthBill = null;
        if (bill.repeatMonthly) {
            const nextDue = new Date(bill.dueDate);
            nextDue.setMonth(nextDue.getMonth() + 1);

            nextMonthBill = new Bill({
                user: req.user._id,
                title: bill.title,
                category: bill.category,
                billerNameOrProvider: bill.billerNameOrProvider,
                amount: bill.amount,
                dueDate: nextDue,
                autoReminder: bill.autoReminder,
                repeatMonthly: true,
                status: "PENDING",
                notes: `Auto-generated recurring monthly bill from ${bill.title}`
            });
            await nextMonthBill.save();
        }

        res.status(200).json({
            message: `Bill "${bill.title}" marked as PAID via wallet "${wallet.name}"!`,
            bill,
            transactionSummary: {
                transactionId: transaction._id,
                amountPaid: payAmount,
                walletName: wallet.name
            },
            nextMonthAutoGeneratedBill: nextMonthBill
        });
    } catch (error) {
        console.error("Error paying bill:", error);
        res.status(500).json({ message: "Failed to process bill payment", error: error.message });
    }
};

/**
 * @desc    Update bill details
 * @route   PUT /api/bills/:id
 * @access  Private
 */
const updateBill = async (req, res) => {
    try {
        const bill = await Bill.findOne({ _id: req.params.id, user: req.user._id });
        if (!bill) {
            return res.status(404).json({ message: "Bill not found." });
        }

        const updatableFields = ["title", "category", "billerNameOrProvider", "amount", "dueDate", "autoReminder", "repeatMonthly", "status", "notes"];
        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === "amount") bill[field] = Number(req.body[field]);
                else if (field === "dueDate") bill[field] = new Date(req.body[field]);
                else if (["autoReminder", "repeatMonthly"].includes(field)) bill[field] = req.body[field] === true || req.body[field] === "true";
                else bill[field] = req.body[field];
            }
        });

        await bill.save();
        res.status(200).json({ message: "Bill updated successfully", bill });
    } catch (error) {
        console.error("Error updating bill:", error);
        res.status(500).json({ message: "Failed to update bill", error: error.message });
    }
};

/**
 * @desc    Delete a bill record
 * @route   DELETE /api/bills/:id
 * @access  Private
 */
const deleteBill = async (req, res) => {
    try {
        const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!bill) {
            return res.status(404).json({ message: "Bill not found." });
        }
        res.status(200).json({ message: "Bill record deleted successfully." });
    } catch (error) {
        console.error("Error deleting bill:", error);
        res.status(500).json({ message: "Failed to delete bill", error: error.message });
    }
};

module.exports = {
    createBill,
    getBills,
    getBillById,
    markBillPaid,
    updateBill,
    deleteBill
};
