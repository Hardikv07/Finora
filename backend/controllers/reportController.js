const Transaction = require("../models/transaction");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { parse } = require("json2csv");

const getReportData = async (userId, timeframe) => {
    const now = new Date();
    let startDate;

    if (timeframe === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (timeframe === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1);
    } else {
        startDate = new Date(0); // All time
    }

    const transactions = await Transaction.find({
        user: userId,
        date: { $gte: startDate }
    }).sort({ date: -1 }).lean();

    return transactions;
};

const exportPDF = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const transactions = await getReportData(req.user._id, timeframe || "monthly");

        const doc = new PDFDocument();
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=report_${timeframe}.pdf`);
        doc.pipe(res);

        doc.fontSize(20).text(`Financial Report - ${(timeframe || "monthly").toUpperCase()}`, { align: "center" });
        doc.moveDown();

        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            if (t.type === "INCOME") totalIncome += t.amount;
            if (t.type === "EXPENSE") totalExpense += t.amount;
        });

        doc.fontSize(14).text(`Total Income: ${totalIncome.toFixed(2)}`);
        doc.text(`Total Expense: ${totalExpense.toFixed(2)}`);
        doc.text(`Net Savings: ${(totalIncome - totalExpense).toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(16).text("Transactions", { underline: true });
        doc.moveDown();
        
        transactions.forEach(t => {
            doc.fontSize(12).text(`${new Date(t.date).toLocaleDateString()} - ${t.category} - ${t.type}: ${t.amount}`);
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: "Failed to generate PDF", error: error.message });
    }
};

const exportExcel = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const transactions = await getReportData(req.user._id, timeframe || "monthly");

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Transactions");

        worksheet.columns = [
            { header: "Date", key: "date", width: 15 },
            { header: "Type", key: "type", width: 15 },
            { header: "Category", key: "category", width: 20 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Merchant", key: "merchant", width: 20 }
        ];

        transactions.forEach(t => {
            worksheet.addRow({
                date: new Date(t.date).toLocaleDateString(),
                type: t.type,
                category: t.category,
                amount: t.amount,
                merchant: t.merchant || ""
            });
        });

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename=report_${timeframe}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ message: "Failed to generate Excel", error: error.message });
    }
};

const exportCSV = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const transactions = await getReportData(req.user._id, timeframe || "monthly");

        const fields = ["date", "type", "category", "amount", "merchant"];
        const data = transactions.map(t => ({
            date: new Date(t.date).toLocaleDateString(),
            type: t.type,
            category: t.category,
            amount: t.amount,
            merchant: t.merchant || ""
        }));

        const csv = parse(data, { fields });

        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=report_${timeframe}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ message: "Failed to generate CSV", error: error.message });
    }
};

module.exports = { exportPDF, exportExcel, exportCSV };
