// ============================================================================
// backend/routes/transactionRoutes.js
// ============================================================================
const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { uploadReceipt, handleReceiptUpload } = require("../middleware/uploadmiddleware");
const { 
    createTransaction, 
    getTransactions, 
    updateTransaction, 
    deleteTransaction 
} = require("../controllers/transactionController");
 
// Create Transaction with optional multipart receipt file upload
router.post("/", protect, uploadReceipt, handleReceiptUpload, createTransaction);
router.get("/", protect, getTransactions);
router.put("/:id", protect, uploadReceipt, handleReceiptUpload, updateTransaction);
router.delete("/:id", protect, deleteTransaction);
 
module.exports = router;
