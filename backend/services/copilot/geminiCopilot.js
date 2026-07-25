/**
 * Finora Copilot — Gemini AI Caller
 *
 * Sends the structured financial prompt to Gemini 1.5-flash and parses the response.
 * Includes retry with exponential backoff for rate limits (429).
 * Surfaces specific, actionable error messages instead of generic failures.
 */

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Classify the Gemini HTTP error into a user-friendly, specific message.
 * Used both for logging and for throwing a descriptive error.
 */
const classifyGeminiError = (status, responseText) => {
  if (status === 400) return `Gemini rejected the request (bad prompt format). Detail: ${responseText}`;
  if (status === 401) return 'Gemini API key is invalid or has been revoked. Check GEMINI_API_KEY in .env.';
  if (status === 403) return 'Gemini API access denied. The API key may not have permission for this model.';
  if (status === 429) return 'Gemini quota exceeded. Free tier limit reached — wait and retry, or upgrade your plan.';
  if (status === 500) return 'Gemini service returned an internal error. This is on Google\'s side — try again shortly.';
  if (status === 503) return 'Gemini service is temporarily unavailable. Try again in a few seconds.';
  return `Gemini API error (HTTP ${status}): ${responseText}`;
};

/**
 * Call Gemini with retry on rate limit (429).
 *
 * @param {string} prompt    - The full structured prompt string to send.
 * @param {number} retries   - Maximum number of attempts (default 3).
 * @returns {object}         - Parsed JSON response from Gemini.
 * @throws {Error}           - Descriptive error with specific cause.
 */
const callGemini = async (prompt, retries = 3) => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // This is a configuration problem — log clearly at server startup level
    console.error('[Copilot] ❌ GEMINI_API_KEY is missing from environment variables. Add it to your .env file.');
    throw new Error('GEMINI_API_KEY is not configured. Please add it to your .env file and restart the server.');
  }

  const url = `${GEMINI_URL}?key=${apiKey}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Copilot] Calling Gemini (attempt ${attempt}/${retries})...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3,    // Low temperature for accurate financial answers
            maxOutputTokens: 8192,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });

      // Rate limit — apply exponential backoff and retry
      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.warn(`[Copilot] ⚠️  Gemini rate limited. Retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        const msg = classifyGeminiError(response.status, errText);
        console.error(`[Copilot] ❌ Gemini HTTP error — ${msg}`);
        throw new Error(msg);
      }

      const result = await response.json();
      
      const parts = result.candidates?.[0]?.content?.parts || [];
      const text = parts.map(p => p.text || '').join('');
      const finishReason = result.candidates?.[0]?.finishReason;
      
      if (!text) {
        // Check if the response was blocked by safety filters
        const blockReason = result.candidates?.[0]?.finishReason;
        const safetyRatings = result.candidates?.[0]?.safetyRatings;
        if (blockReason === 'SAFETY') {
          console.warn('[Copilot] ⚠️  Gemini blocked the response due to safety filters.');
          throw new Error('Gemini blocked the response due to content safety filters.');
        }
        console.error('[Copilot] ❌ Gemini returned empty content. Full result:', JSON.stringify(result, null, 2));
        throw new Error('Gemini returned an empty response. The prompt may be malformed.');
      }

      console.log(`[Copilot] ✅ Gemini responded successfully (${text.length} chars) | Finish reason: ${finishReason}`);

      // Strip markdown code fences if Gemini wraps the JSON (it sometimes does)
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[Copilot] ❌ Failed to parse Gemini JSON response:', cleaned.substring(0, 300));
        throw new Error('Gemini returned a response that could not be parsed as JSON. The model may have deviated from the prompt format.');
      }

      return parsed;

    } catch (err) {
      // Only retry on rate-limit-like errors, not on config or parse errors
      const isRetryable = err.message.includes('quota') || err.message.includes('rate limit') || err.message.includes('503');
      if (attempt < retries && isRetryable) {
        console.warn(`[Copilot] Retrying after error on attempt ${attempt}: ${err.message}`);
        await sleep(1000 * attempt);
        continue;
      }
      throw err; // Re-throw to be handled by the controller
    }
  }

  throw new Error('Gemini failed to respond after all retry attempts.');
};

/**
 * Generate a copilot response from a pre-built structured prompt.
 *
 * @param {string} systemPrompt - The full financial context prompt.
 * @returns {object}            - Structured Gemini response with answer, cards, followUps.
 */
const generateCopilotResponse = async (systemPrompt) => {
  return callGemini(systemPrompt);
};

module.exports = { generateCopilotResponse };
