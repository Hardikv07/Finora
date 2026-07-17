const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const { handleReceiptUpload, uploadReceipt } = require("../middleware/uploadmiddleware");
const {
    createBill,
    getBills,
    getBillById,
    markBillPaid,
    updateBill,
    deleteBill
} = require("../controllers/billController");

router.route("/")
    .post(protect, uploadReceipt, handleReceiptUpload, logAudit("CREATED_BILL"), createBill)
    .get(protect, getBills);

router.route("/:id")
    .get(protect, getBillById)
    .put(protect, uploadReceipt, handleReceiptUpload, logAudit("UPDATED_BILL"), updateBill)
    .delete(protect, logAudit("DELETED_BILL"), deleteBill);

router.route("/:id/pay")
    .post(protect, logAudit("PAID_BILL"), markBillPaid);

module.exports = router;
