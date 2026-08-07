/**
 * Embedding Service for Finora RAG
 * 
 * Uses Google Gemini REST API (text-embedding-004) to generate 768-dimensional vector embeddings
 * for transaction records and natural language queries.
 */

const Transaction = require("../models/transaction");

/**
 * Format a transaction document into a rich descriptive text string for embedding.
 * Includes type, amount, merchant, category, subCategory, notes, date, and tags.
 */
const buildTransactionText = (txn) => {
  const parts = [];
  
  if (txn.type && txn.amount) {
    const symbol = txn.currency === 'USD' ? '$' : '₹';
    parts.push(`${txn.type} of ${symbol}${txn.amount}`);
  }
  
  if (txn.merchant) {
    parts.push(`at ${txn.merchant}`);
  }
  
  if (txn.category) {
    parts.push(`in category ${txn.category}`);
  }
  
  if (txn.subCategory) {
    parts.push(`(${txn.subCategory})`);
  }
  
  if (txn.date) {
    const dateStr = new Date(txn.date).toISOString().split('T')[0];
    parts.push(`on date ${dateStr}`);
  }
  
  if (txn.notes && txn.notes.trim()) {
    parts.push(`Notes: ${txn.notes.trim()}`);
  }
  
  if (Array.isArray(txn.tags) && txn.tags.length > 0) {
    parts.push(`Tags: ${txn.tags.join(', ')}`);
  }

  return parts.join(' ');
};

/**
 * Generate embedding vector (768 floats) for a string using Gemini text-embedding-004 model.
 */
const generateEmbedding = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in environment variables.");
  }

  if (!text || !text.trim()) {
    throw new Error("Cannot generate embedding for empty text.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: {
        parts: [{ text: text.trim() }]
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini Embedding API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  const values = result.embedding?.values;

  if (!values || !Array.isArray(values)) {
    throw new Error("Invalid embedding response from Gemini API.");
  }

  return values;
};

/**
 * Helper to generate and save embedding directly for a given transaction document ID or instance.
 */
const generateAndStoreEmbedding = async (transaction) => {
  try {
    const textToEmbed = buildTransactionText(transaction);
    const embedding = await generateEmbedding(textToEmbed);
    
    // Update directly via findByIdAndUpdate to avoid triggering pre/post save hooks unnecessarily
    await Transaction.findByIdAndUpdate(transaction._id, { embedding });
    console.log(`[RAG Embedding] Successfully generated & saved embedding for Txn ${transaction._id}`);
    return embedding;
  } catch (error) {
    console.error(`[RAG Embedding] Error generating embedding for Txn ${transaction._id}:`, error.message);
    throw error;
  }
};

module.exports = {
  buildTransactionText,
  generateEmbedding,
  generateAndStoreEmbedding
};
