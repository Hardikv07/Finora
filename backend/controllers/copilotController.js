/**
 * Finora Copilot — Controller
 *
 * POST /api/copilot/chat
 * Orchestrates: intent detection → data aggregation → prompt building → Gemini response
 */

const { classifyIntent } = require('../services/copilot/intentClassifier');
const { aggregateData } = require('../services/copilot/dataAggregator');
const { buildPrompt } = require('../services/copilot/promptBuilder');
const { generateCopilotResponse } = require('../services/copilot/geminiCopilot');

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
    const safeHistory = Array.isArray(history) ? history.slice(-8) : []; // Last 4 turns (8 messages)

    console.log(`[Copilot] User: ${userId} | Message: "${trimmedMessage}"`);

    // 2. Classify intent
    const { intent, confidence: intentConfidence, entities } = await classifyIntent(trimmedMessage);
    console.log(`[Copilot] Intent: ${intent} (${intentConfidence}%) | Entities:`, entities);

    // 3. Aggregate data from MongoDB (backend performs ALL calculations)
    let context;
    try {
      context = await aggregateData(intent, userId, entities);
    } catch (dbErr) {
      console.error('[Copilot] Data aggregation failed:', dbErr);
      return res.status(200).json({
        answer: "I couldn't retrieve your financial data right now. Please ensure you have some transactions recorded and try again.",
        cards: [],
        charts: [],
        followUps: ['Add your first transaction', 'Set up a budget', 'Create a savings goal'],
        confidence: 0,
        intent,
        processingMs: Date.now() - startTime,
      });
    }

    // 4. Build structured prompt (no raw transactions sent to Gemini)
    const { systemPrompt, charts } = buildPrompt(intent, context, trimmedMessage, safeHistory);

    // 5. Generate explanation via Gemini
    let geminiResponse;
    try {
      geminiResponse = await generateCopilotResponse(systemPrompt);
    } catch (aiErr) {
      console.error('[Copilot] Gemini call failed:', aiErr.message);
      // Graceful fallback: return a helpful message based on aggregated data
      return res.status(200).json({
        answer: buildFallbackAnswer(intent, context),
        cards: buildFallbackCards(context),
        charts,
        followUps: ['Compare with last month', 'Show budget status', 'View my goals'],
        confidence: 60,
        intent,
        processingMs: Date.now() - startTime,
      });
    }

    // 6. Respond with structured data
    const processingMs = Date.now() - startTime;
    console.log(`[Copilot] Responded in ${processingMs}ms`);

    return res.status(200).json({
      answer: geminiResponse.answer || 'I analyzed your finances but could not generate an explanation.',
      cards: geminiResponse.cards || [],
      charts,
      followUps: geminiResponse.followUps || [],
      highlights: geminiResponse.highlights || [],
      confidence: geminiResponse.confidence || intentConfidence,
      intent,
      processingMs,
    });
  } catch (err) {
    console.error('[Copilot] Unexpected error:', err);
    return res.status(500).json({
      answer: 'Something went wrong. Please try again in a moment.',
      cards: [],
      charts: [],
      followUps: ['Try again', 'Ask a different question'],
      confidence: 0,
      intent: 'GENERAL_FINANCE',
    });
  }
};

// ─── Fallback helpers (when Gemini is unavailable) ───────────────────────────

const buildFallbackAnswer = (intent, ctx) => {
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  switch (intent) {
    case 'AFFORDABILITY':
      return ctx.canAfford
        ? `Based on your current balance of ${fmt(ctx.totalBalance)}, you can afford this purchase. Your disposable income after upcoming bills is ${fmt(ctx.disposableIncome)}.`
        : `Your current balance is ${fmt(ctx.totalBalance)}, but after accounting for upcoming bills (${fmt(ctx.upcomingBills)}), you may want to wait. Consider saving for ${ctx.monthsToSave || 'a few'} more months.`;
    case 'GOAL_PROGRESS':
      return ctx.goals?.length
        ? `You have ${ctx.goals.length} active goal(s). Your top goal "${ctx.goals[0]?.title}" is ${ctx.goals[0]?.progress}% complete.`
        : 'You have no active savings goals. Start one to track your financial targets!';
    default:
      return 'Your financial data has been analyzed. The AI explanation service is temporarily unavailable, but your numbers are shown in the cards below.';
  }
};

const buildFallbackCards = (ctx) => {
  if (!ctx) return [];
  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
  const cards = [];
  if (ctx.totalBalance !== undefined) cards.push({ label: 'Total Balance', value: fmt(ctx.totalBalance), color: 'indigo' });
  if (ctx.monthlySavings !== undefined) cards.push({ label: 'Monthly Savings', value: fmt(ctx.monthlySavings), color: ctx.monthlySavings >= 0 ? 'emerald' : 'rose' });
  if (ctx.totalNetWorth !== undefined) cards.push({ label: 'Net Worth', value: fmt(ctx.totalNetWorth), color: 'blue' });
  return cards.slice(0, 4);
};

module.exports = { chat };
