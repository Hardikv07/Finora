// ============================================================================
// backend/routes/walletRoutes.js
// ============================================================================
const express = require("express");
const walletRouter = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { 
    createWallet,
    getWallets,
    getWalletById,
    updateWallet,
    deleteWallet,
    transferFunds 
} = require("../controllers/walletController");

// Wallet transfer endpoint (ACID transaction)
walletRouter.post("/transfer", protect, transferFunds);

// Standard CRUD endpoints for Wallets
walletRouter.post("/", protect, createWallet);
walletRouter.get("/", protect, getWallets);
walletRouter.get("/:id", protect, getWalletById);
walletRouter.put("/:id", protect, updateWallet);
walletRouter.delete("/:id", protect, deleteWallet);

module.exports = walletRouter;
