const parseFinancialDocument = async (ocrText) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in environment variables.");
    }

    // Using gemini-1.5-flash as the standard robust model
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const prompt = `You are an expert financial document parser.

Your task is to extract transaction details from OCR text of invoices, receipts, restaurant bills, grocery bills, fuel bills, utility bills, shopping receipts, medical bills, and other payment receipts.

The OCR text may contain:
- spelling mistakes
- broken words
- missing punctuation
- duplicate lines
- incorrect line ordering
- random symbols
- multiple currencies
- advertisements
- loyalty information
- GST/VAT details

Your goal is to return ONLY the actual financial transaction.

-------------------------
RULES
-------------------------

1. Determine the merchant/business name.

2. Find the FINAL amount actually paid.

Priority:
Paid Amount
Amount Paid
Grand Total
Net Amount
Total Payable
Total
Invoice Total

Ignore:
Subtotal
Tax
CGST
SGST
IGST
VAT
Discount
Savings
Round Off
Balance
Change Returned
Tip (unless included in total)

If multiple totals exist, choose the largest payable amount unless a clearly marked "Amount Paid" exists.

3. Detect the transaction currency.

Default to INR if the bill appears Indian.

4. Detect transaction date.

Prefer:
Invoice Date
Bill Date
Purchase Date

Ignore:
Printing Date
Delivery Date
Expiry Date

Return ISO format:
YYYY-MM-DD

5. Infer the category.

Choose ONLY one:
Food
Groceries
Fuel
Shopping
Medical
Travel
Entertainment
Utilities
Education
Rent
Salary
Investment
Subscription
Insurance
Healthcare
Electronics
Home
Personal Care
Transportation
Other

Examples:
Restaurant → Food
Cafe → Food
Swiggy → Food
Zomato → Food
DMart → Groceries
Reliance Fresh → Groceries
Amazon → Shopping
Flipkart → Shopping
Myntra → Shopping
Apollo Pharmacy → Medical
Hospital → Healthcare
Indian Oil → Fuel
HP Petrol → Fuel
Electricity Bill → Utilities
Internet Bill → Utilities
Netflix → Subscription
Spotify → Subscription
Uber → Transportation
Ola → Transportation
IRCTC → Travel
Airline → Travel
Movie Ticket → Entertainment
College Fees → Education
Rent Receipt → Rent
Salary Slip → Salary
Mutual Fund → Investment

6. Confidence score.

Return a number from 0-100.

Reduce confidence if:
- OCR quality is poor
- amount ambiguous
- merchant missing
- category uncertain

7. Notes

Mention why confidence is reduced.

Example:
"Two totals detected."
"OCR missing merchant."
"Date inferred."

8. Never hallucinate.

If information cannot be found, return null.

9. Never guess an amount.

10. Ignore advertisements, QR codes, offers, loyalty points, coupon text, phone numbers, GST numbers, UPI IDs unless required.

11. If receipt contains item list, do NOT extract items.
Only extract transaction-level information.

12. Output ONLY valid JSON.

-------------------------
JSON FORMAT
-------------------------

{
  "merchant": "",
  "amount": 0,
  "currency": "INR",
  "date": "YYYY-MM-DD",
  "category": "",
  "confidence": 95,
  "notes": ""
}

-------------------------
OCR TEXT
-------------------------
${ocrText}`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
        throw new Error("No response text received from Gemini API.");
    }

    try {
        return JSON.parse(responseText.trim());
    } catch (parseError) {
        console.error("Failed to parse Gemini response as JSON:", responseText);
        throw new Error("Gemini response is not valid JSON.");
    }
};

module.exports = {
    parseFinancialDocument
};
