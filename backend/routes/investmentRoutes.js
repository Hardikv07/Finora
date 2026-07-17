const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const {
    createInvestment,
    getInvestments,
    getInvestmentById,
    updateInvestment,
    deleteInvestment
} = require("../controllers/investmentController");

router.route("/")
    .post(protect, logAudit("CREATED_INVESTMENT"), createInvestment)
    .get(protect, getInvestments);

router.route("/:id")
    .get(protect, getInvestmentById)
    .put(protect, logAudit("UPDATED_INVESTMENT"), updateInvestment)
    .delete(protect, logAudit("DELETED_INVESTMENT"), deleteInvestment);

module.exports = router;
