/**
 * Finora Copilot — Intent Classifier
 *
 * Classifies user messages into one of 14 financial intents using keyword regex first.
 * Falls back to Gemini for ambiguous messages.
 */

const INTENTS = {
  COMPARE_MONTHS: 'COMPARE_MONTHS',
  SPENDING_BY_CATEGORY: 'SPENDING_BY_CATEGORY',
  TOP_MERCHANT: 'TOP_MERCHANT',
  TOP_TRANSACTION: 'TOP_TRANSACTION',
  AFFORDABILITY: 'AFFORDABILITY',
  BUDGET_ADVICE: 'BUDGET_ADVICE',
  GOAL_PROGRESS: 'GOAL_PROGRESS',
  SUBSCRIPTION_ANALYSIS: 'SUBSCRIPTION_ANALYSIS',
  WALLET_ANALYSIS: 'WALLET_ANALYSIS',
  SAVINGS_SUMMARY: 'SAVINGS_SUMMARY',
  MONTHLY_REPORT: 'MONTHLY_REPORT',
  PREDICT_BALANCE: 'PREDICT_BALANCE',
  ANOMALY_DETECTION: 'ANOMALY_DETECTION',
  GENERAL_FINANCE: 'GENERAL_FINANCE',
};

// Ordered keyword patterns — more specific patterns first
const INTENT_PATTERNS = [
  {
    intent: INTENTS.AFFORDABILITY,
    patterns: [
      /can i (afford|buy|purchase|get)/i,
      /afford/i,
      /if i buy/i,
      /worth [\u20b9$€£]?\d/i,
      /costing [\u20b9$€£]?\d/i,
    ],
  },
  {
    intent: INTENTS.COMPARE_MONTHS,
    patterns: [
      /compare.*(month|last|previous)/i,
      /(this|last|previous) month vs/i,
      /vs last month/i,
      /month.*(comparison|compare)/i,
      /how did (this|last) month/i,
    ],
  },
  {
    intent: INTENTS.ANOMALY_DETECTION,
    patterns: [
      /anomal/i,
      /unusual spending/i,
      /unexpected expense/i,
      /sudden (spike|increase)/i,
      /weird transaction/i,
      /overspend/i,
    ],
  },
  {
    intent: INTENTS.PREDICT_BALANCE,
    patterns: [
      /predict (my )?balance/i,
      /balance at (the )?end/i,
      /end of (this |the )?month/i,
      /how much will i have/i,
      /forecast/i,
    ],
  },
  {
    intent: INTENTS.SUBSCRIPTION_ANALYSIS,
    patterns: [
      /subscription/i,
      /recurring (bill|payment|expense)/i,
      /monthly (bill|subscription)/i,
      /netflix|spotify|prime|subscription cost/i,
    ],
  },
  {
    intent: INTENTS.GOAL_PROGRESS,
    patterns: [
      /goal/i,
      /saving goal/i,
      /how close am i/i,
      /target (amount|saving)/i,
      /progress (on|toward)/i,
    ],
  },
  {
    intent: INTENTS.BUDGET_ADVICE,
    patterns: [
      /budget/i,
      /how (can i|do i) save/i,
      /save [\u20b9$€£]?\d/i,
      /reduce (spending|expense)/i,
      /cut (down|back)/i,
      /financial (advice|tips|plan)/i,
    ],
  },
  {
    intent: INTENTS.WALLET_ANALYSIS,
    patterns: [
      /wallet/i,
      /account (balance|usage)/i,
      /which (wallet|account)/i,
      /bank account/i,
      /least used/i,
    ],
  },
  {
    intent: INTENTS.SAVINGS_SUMMARY,
    patterns: [
      /how much (have i |did i )?saved/i,
      /total saving/i,
      /saving (this|last) (year|month)/i,
      /net saving/i,
      /my saving/i,
    ],
  },
  {
    intent: INTENTS.TOP_MERCHANT,
    patterns: [
      /merchant/i,
      /where (do i|did i) spend (the )?most/i,
      /top (store|shop|merchant|vendor)/i,
      /which (shop|store|merchant)/i,
      /spent (the )?most (on |at )/i,
    ],
  },
  {
    intent: INTENTS.TOP_TRANSACTION,
    patterns: [
      /biggest transaction/i,
      /largest (payment|expense|transaction|purchase)/i,
      /most expensive/i,
      /highest (amount|spend)/i,
    ],
  },
  {
    intent: INTENTS.SPENDING_BY_CATEGORY,
    patterns: [
      /how much.*(spend|spent).*(on|in)/i,
      /spending (on|in) \w+/i,
      /expense.*(category|on)/i,
      /category (breakdown|wise|spending)/i,
      /where am i spending/i,
    ],
  },
  {
    intent: INTENTS.MONTHLY_REPORT,
    patterns: [
      /monthly (report|summary|review)/i,
      /this month('s)? (summary|report)/i,
      /summarize (this|last) month/i,
      /generate (monthly|month) report/i,
    ],
  },
];

/**
 * Extract entities like amounts, categories, months from the message
 */
const extractEntities = (message) => {
  const entities = {};

  // Extract currency amounts e.g. ₹80,000 or $1500 or 1.5 lakh
  const amountMatch = message.match(/[\u20b9$€£]?\s*([\d,]+(?:\.\d+)?)\s*(lakh|k|thousand)?/i);
  if (amountMatch) {
    let amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    const multiplier = amountMatch[2]?.toLowerCase();
    if (multiplier === 'lakh') amount *= 100000;
    else if (multiplier === 'k' || multiplier === 'thousand') amount *= 1000;
    entities.amount = amount;
  }

  // Extract month references
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthMatch = message.toLowerCase();
  const foundMonth = months.find(m => monthMatch.includes(m));
  if (foundMonth) entities.month = foundMonth;

  // Extract "last month" or "this month"
  if (/last month/i.test(message)) entities.period = 'last';
  else if (/this month/i.test(message)) entities.period = 'current';
  else if (/this year/i.test(message)) entities.period = 'year';

  return entities;
};

/**
 * Classify intent using Gemini as fallback
 */
const classifyWithGemini = async (message) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { intent: INTENTS.GENERAL_FINANCE, confidence: 50 };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const intentList = Object.values(INTENTS).join(', ');
  const prompt = `You are a financial intent classifier. Classify this user message into exactly one of these intents: ${intentList}

User message: "${message}"

Return ONLY valid JSON:
{"intent": "INTENT_NAME", "confidence": 0-100}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json' },
      }),
    });

    if (!response.ok) return { intent: INTENTS.GENERAL_FINANCE, confidence: 50 };

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { intent: INTENTS.GENERAL_FINANCE, confidence: 50 };

    const parsed = JSON.parse(text.trim());
    return { intent: parsed.intent || INTENTS.GENERAL_FINANCE, confidence: parsed.confidence || 70 };
  } catch {
    return { intent: INTENTS.GENERAL_FINANCE, confidence: 50 };
  }
};

/**
 * Main classify function
 */
const classifyIntent = async (message) => {
  const lowerMessage = message.toLowerCase().trim();
  const entities = extractEntities(message);

  // Keyword matching (fastest)
  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(lowerMessage)) {
        return { intent, confidence: 92, entities };
      }
    }
  }

  // Gemini fallback for ambiguous messages
  const geminiResult = await classifyWithGemini(message);
  return { ...geminiResult, entities };
};

module.exports = { classifyIntent, INTENTS };
