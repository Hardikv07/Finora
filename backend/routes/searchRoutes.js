const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { getSuggestions, searchTransactions } = require("../controllers/searchController");

router.get("/suggestions", protect, getSuggestions);
router.get("/transactions", protect, searchTransactions);

module.exports = router;
