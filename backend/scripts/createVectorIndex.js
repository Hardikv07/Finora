/**
 * Finora RAG — Atlas Vector Search Index Helper
 * 
 * Programmatically defines and creates the Atlas Vector Search index on the `transactions` collection.
 * 
 * Usage:
 * node backend/scripts/createVectorIndex.js
 */

const crypto = require('crypto');
if (!globalThis.crypto) {
  globalThis.crypto = crypto;
}
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const INDEX_SPEC = {
  name: "transaction_vector_index",
  type: "vectorSearch",
  definition: {
    fields: [
      {
        type: "vector",
        path: "embedding",
        numDimensions: 3072,
        similarity: "cosine"
      },
      {
        type: "filter",
        path: "user"
      }
    ]
  }
};

async function createIndex() {
  console.log('[Atlas Vector Index] Initializing index setup...');

  if (!process.env.MONGO_URI) {
    console.error('[Atlas Vector Index] ❌ MONGO_URI is missing in .env!');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Atlas Vector Index] Connected to MongoDB.');

    const db = mongoose.connection.db;
    const collection = db.collection('transactions');

    console.log('[Atlas Vector Index] Creating Search Index `transaction_vector_index`...');
    
    try {
      await collection.createSearchIndex(INDEX_SPEC);
      console.log('[Atlas Vector Index] ✅ Search index created successfully!');
    } catch (err) {
      console.log('[Atlas Vector Index] Notice from server:', err.message);
      console.log('\n--- MANUAL ATLAS SETUP INSTRUCTIONS ---');
      console.log('If your MongoDB deployment requires Atlas UI configuration:');
      console.log('1. Go to MongoDB Atlas -> Deployments -> Database -> Search Indexes');
      console.log('2. Select collection: finora.transactions');
      console.log('3. Create JSON Search Index named `transaction_vector_index`:');
      console.log(JSON.stringify(INDEX_SPEC.definition, null, 2));
      console.log('----------------------------------------\n');
    }

  } catch (err) {
    console.error('[Atlas Vector Index] Error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('[Atlas Vector Index] Done.');
  }
}

createIndex();
