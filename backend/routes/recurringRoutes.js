const express = require("express");
const recurringRouter = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
    createRecurringTransaction,
    getRecurringTransactions,
    updateRecurringTransaction,
    deleteRecurringTransaction,
    processDueRecurringTransactions
} = require("../controllers/recurringController");

// Process due recurring transactions endpoint
recurringRouter.post("/process", protect, processDueRecurringTransactions);

// Standard CRUD endpoints for Recurring Schedules
recurringRouter.post("/", protect, createRecurringTransaction);
recurringRouter.get("/", protect, getRecurringTransactions);
recurringRouter.put("/:id", protect, updateRecurringTransaction);
recurringRouter.delete("/:id", protect, deleteRecurringTransaction);

module.exports = recurringRouter;
