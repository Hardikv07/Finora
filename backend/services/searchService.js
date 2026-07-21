const Trie = require('../utils/Trie');
const Transaction = require('../models/transaction');

class SearchService {
    constructor() {
        this.userTries = new Map(); // Map<userId, Trie>
    }

    /**
     * Extracts searchable words from a transaction document.
     * Searches across merchant, category, tags, notes.
     * @param {Object} transaction 
     * @returns {Array<string>} Unique words extracted
     */
    _extractSearchableWords(transaction) {
        const words = new Set();
        
        // Exact strings that represent distinct concepts
        if (transaction.merchant) words.add(transaction.merchant);
        if (transaction.category) words.add(transaction.category);
        if (transaction.subCategory) words.add(transaction.subCategory);
        
        // Tags are already arrays of strings
        if (transaction.tags && Array.isArray(transaction.tags)) {
            transaction.tags.forEach(tag => words.add(tag));
        }

        // Notes can be a sentence, we split by spaces
        if (transaction.notes) {
            const tokens = transaction.notes.split(/\s+/);
            tokens.forEach(token => {
                // simple cleanup for punctuation
                const cleanToken = token.replace(/[^a-zA-Z0-9]/g, '');
                if (cleanToken.length > 2) {
                    words.add(cleanToken);
                }
            });
        }

        return Array.from(words);
    }

    /**
     * Builds and caches the Trie for a specific user from MongoDB.
     * @param {string} userId 
     * @returns {Trie}
     */
    async buildTrieForUser(userId) {
        try {
            const trie = new Trie();
            const transactions = await Transaction.find({ user: userId }).select('merchant category subCategory tags notes _id');
            
            for (const tx of transactions) {
                const words = this._extractSearchableWords(tx);
                for (const word of words) {
                    trie.insert(word, tx._id.toString());
                }
            }
            
            this.userTries.set(userId.toString(), trie);
            return trie;
        } catch (error) {
            console.error(`Failed to build Trie for user ${userId}:`, error);
            throw error;
        }
    }

    /**
     * Loads Tries for all users who have transactions.
     * Called on server startup.
     */
    async loadAllTries() {
        try {
            console.log("Loading search Tries into memory...");
            const distinctUsers = await Transaction.distinct('user');
            for (const userId of distinctUsers) {
                await this.buildTrieForUser(userId);
            }
            console.log(`Successfully loaded Tries for ${distinctUsers.length} users.`);
        } catch (error) {
            console.error("Failed to load all Tries on startup:", error);
        }
    }

    /**
     * Gets or creates the Trie for a user.
     * @param {string} userId 
     * @returns {Trie}
     */
    async getUserTrie(userId) {
        const idStr = userId.toString();
        if (!this.userTries.has(idStr)) {
            await this.buildTrieForUser(idStr);
        }
        return this.userTries.get(idStr);
    }

    /**
     * Add a newly created transaction's words to the user's Trie.
     * @param {string} userId 
     * @param {Object} transaction 
     */
    async addTransaction(userId, transaction) {
        const trie = await this.getUserTrie(userId);
        const words = this._extractSearchableWords(transaction);
        for (const word of words) {
            trie.insert(word, transaction._id.toString());
        }
    }

    /**
     * Removes a deleted transaction's words from the user's Trie.
     * @param {string} userId 
     * @param {Object} transaction 
     */
    async removeTransaction(userId, transaction) {
        const trie = await this.getUserTrie(userId);
        const words = this._extractSearchableWords(transaction);
        for (const word of words) {
            trie.remove(word, transaction._id.toString());
        }
    }

    /**
     * Updates an existing transaction in the Trie.
     * Removes old words and adds new ones.
     * @param {string} userId 
     * @param {Object} oldTransaction 
     * @param {Object} newTransaction 
     */
    async updateTransaction(userId, oldTransaction, newTransaction) {
        const trie = await this.getUserTrie(userId);
        
        const oldWords = this._extractSearchableWords(oldTransaction);
        for (const word of oldWords) {
            trie.remove(word, oldTransaction._id.toString());
        }

        const newWords = this._extractSearchableWords(newTransaction);
        for (const word of newWords) {
            trie.insert(word, newTransaction._id.toString());
        }
    }

    /**
     * Gets autocomplete suggestions for a user based on a prefix.
     * @param {string} userId 
     * @param {string} prefix 
     * @returns {Array<string>} Top 10 suggestions
     */
    async getSuggestions(userId, prefix) {
        const trie = await this.getUserTrie(userId);
        const results = trie.searchPrefix(prefix);
        
        // Map to just the word strings and take top 10
        return results.slice(0, 10).map(r => r.word);
    }
}

// Export a singleton instance
module.exports = new SearchService();
