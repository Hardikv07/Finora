class TrieNode {
    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.frequency = 0;
        this.transactionIds = new Set();
    }
}

module.exports = TrieNode;
