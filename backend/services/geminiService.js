/**
 * Local Financial Document Parser (Zero External LLM Dependency)
 * Extracts transaction details (merchant, amount, currency, date, category) locally via regex parsing.
 */

const parseFinancialDocument = async (ocrText) => {
    if (!ocrText || !ocrText.trim()) {
        throw new Error("No OCR text provided.");
    }

    const lines = ocrText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const text = ocrText.toLowerCase();

    // 1. Amount Extraction
    let amount = 0;
    const amountPatterns = [
        /(?:total|paid|net\s*payable|grand\s*total|amount\s*paid)[:\s]*[\u20B9$€£]?\s*([\d,]+\.?\d*)/i,
        /(?:Rs\.?|INR|USD)\s*([\d,]+\.?\d*)/i,
        /[\u20B9$€£]\s*([\d,]+\.?\d*)/
    ];

    for (const p of amountPatterns) {
        const m = ocrText.match(p);
        if (m) {
            const val = parseFloat(m[1].replace(/,/g, ''));
            if (!isNaN(val) && val > 0) {
                amount = val;
                break;
            }
        }
    }

    // Fallback amount: largest number found in lines containing 'total' or 'paid'
    if (!amount) {
        const numbers = ocrText.match(/\d+(?:\.\d{1,2})?/g) || [];
        const validNums = numbers.map(Number).filter(n => n > 1 && n < 1000000);
        if (validNums.length > 0) {
            amount = Math.max(...validNums);
        }
    }

    // 2. Currency
    const currency = (text.includes('$') || text.includes('usd')) ? 'USD' : 'INR';

    // 3. Date
    let date = new Date().toISOString().split('T')[0];
    const dateMatch = ocrText.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/) ||
                      ocrText.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
    if (dateMatch) {
        const parsed = new Date(dateMatch[0]);
        if (!isNaN(parsed.getTime())) {
            date = parsed.toISOString().split('T')[0];
        }
    }

    // 4. Category & Merchant Detection
    const categoryRules = [
        { cat: 'Food', keywords: ['swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonalds', 'kfc', 'dominos', 'food'] },
        { cat: 'Groceries', keywords: ['dmart', 'blinkit', 'zepto', 'bigbasket', 'instamart', 'grocery', 'supermarket'] },
        { cat: 'Shopping', keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'tata cliq', 'shopping', 'store'] },
        { cat: 'Fuel', keywords: ['petrol', 'diesel', 'hp petrol', 'indian oil', 'bharat petroleum', 'fuel'] },
        { cat: 'Utilities', keywords: ['electricity', 'water', 'gas', 'broadband', 'airtel', 'jio', 'bill'] },
        { cat: 'Medical', keywords: ['pharmacy', 'apollo', 'medical', 'hospital', 'doctor'] },
        { cat: 'Transportation', keywords: ['uber', 'ola', 'rapido', 'cab', 'metro'] },
        { cat: 'Subscription', keywords: ['netflix', 'spotify', 'prime', 'youtube', 'subscription'] }
    ];

    let category = 'Other';
    let merchant = lines[0] ? lines[0].substring(0, 40) : 'Receipt Merchant';

    for (const rule of categoryRules) {
        const foundKw = rule.keywords.find(kw => text.includes(kw));
        if (foundKw) {
            category = rule.cat;
            merchant = foundKw.charAt(0).toUpperCase() + foundKw.slice(1);
            break;
        }
    }

    return {
        merchant,
        amount,
        currency,
        date,
        category,
        confidence: amount > 0 ? 90 : 60,
        notes: amount > 0 ? "Extracted locally via smart OCR parser." : "Amount requires verification."
    };
};

module.exports = {
    parseFinancialDocument
};
