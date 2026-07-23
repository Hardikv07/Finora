/**
 * Finora Copilot — Gemini AI Caller
 *
 * Sends the structured financial prompt to Gemini 1.5-flash and parses the response.
 * Includes retry with exponential backoff for rate limits.
 */

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Call Gemini with retry on rate limit (429)
 */
const callGemini = async (prompt, retries = 3) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables.');
  }

  const url = `${GEMINI_URL}?key=${apiKey}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.3, // Low temperature for accurate financial answers
            maxOutputTokens: 1024,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      });

      if (response.status === 429) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[Copilot] Gemini rate limited. Retrying in ${delay}ms (attempt ${attempt}/${retries})`);
        await sleep(delay);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errText}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Gemini returned an empty response.');
      }

      // Strip markdown code fences if Gemini wraps the JSON
      const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');

      let parsed;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('[Copilot] Failed to parse Gemini JSON:', cleaned);
        throw new Error('Gemini returned invalid JSON.');
      }

      return parsed;
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1000 * attempt);
    }
  }
};

/**
 * Generate a copilot response from pre-built prompt
 */
const generateCopilotResponse = async (systemPrompt) => {
  return callGemini(systemPrompt);
};

module.exports = { generateCopilotResponse };
