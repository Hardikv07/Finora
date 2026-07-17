const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const {
    calculateEmiPreview,
    createLoan,
    getLoans,
    getLoanById,
    payLoanEmi,
    deleteLoan
} = require("../controllers/loanController");

router.route("/calculate-emi")
    .post(calculateEmiPreview);

router.route("/")
    .post(protect, logAudit("CREATED_LOAN"), createLoan)
    .get(protect, getLoans);

router.route("/:id")
    .get(protect, getLoanById)
    .delete(protect, logAudit("DELETED_LOAN"), deleteLoan);

router.route("/:id/pay-emi")
    .post(protect, logAudit("PAID_LOAN_EMI"), payLoanEmi);

module.exports = router;
