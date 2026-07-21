const cron = require("node-cron");
const Bill = require("../models/bill");
const Budget = require("../models/budget");
const Transaction = require("../models/transaction");
const User = require("../models/user");
const sendEmail = require("../utils/sendemail");

// Run every day at 08:00 AM
cron.schedule("0 8 * * *", async () => {
    console.log("Running daily background jobs...");
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        // 1. Bill Reminders
        const upcomingBills = await Bill.find({
            status: { $ne: "PAID" },
            dueDate: { $lte: threeDaysFromNow, $gte: now }
        }).populate("user", "email name");

        for (const bill of upcomingBills) {
            if (bill.user && bill.user.email) {
                await sendEmail({
                    email: bill.user.email,
                    subject: `Bill Reminder: ${bill.name} is due soon!`,
                    html: `<h3>Hello ${bill.user.name},</h3><p>Your bill for <b>${bill.name}</b> of amount <b>${bill.amount}</b> is due on ${new Date(bill.dueDate).toLocaleDateString()}. Please ensure it is paid on time.</p>`
                });
            }
        }

        // 2. Budget Alerts (Check if spent > 80% of limit)
        const activeBudgets = await Budget.find({
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate("user", "email name");

        for (const budget of activeBudgets) {
            const matchQuery = {
                user: budget.user._id,
                type: "EXPENSE",
                date: { $gte: budget.startDate, $lte: budget.endDate }
            };
            
            if (budget.category && budget.category !== "ALL") {
                matchQuery.category = budget.category;
            }

            const agg = await Transaction.aggregate([
                { $match: matchQuery },
                { $group: { _id: null, spent: { $sum: "$amount" } } }
            ]);

            const spent = agg.length > 0 ? agg[0].spent : 0;
            const thresholdAmount = budget.amountLimit * 0.8; // 80%

            if (spent >= thresholdAmount && budget.user && budget.user.email) {
                await sendEmail({
                    email: budget.user.email,
                    subject: `Budget Alert: Nearing limit for ${budget.category || 'Overall'}`,
                    html: `<h3>Hello ${budget.user.name},</h3><p>You have spent <b>${spent}</b> which is ${((spent/budget.amountLimit)*100).toFixed(1)}% of your budget limit (<b>${budget.amountLimit}</b>) for ${budget.category || 'Overall'}.</p>`
                });
            }
        }

        console.log("Daily background jobs completed successfully.");
    } catch (error) {
        console.error("Error running daily background jobs:", error);
    }
});
