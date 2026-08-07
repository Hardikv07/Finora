/**
 * Currency Conversion Engine
 * 
 * Maintains a module-level exchange rate cache that is populated once
 * from a free API (with hardcoded fallback rates). Every call to
 * `convertAmount(amountInINR, targetCurrency)` returns the converted value.
 *
 * Base currency: INR (all data stored in INR in DB)
 */

// Hardcoded fallback rates (INR → X) — updated realistic values
const FALLBACK_RATES = {
  INR: 1,
  USD: 0.01190,   // 1 INR ≈ $0.0119  (1 USD ≈ 84 INR)
  EUR: 0.01090,   // 1 INR ≈ €0.0109  (1 EUR ≈ 92 INR)
  GBP: 0.00940,   // 1 INR ≈ £0.0094  (1 GBP ≈ 106 INR)
};

// Module-level cache
let cachedRates = { ...FALLBACK_RATES };
let lastFetchTime = 0;
let fetchPromise = null;

const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches live exchange rates from a free API.
 * Falls back to hardcoded rates on failure.
 */
export async function fetchExchangeRates() {
  const now = Date.now();

  // Return cached rates if fresh
  if (now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedRates;
  }

  // Deduplicate concurrent fetches
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // Free API — no key needed, base=INR
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/INR');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      cachedRates = {
        INR: 1,
        USD: data.rates.USD || FALLBACK_RATES.USD,
        EUR: data.rates.EUR || FALLBACK_RATES.EUR,
        GBP: data.rates.GBP || FALLBACK_RATES.GBP,
      };
      lastFetchTime = Date.now();
      console.log('✅ Live exchange rates loaded:', cachedRates);
    } catch (err) {
      console.warn('⚠️ Exchange rate API unavailable, using fallback rates:', err.message);
      cachedRates = { ...FALLBACK_RATES };
      lastFetchTime = Date.now(); // Don't retry immediately
    } finally {
      fetchPromise = null;
    }
    return cachedRates;
  })();

  return fetchPromise;
}

/**
 * Converts an amount from INR to the target currency using cached rates.
 * @param {number} amountInINR - The amount in Indian Rupees
 * @param {string} targetCurrency - Target currency code (INR/USD/EUR/GBP)
 * @returns {number} Converted amount
 */
export function convertAmount(amountInINR, targetCurrency = 'INR') {
  if (!targetCurrency || targetCurrency === 'INR') return amountInINR;
  const rate = cachedRates[targetCurrency] || FALLBACK_RATES[targetCurrency] || 1;
  return amountInINR * rate;
}

/**
 * Returns the current cached rates object.
 */
export function getCachedRates() {
  return { ...cachedRates };
}
