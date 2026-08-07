/**
 * Finora Copilot — Controller (100% Local RAG & Deterministic Processing)
 *
 * POST /api/copilot/chat
 * Orchestrates: Intent Detection → Data Aggregation / RAG Search → Local Format
 * Completely local — zero external Gemini API calls!
 */

const { classifyIntent } = require('../services/copilot/intentClassifier');
const { aggregateData } = require('../services/copilot/dataAggregator');
const { buildLocalResponse } = require('../services/copilot/promptBuilder');
const { askWithRAG } = require('../services/copilot/ragService');

console.log('[Copilot Engine] ✅ Running in 100% Local RAG Mode (Zero External LLM Dependency).');

/**
 * POST /api/copilot/chat
 */
const chat = async (req, res) => {
  const startTime = Date.now();

  try {
    const { message, history = [] } = req.body;
    const userId = req.user._id;

    // 1. Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required.' });
    }

    if (message.trim().length > 500) {
      return res.status(400).json({ message: 'Message too long (max 500 characters).' });
    }

    const trimmedMessage = message.trim();
    const safeHistory = Array.isArray(history) ? history.slice(-8) : [];

    console.log(`[Copilot] User: ${userId} | Question: "${trimmedMessage}"`);

    // 2. Classify intent locally via regex
    const { intent, confidence: intentConfidence, entities } = await classifyIntent(trimmedMessage);
    console.log(`[Copilot] Classified Intent: ${intent} (${intentConfidence}%) | Entities:`, entities);

    // 3. Multi-Entity RAG Pipeline (Transactions, Bills, Goals, Subscriptions)
    const isMultiEntityQuery = /bill|due|unpaid|utility|goal|target|saving|subscription|recurring|find|search|show|when|how much|most expensive|largest|highest/i.test(trimmedMessage);
    if (intent === 'SEARCH_TRANSACTIONS' || intent === 'GENERAL_FINANCE' || intent === 'TOP_TRANSACTION' || isMultiEntityQuery) {
      console.log(`[Copilot RAG] Executing local database search for: "${trimmedMessage}"`);
      const ragResult = await askWithRAG(userId, trimmedMessage, safeHistory);
      return res.status(200).json({
        ...ragResult,
        intent,
        processingMs: Date.now() - startTime
      });
    }

    // 4. Structured Analytical Intents -> Local Aggregation + Response Builder
    let context;
    try {
      context = await aggregateData(intent, userId, entities);
    } catch (dbErr) {
      console.error('[Copilot] Data aggregation failed:', dbErr);
      return res.status(200).json({
        answer: "Could not retrieve your financial data from database. Please ensure you have recorded transactions.",
        cards: [],
        charts: [],
        followUps: ['Add your first transaction', 'Set up a budget', 'Create a savings goal'],
        confidence: 0,
        intent,
        processingMs: Date.now() - startTime,
      });
    }

    // Build natural language answer & cards locally
    const localResult = buildLocalResponse(intent, context, trimmedMessage);

    const processingMs = Date.now() - startTime;
    console.log(`[Copilot Local] Responded in ${processingMs}ms`);

    return res.status(200).json({
      answer: localResult.answer,
      cards: localResult.cards || [],
      charts: localResult.charts || [],
      followUps: localResult.followUps || [],
      highlights: localResult.highlights || [],
      confidence: localResult.confidence || intentConfidence,
      intent,
      processingMs,
    });
  } catch (err) {
    console.error('[Copilot] Unexpected error:', err);
    return res.status(500).json({
      answer: 'Something went wrong processing your request.',
      cards: [],
      charts: [],
      followUps: ['Try again', 'Ask a different question'],
      confidence: 0,
      intent: 'GENERAL_FINANCE',
    });
  }
};

module.exports = { chat };
