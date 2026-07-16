const express = require("express");
const budgetRouter = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
    createBudget,
    getBudgets,
    updateBudget,
    deleteBudget,
    rolloverBudget
} = require("../controllers/budgetController");

// Budget rollover endpoint (DIY Learning Challenge)
budgetRouter.post("/rollover", protect, rolloverBudget);

// Standard CRUD endpoints for Budgets
budgetRouter.post("/", protect, createBudget);
budgetRouter.get("/", protect, getBudgets);
budgetRouter.put("/:id", protect, updateBudget);
budgetRouter.delete("/:id", protect, deleteBudget);

module.exports = budgetRouter;
