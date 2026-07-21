const assert = require('assert');
const Trie = require('../utils/Trie');

// Simple test runner
const tests = [];
function test(name, fn) {
    tests.push({ name, fn });
}

async function runTests() {
    console.log("Running Trie unit tests...");
    let passed = 0;
    for (const t of tests) {
        try {
            await t.fn();
            console.log(`✅ ${t.name}`);
            passed++;
        } catch (e) {
            console.error(`❌ ${t.name}`);
            console.error(e);
        }
    }
    console.log(`\nResults: ${passed}/${tests.length} tests passed.`);
}

test('1. Insert and Prefix Search', () => {
    const trie = new Trie();
    trie.insert('Amazon', 'tx1');
    trie.insert('Amazon Pay', 'tx2');
    trie.insert('Apple', 'tx3');

    let results = trie.searchPrefix('Ama');
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].word, 'amazon'); // Case insensitive storage
    assert.strictEqual(results[1].word, 'amazon pay');
    
    results = trie.searchPrefix('Apple');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].word, 'apple');
});

test('2. Case Insensitive Search and Trim', () => {
    const trie = new Trie();
    trie.insert('  GROCERY  ', 'tx1');
    trie.insert('Grofers', 'tx2');

    let results = trie.searchPrefix('gro');
    assert.strictEqual(results.length, 2);
    
    // Check they are sorted alphabetically if frequency is same
    assert.strictEqual(results[0].word, 'grocery');
    assert.strictEqual(results[1].word, 'grofers');
});

test('3. Duplicate Insertion (Frequency Ranking)', () => {
    const trie = new Trie();
    // Insert Amazon 3 times (different tx ids)
    trie.insert('Amazon', 'tx1');
    trie.insert('Amazon', 'tx2');
    trie.insert('Amazon', 'tx3');
    
    // Insert Amazon Pay 1 time
    trie.insert('Amazon Pay', 'tx4');

    const results = trie.searchPrefix('Ama');
    
    assert.strictEqual(results.length, 2);
    // Amazon should be first due to higher frequency
    assert.strictEqual(results[0].word, 'amazon');
    assert.strictEqual(results[0].frequency, 3);
    assert.strictEqual(results[0].transactionIds.length, 3);
    
    assert.strictEqual(results[1].word, 'amazon pay');
    assert.strictEqual(results[1].frequency, 1);
});

test('4. Duplicate Insertion (Same TX ID is ignored)', () => {
    const trie = new Trie();
    trie.insert('Uber', 'tx1');
    trie.insert('Uber', 'tx1'); // Same transaction ID shouldn't increase frequency

    const results = trie.searchPrefix('Ub');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].frequency, 1);
});

test('5. Delete (Remove Transaction ID)', () => {
    const trie = new Trie();
    trie.insert('Netflix', 'tx1');
    trie.insert('Netflix', 'tx2');
    
    trie.remove('Netflix', 'tx1');

    let results = trie.searchPrefix('Net');
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].frequency, 1); // Frequency dropped to 1
    assert.deepStrictEqual(results[0].transactionIds, ['tx2']);
    
    // Remove the last one
    trie.remove('Netflix', 'tx2');
    results = trie.searchPrefix('Net');
    assert.strictEqual(results.length, 0); // Word is gone
});

test('6. Empty Search', () => {
    const trie = new Trie();
    trie.insert('Uber', 'tx1');

    const results = trie.searchPrefix('');
    assert.strictEqual(results.length, 0); // Should return empty array safely
    
    const results2 = trie.searchPrefix('   ');
    assert.strictEqual(results2.length, 0);
});

test('7. Fuzzy Search (Levenshtein Distance Typo Tolerance)', () => {
    const trie = new Trie();
    trie.insert('Amazon', 'tx1');
    trie.insert('Amazon Pay', 'tx2');
    trie.insert('Flipkart', 'tx3');

    // Missing 'o' in Amazon
    const results = trie.searchPrefix('Amazn');
    assert.strictEqual(results.length, 2);
    // It should find "amazon" because of maxDistance=1
    assert.strictEqual(results[0].word, 'amazon');
});

runTests();
