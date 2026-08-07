const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign } = require('docx');
const fs = require('fs');
const path = require('path');

const pageWidth = 9360;
const DARK_BG = "0d1b2a";
const ORANGE = "ff6b35";
const GRAY_BG = "f4f6fa";
const SECTION_HEADER_BG = "1a3c5e";
const WHITE = "FFFFFF";

const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

function bannerTable(text, bgColor, textColor = WHITE, fontSize = 24) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: bgColor, type: ShadingType.CLEAR },
            margins: { top: 220, bottom: 220, left: 720, right: 720 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text, bold: true, color: textColor, size: fontSize, font: "Arial" })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function sectionHeaderTable(title) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: SECTION_HEADER_BG, type: ShadingType.CLEAR },
            margins: { top: 160, bottom: 160, left: 360, right: 360 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            children: [
              new Paragraph({
                children: [new TextRun({ text: `◈  ${title}`, bold: true, color: WHITE, size: 22, font: "Arial" })]
              })
            ]
          })
        ]
      })
    ]
  });
}

function contentBox(paragraphs) {
  return new Table({
    width: { size: pageWidth, type: WidthType.DXA },
    columnWidths: [pageWidth],
    borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(), insideH: noBorder(), insideV: noBorder() },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: pageWidth, type: WidthType.DXA },
            shading: { fill: GRAY_BG, type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 400, right: 400 },
            borders: { top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder() },
            children: paragraphs
          })
        ]
      })
    ]
  });
}

function createText(text, bold = false) {
  return new Paragraph({
    children: [new TextRun({ text, bold, size: 20, font: "Arial", color: "333333" })],
    spacing: { after: 120 }
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
  sections: [{
    properties: {
      page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
    },
    children: [
      bannerTable("Finora Onboarding", DARK_BG),
      new Paragraph({ spacing: { after: 200 } }),
      bannerTable("FEATURE 2 — WALLETS & BUDGETS", ORANGE, WHITE, 22),
      new Paragraph({ spacing: { after: 200 } }),
      
      sectionHeaderTable("1. What problem it solves"),
      contentBox([
        createText("Wallets allow users to track multiple sources of funds (like Cash, Bank Account, Credit Card) separately. Budgets allow users to set spending limits for specific categories in a given month to avoid overspending.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("2. User Flow"),
      contentBox([
        createText("Wallets: User goes to the Wallets page (WalletsPage.jsx). They can add a new wallet (e.g., 'Chase Checking') with an initial balance. They can also transfer funds between wallets."),
        createText("Budgets: User goes to the Budgets page (BudgetsPage.jsx). They create a budget for a category (e.g., 'Groceries', $500 limit). As they add transactions, the budget visually updates to show how much is spent vs remaining.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("3. Code Flow"),
      contentBox([
        createText("Frontend (WalletsPage.jsx / BudgetsPage.jsx) → API Request with JWT → Backend Routes (walletRoutes.js / budgetRoutes.js) → Controller (walletController.js / budgetController.js) → DB Query (wallet.js / budget.js Model) → JSON Response → UI updates state.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("4. API Endpoints Involved"),
      contentBox([
        createText("WALLETS:"),
        createText("• POST /api/wallets : Create a wallet"),
        createText("• GET /api/wallets : Fetch all user wallets"),
        createText("• POST /api/wallets/transfer : Transfer money between two wallets"),
        createText("BUDGETS:"),
        createText("• POST /api/budgets : Create a budget limit"),
        createText("• GET /api/budgets : Fetch budgets and their current spent amounts"),
        createText("• POST /api/budgets/rollover : Carry forward unused budget to the next month")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("5. Files Responsible"),
      contentBox([
        createText("Frontend: frontend/src/pages/WalletsPage.jsx, BudgetsPage.jsx"),
        createText("Models: backend/models/wallet.js, budget.js"),
        createText("Routes: backend/routes/walletRoutes.js, budgetRoutes.js"),
        createText("Controllers: backend/controllers/walletController.js, budgetController.js")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("6. Data Flow"),
      contentBox([
        createText("When a Wallet is created, it initializes a balance. When a transaction occurs, the transactionController modifies the Wallet's balance. For Budgets, the current spent amount is often calculated dynamically or updated when transactions in that category are added.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),
      
      sectionHeaderTable("7. Important Business Logic & Validations"),
      contentBox([
        createText("• Wallet Transfers: Must ensure the source wallet has sufficient funds (unless negative balances are allowed for credit cards). Must update both source and destination atomically if possible."),
        createText("• Budget Rollover: Unspent amounts from the previous month are calculated and added to the new month's limit.")
      ])
    ]
  }]
});

const outputPath = path.resolve(process.cwd(), 'Feature2_Wallets_Budgets.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated successfully at:", outputPath);
}).catch(err => console.error("Error generating document:", err));
