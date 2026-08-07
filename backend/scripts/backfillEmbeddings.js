/**
 * Finora RAG — Backfill Embeddings Script
 * 
 * Generates and stores 768-dimensional vector embeddings for all existing transactions
 * in the database that do not have an embedding.
 * 
 * Usage:
 * node backend/scripts/backfillEmbeddings.js
 */

const crypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const { generateAndStoreEmbedding } = require('../services/embeddingService');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBackfill() {
  console.log('[RAG Backfill] Starting backfill process...');

  if (!process.env.MONGO_URI) {
    console.error('[RAG Backfill] ❌ MONGO_URI is missing in .env!');
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('[RAG Backfill] ❌ GEMINI_API_KEY is missing in .env!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[RAG Backfill] Connected to MongoDB database successfully.');

    // Find all transactions where embedding field does not exist or is null
    const txnsToBackfill = await Transaction.find({
      $or: [
        { embedding: { $exists: false } },
        { embedding: null },
        { embedding: { $size: 0 } }
      ]
    }).select('+embedding');

    console.log(`[RAG Backfill] Found ${txnsToBackfill.length} transactions requiring vector embeddings.`);

    if (txnsToBackfill.length === 0) {
      console.log('[RAG Backfill] All transactions already have embeddings! Nothing to do.');
      await mongoose.disconnect();
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < txnsToBackfill.length; i++) {
      const txn = txnsToBackfill[i];
      try {
        console.log(`[RAG Backfill] Processing ${i + 1}/${txnsToBackfill.length}: Txn ${txn._id} (${txn.type} ₹${txn.amount} - ${txn.merchant || txn.category})`);
        await generateAndStoreEmbedding(txn);
        successCount++;
        // Gentle throttle to respect Gemini rate limits (200ms per request)
        await sleep(200);
      } catch (err) {
        console.error(`[RAG Backfill] ❌ Failed to embed Txn ${txn._id}:`, err.message);
        failCount++;
      }
    }

    console.log('\n==================================================');
    console.log(`[RAG Backfill] Completed!`);
    console.log(`  - Total Processed : ${txnsToBackfill.length}`);
    console.log(`  - Successfully Embedded: ${successCount}`);
    console.log(`  - Failed          : ${failCount}`);
    console.log('==================================================\n');

  } catch (err) {
    console.error('[RAG Backfill] Fatal error during migration:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[RAG Backfill] Disconnected from database.');
  }
}

runBackfill();
