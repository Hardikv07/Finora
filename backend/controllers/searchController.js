const searchService = require('../services/searchService');
const Transaction = require('../models/transaction');

/**
 * @desc    Get autocomplete suggestions for a search query using Trie
 * @route   GET /api/search/suggestions
 * @access  Private
 */
const getSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(200).json({ success: true, suggestions: [] });
        }

        const suggestions = await searchService.getSuggestions(req.user._id, q);

        return res.status(200).json({
            success: true,
            suggestions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get suggestions.", error: error.message });
    }
};

/**
 * @desc    Search transactions using Trie to quickly find matching document IDs
 * @route   GET /api/search/transactions
 * @access  Private
 */
const searchTransactions = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim() === '') {
            return res.status(200).json({ success: true, transactions: [] });
        }

        // Fast path: use Trie to find all matching transaction IDs
        const trie = await searchService.getUserTrie(req.user._id);
        const results = trie.searchPrefix(q);
        
        // Aggregate all unique transaction IDs from all matching words
        const matchingIds = new Set();
        results.forEach(result => {
            result.transactionIds.forEach(id => matchingIds.add(id));
        });

        // Fetch actual documents from MongoDB using the matched IDs
        const transactions = await Transaction.find({
            _id: { $in: Array.from(matchingIds) },
            user: req.user._id
        })
        .populate("wallet", "name type color currency")
        .sort({ date: -1 })
        .limit(50); // Limit results for performance

        return res.status(200).json({
            success: true,
            transactions
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Failed to search transactions.", error: error.message });
    }
};

module.exports = {
    getSuggestions,
    searchTransactions
};
