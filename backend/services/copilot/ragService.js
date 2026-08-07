/**
 * Finora Copilot — Accurate Multi-Entity RAG Service (100% Local Engine)
 * 
 * Performs precise database retrieval over MongoDB:
 * - Transactions
 * - Bills & Utilities
 * - Savings Goals
 * - Recurring Subscriptions
 * 
 * Guarantees zero false positives: Never returns unrelated transactions if a specific keyword fails to match.
 */

const Transaction = require("../../models/transaction");
const Bill = require("../../models/bill");
const Goal = require("../../models/goal");
const Recurring = require("../../models/recurring");
const mongoose = require("mongoose");

const SYMBOL = '₹';
const fmt = (n) => `${SYMBOL}${Number(n || 0).toLocaleString('en-IN')}`;

// Words that are NEVER valid merchant/category search terms
const STOP_WORDS = new Set([
  // pronouns & determiners
  'i', 'me', 'my', 'myself', 'we', 'our', 'us', 'you', 'your', 'it', 'its', 'they', 'them',
  'the', 'a', 'an', 'any', 'all', 'some', 'each', 'every', 'this', 'that', 'these', 'those',
  // verbs & auxiliaries
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  // action verbs used in queries
  'want', 'like', 'need', 'know', 'see', 'show', 'tell', 'find', 'search', 'list', 'give',
  'get', 'fetch', 'display', 'view', 'check', 'look', 'help',
  // prepositions & conjunctions
  'of', 'for', 'in', 'on', 'at', 'to', 'from', 'with', 'about', 'into', 'through', 'between',
  'and', 'or', 'but', 'not', 'so', 'than',
  // commerce / finance filler words
  'items', 'item', 'brand', 'company', 'store', 'shop', 'merchant', 'vendor', 'product',
  'products', 'things', 'thing', 'stuff', 'details', 'info', 'information',
  'transaction', 'transactions', 'record', 'records', 'history', 'entry', 'entries',
  'purchase', 'purchases', 'payment', 'payments', 'expense', 'expenses', 'income', 'incomes',
  'spend', 'spent', 'spending', 'bought', 'buy', 'buying', 'paid', 'pay', 'cost', 'costs',
  'please', 'which', 'what', 'where', 'when', 'how', 'why', 'much', 'many',
  // comparison / threshold words (these become filters, NOT text searches)
  'above', 'below', 'over', 'under', 'greater', 'less', 'more', 'fewer', 'equal',
  'least', 'most', 'maximum', 'minimum', 'max', 'min', 'between', 'upto',
  'expensive', 'cheapest', 'highest', 'lowest', 'biggest', 'smallest', 'largest', 'top',
  // date / time words
  'today', 'yesterday', 'tomorrow', 'week', 'month', 'year', 'months', 'years', 'weeks',
  'last', 'this', 'next', 'past', 'previous', 'recent', 'latest', 'ago', 'since',
  'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december',
  // analytics words
  'total', 'average', 'avg', 'count', 'number', 'sum', 'overall', 'summary',
  'compare', 'comparison', 'breakdown', 'analysis', 'report',
  // entity type words (handled by entity detection, not text search)
  'bill', 'bills', 'goal', 'goals', 'subscription', 'subscriptions', 'recurring',
  'unpaid', 'pending', 'overdue', 'due', 'saving', 'savings',
  // misc
  'far', 'ever', 'just', 'only', 'also', 'very', 'really', 'quite', 'close',
  'money', 'rupees', 'rupee', 'inr', 'usd', 'dollar', 'dollars'
]);

/**
 * Extract meaningful search terms — ONLY genuine merchant/category/brand names survive.
 * Strips: stop words, pure numbers, currency symbols, comparison phrases.
 */
const extractSearchKeywords = (queryText) => {
  // 1. Remove currency symbols and amount expressions (₹5000, $1000, etc.)
  let cleaned = queryText.replace(/[\u20b9$€£]\s*[\d,]+/g, '');
  // 2. Remove standalone numbers (1000, 5000, etc.)
  cleaned = cleaned.replace(/\b\d+\b/g, '');
  // 3. Remove special characters
  cleaned = cleaned.replace(/[^\w\s]/gi, '');
  // 4. Split and filter
  const words = cleaned.split(/\s+/);
  return words.filter(w => w.length >= 2 && !STOP_WORDS.has(w.toLowerCase()));
};

/**
 * Parse date filter from natural language text
 */
const parseDateFilter = (queryText) => {
  const lower = queryText.toLowerCase();
  const now = new Date();
  
  if (lower.includes('this month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    return { $gte: start, $lte: end };
  }
  
  if (lower.includes('last month')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    return { $gte: start, $lte: end };
  }

  if (lower.includes('last 3 months') || lower.includes('past 3 months')) {
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return { $gte: start };
  }

  if (lower.includes('this year')) {
    const start = new Date(now.getFullYear(), 0, 1);
    return { $gte: start };
  }

  return null;
};

/**
 * Multi-entity RAG Search Engine
 */
const searchMultiEntity = async (userId, queryText, limit = 15) => {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const lowerQuery = queryText.toLowerCase();
  
  const keywords = extractSearchKeywords(queryText);
  const regexes = keywords.map(kw => new RegExp(kw, 'i'));
  const searchedTerm = keywords.join(' ');

  // 1. Bills Search
  const isBillQuery = /bill|due|unpaid|utility|electricity|broadband|water|provider|recharge/i.test(lowerQuery);
  if (isBillQuery) {
    let billQuery = { user: userObjectId };
    if (lowerQuery.includes('unpaid') || lowerQuery.includes('pending')) billQuery.status = 'PENDING';
    else if (lowerQuery.includes('overdue')) billQuery.status = 'OVERDUE';
    else if (lowerQuery.includes('paid')) billQuery.status = 'PAID';
    
    if (regexes.length > 0) {
      billQuery.$or = [
        { title: { $in: regexes } },
        { category: { $in: regexes } },
        { billerNameOrProvider: { $in: regexes } }
      ];
    }
    
    let bills = await Bill.find(billQuery).sort({ dueDate: 1 }).limit(limit).lean();
    if ((!bills || bills.length === 0) && regexes.length === 0) {
      bills = await Bill.find({ user: userObjectId }).sort({ dueDate: 1 }).limit(limit).lean();
    }
    return { entityType: 'BILL', records: bills || [], searchedTerm };
  }

  // 2. Goals Search
  const isGoalQuery = /goal|target|savings?\s*goal|fund|car|emergency|saving/i.test(lowerQuery);
  if (isGoalQuery) {
    let goalQuery = { user: userObjectId };
    if (regexes.length > 0) {
      goalQuery.$or = [
        { title: { $in: regexes } }
      ];
    }
    let goals = await Goal.find(goalQuery).sort({ priority: 1 }).limit(limit).lean();
    if ((!goals || goals.length === 0) && regexes.length === 0) {
      goals = await Goal.find({ user: userObjectId }).sort({ priority: 1 }).limit(limit).lean();
    }
    return { entityType: 'GOAL', records: goals || [], searchedTerm };
  }

  // 3. Subscriptions Search
  const isSubQuery = /subscription|recurring|monthly bill|netflix|spotify|prime/i.test(lowerQuery);
  if (isSubQuery) {
    const subs = await Recurring.find({ user: userObjectId, isActive: true }).sort({ amount: -1 }).limit(limit).lean();
    return { entityType: 'SUBSCRIPTION', records: subs || [], searchedTerm };
  }

  // 4. Transaction Search
  let txnQuery = { user: userObjectId };
  let hasStructuredFilters = false; // Track if amount/type/date filters were applied

  // Detect expense vs income
  if (/bought|purchase|spent|paid|expense|cost|item|shopping|food|rent|merchant/i.test(lowerQuery)) {
    txnQuery.type = 'EXPENSE';
    hasStructuredFilters = true;
  } else if (/income|earned|salary|dividend|deposit|received|gift/i.test(lowerQuery)) {
    txnQuery.type = 'INCOME';
    hasStructuredFilters = true;
  }

  // Detect numeric thresholds e.g., > 5000 or < 1000
  const amountAboveMatch = lowerQuery.match(/(?:over|above|greater than|more than|>)\s*[\u20b9$€£]?\s*([\d,]+)/i);
  if (amountAboveMatch) {
    txnQuery.amount = { ...txnQuery.amount, $gte: parseFloat(amountAboveMatch[1].replace(/,/g, '')) };
    hasStructuredFilters = true;
  }

  const amountBelowMatch = lowerQuery.match(/(?:under|below|less than|<)\s*[\u20b9$€£]?\s*([\d,]+)/i);
  if (amountBelowMatch) {
    txnQuery.amount = { ...txnQuery.amount, $lte: parseFloat(amountBelowMatch[1].replace(/,/g, '')) };
    hasStructuredFilters = true;
  }

  // Date range filter
  const dateFilter = parseDateFilter(queryText);
  if (dateFilter) {
    txnQuery.date = dateFilter;
    hasStructuredFilters = true;
  }

  // ONLY add text search $or if there are genuine merchant/category keywords remaining
  // (after stripping numbers, comparison words, date words, etc.)
  if (regexes.length > 0) {
    txnQuery.$or = [
      { merchant: { $in: regexes } },
      { category: { $in: regexes } },
      { subCategory: { $in: regexes } },
      { notes: { $in: regexes } },
      { tags: { $in: regexes } }
    ];
  }

  let txns = await Transaction.find(txnQuery)
    .sort({ amount: -1, date: -1 })
    .limit(limit)
    .lean();

  // Fallback logic:
  // - If specific keywords exist but matched nothing → return 0 results (NO false positives)
  // - If no keywords but structured filters → already handled by the query above
  // - If no keywords AND no structured filters → analytical fallback
  if (!txns || txns.length === 0) {
    if (keywords.length > 0) {
      // Specific search terms (e.g. "apple") matched nothing → return 0 results
      // NEVER return unrelated fallback transactions when user searched for a specific brand/merchant
    } else if (!hasStructuredFilters) {
      // Completely generic / analytical query — return top transactions
      const isAnalyticalQuery = /most expensive|largest|highest|cheapest|lowest|top|recent|latest|overall|total/i.test(lowerQuery);
      if (isAnalyticalQuery) {
        const fallbackFilter = { user: userObjectId };
        if (txnQuery.type) fallbackFilter.type = txnQuery.type;
        txns = await Transaction.find(fallbackFilter)
          .sort({ amount: -1, date: -1 })
          .limit(limit)
          .lean();
      }
    }
  }

  return { entityType: 'TRANSACTION', records: txns || [], searchedTerm };
};

/**
 * Build dynamic chart configuration for matched RAG items
 */
const buildRAGCharts = (entityType, records) => {
  const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

  if (entityType === 'TRANSACTION' && records.length >= 2) {
    const byCategory = {};
    records.forEach(r => {
      const cat = r.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + (r.amount || 0);
    });

    const labels = Object.keys(byCategory);
    const data = Object.values(byCategory);

    if (labels.length > 1) {
      return [{
        type: 'pie',
        title: 'Matched Spend by Category',
        labels,
        data,
        colors: labels.map((_, i) => COLORS[i % COLORS.length])
      }];
    }
  }

  return [];
};

/**
 * Compute confidence level based on retrieved context quality
 * High  → answer fully supported by retrieved records
 * Medium → partially supported (few records, ambiguous match)
 * Low   → insufficient context
 */
const computeConfidence = (entityType, records, searchedTerm, keywords) => {
  if (records.length === 0) {
    return { level: 'Low', score: 0, reason: 'No matching records found in the database.' };
  }
  if (records.length === 1) {
    return { level: 'Medium', score: 60, reason: 'Only 1 record found — limited context.' };
  }
  if (keywords.length > 0 && records.length >= 2) {
    return { level: 'High', score: 100, reason: `${records.length} records matched the search criteria.` };
  }
  if (records.length >= 2) {
    return { level: 'High', score: 100, reason: `${records.length} records retrieved from your data.` };
  }
  return { level: 'Medium', score: 70, reason: 'Partial match from database.' };
};

/**
 * Build evidence citations from retrieved records.
 * Every answer MUST trace back to specific records — never invented data.
 */
const buildEvidence = (entityType, records) => {
  if (!records || records.length === 0) {
    return { documents: [], quotes: [] };
  }

  const documents = [];
  const quotes = [];

  if (entityType === 'TRANSACTION') {
    documents.push(`transactions collection (${records.length} records)`);
    records.slice(0, 5).forEach(t => {
      const dateStr = t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A';
      quotes.push(`${t.merchant || t.category || 'Unknown'}: ${fmt(t.amount)} on ${dateStr} [${t.type || 'TXN'}]`);
    });
  } else if (entityType === 'BILL') {
    documents.push(`bills collection (${records.length} records)`);
    records.slice(0, 5).forEach(b => {
      quotes.push(`${b.title || 'Bill'}: ${fmt(b.amount)} — ${b.status} (Due: ${b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : 'N/A'})`);
    });
  } else if (entityType === 'GOAL') {
    documents.push(`goals collection (${records.length} records)`);
    records.slice(0, 5).forEach(g => {
      const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1) : 0;
      quotes.push(`${g.title}: ${pct}% complete (${fmt(g.currentAmount)} / ${fmt(g.targetAmount)})`);
    });
  } else if (entityType === 'SUBSCRIPTION') {
    documents.push(`recurring collection (${records.length} records)`);
    records.slice(0, 5).forEach(s => {
      quotes.push(`${s.notes || s.category || 'Subscription'}: ${fmt(s.amount)} (${s.frequency})`);
    });
  }

  return { documents, quotes };
};

/**
 * Main Multi-Entity RAG Entry Point
 * 
 * STRICT RULES ENFORCED:
 * 1. Answer ONLY from retrieved database records — never invent/hallucinate data.
 * 2. If no records match, state: "I couldn't find enough information in the available data."
 * 3. Every answer includes Evidence (source documents + quoted records).
 * 4. Confidence is computed from actual data quality (High/Medium/Low).
 * 5. Calculations use ONLY values present in retrieved records.
 * 6. Never assume information not present in the retrieved context.
 */
const askWithRAG = async (userId, userQuery, conversationHistory = []) => {
  const startTime = Date.now();
  const keywords = extractSearchKeywords(userQuery);
  const { entityType, records, searchedTerm } = await searchMultiEntity(userId, userQuery, 15);

  let answerText = "";
  let cards = [];
  let highlights = [];
  let sources = [];
  const charts = buildRAGCharts(entityType, records);

  const lower = userQuery.toLowerCase();
  const isMostExpensive = /most expensive|largest|highest|biggest|max/i.test(lower);
  const isCheapest = /cheapest|lowest|min|smallest/i.test(lower);
  const isAverage = /average|avg/i.test(lower);

  // Compute evidence and confidence from retrieved context
  const evidence = buildEvidence(entityType, records);
  const confidence = computeConfidence(entityType, records, searchedTerm, keywords);

  // ─── RULE 2: IF NO RECORDS FOUND → CLEARLY STATE INSUFFICIENT DATA ────────────
  if (records.length === 0) {
    answerText = searchedTerm
      ? `I couldn't find any ${entityType.toLowerCase()} records matching **"${searchedTerm}"** in your account. No data is available to answer this query.`
      : `I couldn't find enough information in the available data to answer **"${userQuery}"**.`;

    cards = [{ label: "Matches Found", value: "0 records", color: "rose" }];

    return {
      answer: answerText,
      cards,
      charts: [],
      followUps: [
        "Find Amazon transactions",
        "Show most expensive item",
        "What are my unpaid bills",
        "How close am I to my savings goal?"
      ],
      highlights: [],
      confidence: confidence.score,
      confidenceLevel: confidence.level,
      confidenceReason: confidence.reason,
      evidence,
      sources: [],
      processingMs: Date.now() - startTime
    };
  }

  // ─── BILLS RESPONSE (sourced strictly from retrieved bill records) ─────────────
  if (entityType === 'BILL') {
    const totalDue = records.reduce((s, b) => s + (b.amount || 0), 0);
    const pendingCount = records.filter(b => b.status === 'PENDING' || b.status === 'OVERDUE').length;

    answerText = `Based on your retrieved records, found **${records.length} bill(s)** totaling **${fmt(totalDue)}**.\n\n` +
      `Bill Details:\n` +
      records.slice(0, 5).map(b =>
        `• **${b.title}** (${b.category}): ${fmt(b.amount)} – Status: **${b.status}** (Due: ${b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : 'N/A'})`
      ).join('\n');

    cards = [
      { label: "Total Bills Amount", value: fmt(totalDue), color: "indigo" },
      { label: "Pending Bills", value: `${pendingCount}`, color: pendingCount > 0 ? "amber" : "emerald" }
    ];
    highlights = [`${records.length} bills retrieved from database`];
    sources = records.slice(0, 5).map(b => ({
      id: b._id,
      merchant: b.title || b.billerNameOrProvider || 'Bill',
      category: b.category,
      amount: fmt(b.amount),
      type: b.status,
      date: b.dueDate ? new Date(b.dueDate).toISOString().split('T')[0] : 'N/A'
    }));
  }

  // ─── GOALS RESPONSE (sourced strictly from retrieved goal records) ─────────────
  else if (entityType === 'GOAL') {
    const topGoal = records[0];
    answerText = `Based on your retrieved records, found **${records.length} savings goal(s)**.\n\n` +
      records.map(g => {
        const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(1) : 0;
        return `• **${g.title}**: ${pct}% complete (${fmt(g.currentAmount)} / ${fmt(g.targetAmount)})`;
      }).join('\n');

    cards = [
      { label: "Top Goal", value: topGoal ? topGoal.title : "N/A", color: "indigo" },
      { label: "Saved Amount", value: topGoal ? fmt(topGoal.currentAmount) : "₹0", color: "emerald" }
    ];
    highlights = [`Goal progress: ${topGoal?.title}`];
  }

  // ─── SUBSCRIPTIONS RESPONSE (sourced strictly from retrieved records) ──────────
  else if (entityType === 'SUBSCRIPTION') {
    const totalSub = records.reduce((s, r) => s + (r.amount || 0), 0);
    answerText = `Based on your retrieved records, found **${records.length} active recurring subscription(s)** totaling **${fmt(totalSub)}/period**.\n\n` +
      records.map(s => `• **${s.notes || s.category}**: ${fmt(s.amount)} (${s.frequency})`).join('\n');

    cards = [
      { label: "Total Subscriptions", value: fmt(totalSub), color: "rose" },
      { label: "Active Subscriptions", value: `${records.length}`, color: "indigo" }
    ];
    highlights = [`${records.length} active subscriptions from database`];
  }

  // ─── TRANSACTIONS RESPONSE (sourced strictly from retrieved records) ───────────
  else {
    // RULE 5: All calculations use ONLY values from the retrieved records
    const totalAmount = records.reduce((sum, t) => sum + (t.amount || 0), 0);
    const avgAmount = Math.round(totalAmount / (records.length || 1));

    if (isMostExpensive) {
      const sorted = records.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0));
      const topTxn = sorted[0];

      answerText = `Based on your retrieved records, the most expensive purchase is **${topTxn.merchant || topTxn.category}** for **${fmt(topTxn.amount)}** on ${topTxn.date ? new Date(topTxn.date).toISOString().split('T')[0] : 'N/A'}.\n\n` +
        `Top purchases from retrieved data:\n` +
        sorted.slice(0, 4).map(t =>
          `• **${fmt(t.amount)}** – ${t.merchant || t.category} (${t.category || 'General'}) on ${t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A'}`
        ).join('\n');

      cards = [
        { label: "Highest Purchase", value: fmt(topTxn.amount), color: "indigo" },
        { label: "Category", value: topTxn.category || "General", color: "emerald" },
        { label: "Date", value: topTxn.date ? new Date(topTxn.date).toISOString().split('T')[0] : 'N/A', color: "blue" }
      ];
      highlights = [`Top item: ${topTxn.merchant || topTxn.category} - ${fmt(topTxn.amount)}`];
    } else if (isCheapest) {
      const sorted = records.slice().sort((a, b) => (a.amount || 0) - (b.amount || 0));
      const minTxn = sorted[0];

      answerText = `Based on your retrieved records, the lowest purchase is **${minTxn.merchant || minTxn.category}** for **${fmt(minTxn.amount)}** on ${minTxn.date ? new Date(minTxn.date).toISOString().split('T')[0] : 'N/A'}.\n\n` +
        sorted.slice(0, 4).map(t =>
          `• **${fmt(t.amount)}** – ${t.merchant || t.category} (${t.category})`
        ).join('\n');

      cards = [
        { label: "Lowest Purchase", value: fmt(minTxn.amount), color: "emerald" },
        { label: "Category", value: minTxn.category || "General", color: "indigo" }
      ];
      highlights = [`Lowest item: ${minTxn.merchant || minTxn.category} - ${fmt(minTxn.amount)}`];
    } else if (isAverage) {
      answerText = `Based on **${records.length} retrieved transaction records**, your average spend is **${fmt(avgAmount)}** per transaction (Total: **${fmt(totalAmount)}**).`;
      cards = [
        { label: "Average Transaction", value: fmt(avgAmount), color: "indigo" },
        { label: "Total Spend", value: fmt(totalAmount), color: "rose" }
      ];
      highlights = [`Average spend: ${fmt(avgAmount)}`];
    } else {
      answerText = searchedTerm
        ? `Found **${records.length} transaction record(s)** matching **"${searchedTerm}"** totaling **${fmt(totalAmount)}**.\n\n` +
          `Matching items from your data:\n` +
          records.slice(0, 5).map(t =>
            `• **${fmt(t.amount)}** at ${t.merchant || t.category} (${t.category}) on ${t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A'}`
          ).join('\n')
        : `Found **${records.length} matching transaction records** totaling **${fmt(totalAmount)}** (Avg: **${fmt(avgAmount)}**).\n\n` +
          `Records from your data:\n` +
          records.slice(0, 5).map(t =>
            `• **${fmt(t.amount)}** at ${t.merchant || t.category} (${t.category}) on ${t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A'}`
          ).join('\n');

      cards = [
        { label: "Total Matched Spend", value: fmt(totalAmount), color: "indigo" },
        { label: "Matches Found", value: `${records.length} txns`, color: "emerald" },
        { label: "Average Amount", value: fmt(avgAmount), color: "blue" }
      ];
      highlights = [`Total: ${fmt(totalAmount)} across ${records.length} transactions`];
    }

    sources = records.slice(0, 5).map(t => ({
      id: t._id,
      merchant: t.merchant || t.category || 'Transaction',
      category: t.category,
      amount: fmt(t.amount),
      type: t.type,
      date: t.date ? new Date(t.date).toISOString().split('T')[0] : 'N/A'
    }));
  }

  return {
    answer: answerText,
    cards,
    charts,
    followUps: [
      "What are my top spending categories?",
      "Show me all expenses above ₹5,000",
      "Which bills are pending?",
      "How close am I to my savings goal?"
    ],
    highlights,
    confidence: confidence.score,
    confidenceLevel: confidence.level,
    confidenceReason: confidence.reason,
    evidence,
    sources,
    processingMs: Date.now() - startTime
  };
};

module.exports = {
  searchMultiEntity,
  askWithRAG
};
