const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  PageBreak, Footer, PageNumber
} = require('docx');

// ==========================================
// 1. CONFIGURATION & COLOR PALETTE
// ==========================================
const pageWidth = 9360; // 6.5 inches printable width (US Letter with 1" margins)

const DARK_BG = "0d1b2a";           // Dark Navy Header
const ORANGE = "ff6b35";            // Orange Accent
const BLUE_DARK = "1a3c5e";         // Deep Blue Header
const WHITE = "FFFFFF";
const GRAY_BG = "f4f6fa";           // Light Gray Content Box
const CODE_BG = "eaeef6";           // Code Block Shading
const GRAY_TEXT = "666666";         // Muted Gray
const SECTION_HEADER_BG = "1a3c5e"; // Section Header Background
const SUCCESS_GREEN = "27ae60";     // Success / Balance Add
const WARNING_RED = "c0392b";       // Alert / Warning Color

// Border Helpers
const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

// ==========================================
// 2. UI CONTAINER COMPONENTS
// ==========================================
function bannerTable(text, subtext, bgColor = DARK_BG, textColor = WHITE) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, color: textColor, size: 26, font: "Arial" })]
    })
  ];
  if (subtext) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120 },
        children: [new TextRun({ text: subtext, color: ORANGE, bold: true, size: 18, font: "Arial" })]
      })
    );
  }

  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 280, bottom: 280, left: 500, right: 500 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            verticalAlign: VerticalAlign.CENTER,
            children
          })
        ]
      })
    ]
  });
}

function sectionHeaderTable(icon, title) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: SECTION_HEADER_BG, type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 360, right: 360 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${icon}  ${title}`, bold: true, color: WHITE, size: 22, font: "Arial" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function contentBox(paragraphs, bgColor = GRAY_BG) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 400, right: 400 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            children: paragraphs
          })
        ]
      })
    ]
  });
}

function resourceBox(title, text, borderColor = ORANGE) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: "fff8f5", type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 360, right: 360 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: { style: BorderStyle.SINGLE, size: 24, color: borderColor },
              right: noBorder()
            },
            children: [
              new Paragraph({
                spacing: { after: 80 },
                children: [new TextRun({ text: title, bold: true, color: BLUE_DARK, size: 20, font: "Arial" })]
              }),
              new Paragraph({
                children: [new TextRun({ text, color: "333333", size: 18, font: "Arial" })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function codeBlock(codeLines) {
  const paragraphs = codeLines.map(line => 
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: line, font: "Consolas", size: 17, color: "2c3e50" })]
    })
  );

  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: CODE_BG, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 300, right: 300 },
            borders: {
              top: noBorder(), bottom: noBorder(),
              left: { style: BorderStyle.SINGLE, size: 16, color: BLUE_DARK },
              right: noBorder()
            },
            children: paragraphs
          })
        ]
      })
    ]
  });
}

function makeHeaderCell(text, w) {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: DARK_BG, type: ShadingType.CLEAR },
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, color: WHITE, size: 18, font: "Arial" })]
    })]
  });
}

function makeDataCell(text, w, bg, bold = false, color = "333333") {
  return new TableCell({
    width: { size: w, type: WidthType.DXA },
    shading: { fill: bg, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
    children: [new Paragraph({
      children: [new TextRun({ text, size: 18, font: "Arial", color, bold })]
    })]
  });
}

function apiTable(rowsData) {
  const headerRow = new TableRow({
    children: [
      makeHeaderCell("Method", 1200),
      makeHeaderCell("Endpoint URL", 2800),
      makeHeaderCell("Module / Scope", 2000),
      makeHeaderCell("Description & Functionality", 3360),
    ]
  });

  const dataRows = rowsData.map((row, i) => {
    const bg = i % 2 === 0 ? "f4f6fa" : "ffffff";
    const methodColor = row.method === "POST" ? SUCCESS_GREEN : row.method === "DELETE" ? WARNING_RED : BLUE_DARK;
    return new TableRow({
      children: [
        makeDataCell(row.method, 1200, bg, true, methodColor),
        makeDataCell(row.url, 2800, bg, true, "2c3e50"),
        makeDataCell(row.scope, 2000, bg, false, "555555"),
        makeDataCell(row.desc, 3360, bg, false, "333333"),
      ]
    });
  });

  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [1200, 2800, 2000, 3360],
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
    rows: [headerRow, ...dataRows]
  });
}

// ==========================================
// 3. DOCUMENT GENERATION
// ==========================================
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 20, color: "333333" } }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Day 3 Implementation Report  |  Advanced Budget & Goal Tracking  |  Page ", size: 18, color: GRAY_TEXT }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: GRAY_TEXT })
            ]
          })
        ]
      })
    },
    children: [
      // Banner
      bannerTable(
        "DAY 3: ADVANCED BUDGET SYSTEM & GOAL TRACKING",
        "Modules 5, 6, 10 | Goal: Financial Planning & Rollovers",
        DARK_BG
      ),
      new Paragraph({ spacing: { after: 200 } }),

      // Executive Summary
      sectionHeaderTable("◈", "Executive Summary & Architecture Overview"),
      new Paragraph({ spacing: { after: 120 } }),
      contentBox([
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Overview: ", bold: true, color: BLUE_DARK }),
            new TextRun({ text: "On Day 3, we successfully upgraded the personal finance platform from a basic transaction logger into an intelligent, proactive financial planner. By implementing multi-level budgeting, automated goal tracking, recurring transaction automation, and smart rollover mechanics, users now have complete control over their short-term discipline and long-term wealth accumulation." })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Core Focus Areas: ", bold: true, color: ORANGE }),
            new TextRun({ text: "(1) Multi-Level Budgets supporting overall monthly caps and category-specific spending limits with real-time percentage alerts. (2) Goal Tracking with automated percentage contributions upon every salary or income receipt. (3) Recurring Transactions with frequency scheduling and automated execution engines. (4) DIY Learning Challenge: Budget Carry Forward / Rollover." })
          ]
        })
      ]),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 1: Budget Model
      sectionHeaderTable("1️⃣", "Step 1: Budget Model (`models/budget.js`)"),
      new Paragraph({ spacing: { after: 120 } }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "The Budget schema is designed to handle both overall monthly spending and granular category-specific targets. If the 'category' field is left null or empty, it evaluates total spending across all categories.", size: 19 })]
      }),
      codeBlock([
        "const budgetSchema = new mongoose.Schema({",
        "  user: { type: ObjectId, ref: 'User', required: true, index: true },",
        "  category: { type: String, trim: true, default: null }, // Null = Total overall budget",
        "  amountLimit: { type: Number, required: true, min: 0 },",
        "  period: { type: String, enum: ['MONTHLY', 'WEEKLY', 'CUSTOM'], default: 'MONTHLY' },",
        "  startDate: { type: Date, required: true },",
        "  endDate: { type: Date, required: true },",
        "  alertThreshold: { type: Number, default: 80 }, // Triggers warning at 80% usage",
        "  carryForward: { type: Boolean, default: false } // Allows unspent rollover to next month",
        "}, { timestamps: true });"
      ]),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 2: Goal Model
      sectionHeaderTable("2️⃣", "Step 2: Goal Model (`models/goal.js`)"),
      new Paragraph({ spacing: { after: 120 } }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "Financial goals empower users to save for targets like a car, emergency fund, or vacation. To eliminate manual tracking friction, we introduced the autoContributePercent parameter, automatically allocating a percentage of every incoming salary/income transaction right to the goal.", size: 19 })]
      }),
      codeBlock([
        "const goalSchema = new mongoose.Schema({",
        "  user: { type: ObjectId, ref: 'User', required: true, index: true },",
        "  title: { type: String, required: true, trim: true }, // e.g. 'Buy Car'",
        "  targetAmount: { type: Number, required: true, min: 1 },",
        "  currentAmount: { type: Number, default: 0, min: 0 },",
        "  deadline: { type: Date, required: true },",
        "  priority: { type: String, enum: ['High', 'Med', 'Low'], default: 'Med' },",
        "  autoContributePercent: { type: Number, default: 0, min: 0, max: 100 },",
        "  isCompleted: { type: Boolean, default: false }",
        "}, { timestamps: true });"
      ]),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 3: Recurring Transaction Model
      sectionHeaderTable("3️⃣", "Step 3: Recurring Transaction Model (`models/recurring.js`)"),
      new Paragraph({ spacing: { after: 120 } }),
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: "To automate recurring bills (Netflix, Rent, SIPs) and salary inflows, the RecurringTransaction model stores schedule definitions along with a nextRunDate index.", size: 19 })]
      }),
      codeBlock([
        "const recurringSchema = new mongoose.Schema({",
        "  user: { type: ObjectId, ref: 'User', required: true, index: true },",
        "  wallet: { type: ObjectId, ref: 'Wallet', required: true },",
        "  type: { type: String, enum: ['INCOME', 'EXPENSE', 'TRANSFER'], required: true },",
        "  amount: { type: Number, required: true },",
        "  category: { type: String, required: true },",
        "  frequency: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'], required: true },",
        "  nextRunDate: { type: Date, required: true, index: true },",
        "  isActive: { type: Boolean, default: true }",
        "}, { timestamps: true });"
      ]),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 4: Real-Time Evaluation Utilities
      sectionHeaderTable("4️⃣", "Step 4: Real-Time Evaluation Utilities (`utils/`)"),
      new Paragraph({ spacing: { after: 120 } }),
      resourceBox(
        "⚡ Real-Time Budget Evaluation (`utils/budgetEvaluation.js`)",
        "Whenever a user submits an Expense transaction via POST /api/transactions, the controller evaluates `evaluateBudgetAlerts(userId, category, date, expenseAmount)`. The utility queries all matching active budgets (both category-specific and overall total budgets), aggregates total spent within `[startDate, endDate]`, and triggers a warning notice if `totalSpent + expenseAmount >= amountLimit * (alertThreshold / 100)`. The triggered alert is attached directly to the transaction JSON response!"
      ),
      new Paragraph({ spacing: { after: 120 } }),
      resourceBox(
        "🎯 Automatic Goal Allocation (`utils/goalEvaluation.js`)",
        "Whenever a user records an Income transaction via POST /api/transactions, `processGoalAutoContributions(userId, incomeAmount)` scans for active goals where `autoContributePercent > 0`. It computes `contribution = (incomeAmount * percent) / 100`, increments `goal.currentAmount`, and automatically sets `isCompleted = true` if the target is achieved.",
        SUCCESS_GREEN
      ),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 5: DIY Learning Challenge (Rollover)
      sectionHeaderTable("💡", "Day 3 DIY Challenge Solution: Budget Carry Forward / Rollover"),
      new Paragraph({ spacing: { after: 120 } }),
      contentBox([
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "Challenge Scenario: ", bold: true, color: BLUE_DARK }),
            new TextRun({ text: "If Month 1 budget is ₹50,000 and the user spent ₹42,000, how do you calculate remaining ₹8,000 and automatically add it to Month 2 budget (amountLimit + 8000) via endpoint `POST /api/budgets/rollover`?" })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Our Architectural Solution: ", bold: true, color: ORANGE }),
            new TextRun({ text: "We engineered `POST /api/budgets/rollover` in `budgetController.js`. The endpoint checks all Month 1 budgets where `carryForward: true`. It executes Mongoose aggregation to calculate `totalSpent = ₹42,000`. It determines `remaining = ₹50,000 - ₹42,000 = ₹8,000`. Then, it computes Month 2 start and end dates (the exact next calendar month), searches for an existing Month 2 budget for that category, and adds ₹8,000 to `nextBudget.amountLimit`. If no Month 2 budget exists yet, it creates one starting with `amountLimit: 58000`!" })
          ]
        })
      ]),
      new Paragraph({ spacing: { after: 120 } }),
      codeBlock([
        "// Rollover Core Algorithm snippet (controllers/budgetController.js):",
        "const remaining = Number((prevBudget.amountLimit - totalSpent).toFixed(2));",
        "if (remaining > 0) {",
        "  let nextBudget = await Budget.findOne({ user: userId, category, startDate: nextStart });",
        "  if (nextBudget) {",
        "    nextBudget.amountLimit += remaining; // Roll ₹8,000 onto existing limit",
        "    await nextBudget.save();",
        "  } else {",
        "    await Budget.create({ ...prevBudget, amountLimit: prevBudget.amountLimit + remaining, startDate: nextStart });",
        "  }",
        "}"
      ]),
      new Paragraph({ spacing: { after: 240 } }),

      // Step 6: API Reference Table
      sectionHeaderTable("📋", "Complete Day 3 API Endpoints Reference"),
      new Paragraph({ spacing: { after: 120 } }),
      apiTable([
        { method: "POST", url: "/api/budgets", scope: "Budgets", desc: "Create new budget (Monthly, Weekly, or Custom) with alertThreshold and carryForward" },
        { method: "GET", url: "/api/budgets", scope: "Budgets", desc: "Fetch all budgets enriched with real-time totalSpent, remaining, and percentageUsed" },
        { method: "PUT", url: "/api/budgets/:id", scope: "Budgets", desc: "Update budget limits or alert thresholds" },
        { method: "POST", url: "/api/budgets/rollover", scope: "Budgets (DIY Challenge)", desc: "Rollover remaining Month 1 unspent balance onto Month 2 budget (amountLimit + remaining)" },
        { method: "POST", url: "/api/goals", scope: "Goals", desc: "Create financial target with optional autoContributePercent" },
        { method: "GET", url: "/api/goals", scope: "Goals", desc: "Fetch goals with real-time progressPercent and remaining needed" },
        { method: "POST", url: "/api/goals/:id/contribute", scope: "Goals", desc: "Manual contribution towards a goal with optional wallet deduction" },
        { method: "POST", url: "/api/recurring", scope: "Recurring", desc: "Define recurring income, expense, or transfer rule with frequency and nextRunDate" },
        { method: "GET", url: "/api/recurring", scope: "Recurring", desc: "List all scheduled recurring transactions for user" },
        { method: "POST", url: "/api/recurring/process", scope: "Recurring (Utility)", desc: "Execute due scheduled transactions (nextRunDate <= now) and advance nextRunDate" },
        { method: "POST", url: "/api/transactions", scope: "Transactions (Integrated)", desc: "Create transaction and trigger real-time budgetAlerts & goalContributions in response" }
      ]),
      new Paragraph({ spacing: { after: 300 } })
    ]
  }]
});

const outputPath = path.join(__dirname, 'Day3_Advanced_Budget_and_Goal_Tracking.docx');
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Successfully generated Day 3 Docx Report at: ${outputPath}`);
}).catch(err => {
  console.error("Error writing docx:", err);
});
