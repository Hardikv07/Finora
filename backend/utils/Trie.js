const TrieNode = require('./TrieNode');

class Trie {
    constructor() {
        this.root = new TrieNode();
    }

    /**
     * Cleans the word: trims spaces and converts to lowercase
     * @param {string} word 
     * @returns {string}
     */
    _cleanWord(word) {
        if (!word) return "";
        return word.trim().toLowerCase();
    }

    /**
     * Inserts a word into the Trie.
     * @param {string} word 
     * @param {string} transactionId 
     */
    insert(word, transactionId) {
        const cleanedWord = this._cleanWord(word);
        if (!cleanedWord) return;

        let currentNode = this.root;
        for (const char of cleanedWord) {
            if (!currentNode.children.has(char)) {
                currentNode.children.set(char, new TrieNode());
            }
            currentNode = currentNode.children.get(char);
        }

        currentNode.isEndOfWord = true;
        // Only increment frequency if this is a new transaction ID for this word
        if (!currentNode.transactionIds.has(transactionId)) {
            currentNode.frequency += 1;
            currentNode.transactionIds.add(transactionId);
        }
    }

    /**
     * Removes a transaction ID from a word in the Trie.
     * If the frequency drops to 0, it removes the word.
     * Note: We don't delete nodes to keep it simple, just clear isEndOfWord, 
     * but we can optimize memory by pruning empty branches later if needed.
     * @param {string} word 
     * @param {string} transactionId 
     */
    remove(word, transactionId) {
        const cleanedWord = this._cleanWord(word);
        if (!cleanedWord) return;

        let currentNode = this.root;
        const stack = []; // To keep track of path for potential pruning

        for (const char of cleanedWord) {
            if (!currentNode.children.has(char)) return; // Word doesn't exist
            stack.push({ node: currentNode, char });
            currentNode = currentNode.children.get(char);
        }

        if (currentNode.isEndOfWord && currentNode.transactionIds.has(transactionId)) {
            currentNode.transactionIds.delete(transactionId);
            currentNode.frequency -= 1;

            if (currentNode.frequency <= 0) {
                currentNode.isEndOfWord = false;
                currentNode.frequency = 0;
                
                // Prune empty branches
                let current = currentNode;
                while (stack.length > 0 && current.children.size === 0 && !current.isEndOfWord) {
                    const parentData = stack.pop();
                    parentData.node.children.delete(parentData.char);
                    current = parentData.node;
                }
            }
        }
    }

    /**
     * Helper for DFS to find all words from a given node
     */
    _findAllWords(node, currentPrefix, results) {
        if (node.isEndOfWord) {
            results.push({
                word: currentPrefix,
                frequency: node.frequency,
                transactionIds: Array.from(node.transactionIds)
            });
        }
        
        for (const [char, childNode] of node.children.entries()) {
            this._findAllWords(childNode, currentPrefix + char, results);
        }
    }

    /**
     * Searches for words matching the prefix.
     * @param {string} prefix 
     * @returns {Array} List of matching words sorted by frequency then alphabetically
     */
    searchPrefix(prefix) {
        const cleanedPrefix = this._cleanWord(prefix);
        if (!cleanedPrefix) return [];

        let currentNode = this.root;
        for (const char of cleanedPrefix) {
            if (!currentNode.children.has(char)) {
                // If prefix not found exactly, attempt fuzzy search for small typos
                return this.fuzzySearch(cleanedPrefix, 1);
            }
            currentNode = currentNode.children.get(char);
        }

        const results = [];
        this._findAllWords(currentNode, cleanedPrefix, results);
        
        // Sort: Highest frequency first, then alphabetically
        results.sort((a, b) => {
            if (b.frequency !== a.frequency) {
                return b.frequency - a.frequency;
            }
            return a.word.localeCompare(b.word);
        });

        return results;
    }

    /**
     * Fuzzy search using Levenshtein distance concept during traversal.
     * Tolerates `maxDistance` edits (insertions, deletions, substitutions).
     */
    fuzzySearch(target, maxDistance = 1) {
        const results = [];
        const cleanedTarget = this._cleanWord(target);
        if (!cleanedTarget) return [];

        // Stack approach for DFS: [node, currentWord, targetIndex, editsRemaining]
        // This is a simplified fuzzy search targeting typical small typos
        // For production scale with huge dicts, a Levenshtein automaton is better.
        // For performance here, we'll traverse and compare.
        
        // Since standard DFS fuzzy is complex, we will collect all words up to a reasonable depth
        // and compute Levenshtein distance on them, filtering out high distances.
        // To avoid full tree traversal, we'll do a bounded DFS.
        
        const allWords = [];
        // Only collect words if the prefix length is >= 2, to avoid full tree scan
        if (cleanedTarget.length < 2) return [];

        this._findAllWords(this.root, "", allWords);
        
        const fuzzyResults = allWords.filter(item => {
            // Optimization: word must be at least somewhat as long as the target prefix
            if (item.word.length < cleanedTarget.length - maxDistance) return false;
            
            // Check distance between target and the prefix of the word
            const wordPrefix = item.word.substring(0, cleanedTarget.length);
            const prefixDist = this._levenshteinDistance(wordPrefix, cleanedTarget);
            
            return prefixDist <= maxDistance;
        });

        // Dedup and sort
        fuzzyResults.sort((a, b) => {
            if (b.frequency !== a.frequency) return b.frequency - a.frequency;
            return a.word.localeCompare(b.word);
        });

        return fuzzyResults;
    }

    _levenshteinDistance(a, b) {
        const matrix = [];

        // Increment along the first column of each row
        let i;
        for (i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }

        // Increment each column in the first row
        let j;
        for (j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        // Fill in the rest of the matrix
        for (i = 1; i <= b.length; i++) {
            for (j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                                            Math.min(matrix[i][j - 1] + 1, // insertion
                                                     matrix[i - 1][j] + 1)); // deletion
                }
            }
        }

        return matrix[b.length][a.length];
    }
}

module.exports = Trie;
