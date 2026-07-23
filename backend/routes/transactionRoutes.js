// ============================================================================
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
    deleteTransaction,
    parseBillFromUpload,
    parseOcrText
} = require("../controllers/transactionController");
 
// Parse OCR text using Gemini AI
router.post("/parse-ocr", protect, parseOcrText);
 
// Parse bill file and return extracted data (must be before generic POST /)
router.post("/parse-bill", protect, uploadReceipt, handleReceiptUpload, parseBillFromUpload);

// Create Transaction with optional multipart receipt file upload
router.post("/", protect, uploadReceipt, handleReceiptUpload, createTransaction);
router.get("/", protect, getTransactions);
router.put("/:id", protect, uploadReceipt, handleReceiptUpload, updateTransaction);
router.delete("/:id", protect, deleteTransaction);
 
module.exports = router;
