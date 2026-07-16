const express = require("express");
const goalRouter = express.Router();
const { protect } = require("../middleware/authmiddleware");
const {
    createGoal,
    getGoals,
    updateGoal,
    deleteGoal,
    contributeToGoal
} = require("../controllers/goalController");

// Manual contribution endpoint
goalRouter.post("/:id/contribute", protect, contributeToGoal);

// Standard CRUD endpoints for Goals
goalRouter.post("/", protect, createGoal);
goalRouter.get("/", protect, getGoals);
goalRouter.put("/:id", protect, updateGoal);
goalRouter.delete("/:id", protect, deleteGoal);

module.exports = goalRouter;
