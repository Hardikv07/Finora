const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign, HeadingLevel } = require('docx');
const fs = require('fs');
const path = require('path');

const pageWidth = 9360;

const DARK_BG = "0d1b2a";
const ORANGE = "ff6b35";
const BLUE_DARK = "1a3c5e";
const WHITE = "FFFFFF";
const GRAY_BG = "f4f6fa";
const SECTION_HEADER_BG = "1a3c5e";

const noBorder = () => ({ style: BorderStyle.NONE, size: 0, color: "FFFFFF" });

function bannerTable(text, bgColor, textColor = WHITE, fontSize = 24) {
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
    borders: {
      top: noBorder(), bottom: noBorder(), left: noBorder(), right: noBorder(),
      insideH: noBorder(), insideV: noBorder()
    },
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

function createBullet(text) {
  return new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Arial", color: "333333" })],
    bullet: { level: 0 },
    spacing: { after: 60 }
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 20 } } }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      bannerTable("Finora Documentation", DARK_BG),
      new Paragraph({ spacing: { after: 200 } }),
      bannerTable("PHASE 1 — HIGH LEVEL OVERVIEW", ORANGE, WHITE, 22),
      new Paragraph({ spacing: { after: 200 } }),
      
      sectionHeaderTable("What problem does this project solve?"),
      contentBox([
        createText("Finora solves the problem of personal finance management by providing a centralized platform to track income and expenses, manage budgets, monitor wallets and bank accounts, and track financial goals. It simplifies transaction entry via Gemini AI-powered OCR for receipts.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("What type of application is this?"),
      contentBox([
        createText("A web-based personal finance and expense tracking application utilizing a Single Page Application (SPA) frontend with a RESTful API backend.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Who are the users?"),
      contentBox([
        createText("Individuals who want to track their daily expenses, manage multiple wallets or bank accounts, set saving goals, and visualize their financial habits.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("What technologies are used?"),
      contentBox([
        createBullet("Frontend: React, Vite, Tailwind CSS, Tesseract.js (for client-side OCR)"),
        createBullet("Backend: Node.js, Express.js, Google Gemini API (gemini-1.5-flash for receipt parsing)"),
        createBullet("Database: MongoDB via Mongoose"),
        createBullet("Authentication: JWT (JSON Web Tokens), bcryptjs"),
        createBullet("Other: node-cron (for background jobs), Cloudinary (for image uploads), Nodemailer")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Folder structure"),
      contentBox([
        createText("Finora/"),
        createBullet("backend/: Contains the server logic"),
        createBullet("backend/config/: Database & environment configuration"),
        createBullet("backend/controllers/: Request handling logic"),
        createBullet("backend/middleware/: Auth, upload, audit middlewares"),
        createBullet("backend/models/: Mongoose schemas (User, Transaction, Wallet, Goal, etc.)"),
        createBullet("backend/routes/: API endpoints"),
        createBullet("backend/services/: Business logic, Gemini API, Cron jobs, Search tries"),
        createBullet("backend/utils/: Helper functions"),
        createBullet("frontend/: Contains the React application (src, public, assets)"),
        createBullet("server.js: Application entry point"),
        createBullet("package.json: Project dependencies")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Overall architecture & Design pattern"),
      contentBox([
        createBullet("Architecture: Client-Server Architecture. The React frontend communicates with the Node/Express backend via REST APIs. The backend processes business logic, interacts with external APIs (Gemini, Cloudinary), and persists data in MongoDB."),
        createBullet("Design Pattern: MVC (Model-View-Controller) on the backend. Logic is separated into Models (database schemas), Views (React frontend), and Controllers (request handlers and services).")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Database used"),
      contentBox([
        createText("MongoDB. Key collections include users, transactions, wallets, budgets, goals, bills, recurring transactions, rules, investments, loans, and audit logs.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Authentication & Authorization mechanism"),
      contentBox([
        createBullet("Authentication: JSON Web Token (JWT) based authentication. Passwords are encrypted using bcryptjs. The backend issues a JWT on login, which the frontend sends in the Authorization header as a Bearer token."),
        createBullet("Authorization: Owner-based access. Middleware (authmiddleware.js) decodes the JWT, attaches the user to the request, and ensures users can only access or modify their own financial records.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("External services & Third-party APIs"),
      contentBox([
        createBullet("Cloudinary: Used for storing uploaded images (e.g., receipts, avatars)."),
        createBullet("Google Gemini API (gemini-1.5-flash): Used for advanced OCR and extracting transaction details (merchant, paid amount, currency, date, category) from receipts."),
        createBullet("MongoDB Atlas: Cloud database service (implied from standard MERN setups).")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("Overall Architecture (Mermaid Diagram text)"),
      contentBox([
        createText("```mermaid"),
        createText("graph TD"),
        createText("    User[User (Browser)] -->|HTTP/REST| Frontend[React SPA / Tailwind]"),
        createText("    Frontend -->|API Requests with JWT| Backend[Node.js / Express Server]"),
        createText("    Backend -->|Mongoose ODMs| DB[(MongoDB)]"),
        createText("    Backend -->|Image Uploads| Cloudinary[Cloudinary API]"),
        createText("    Backend -->|Receipt Analysis| Gemini[Google Gemini API]"),
        createText("    Frontend -->|Client-side OCR| Tesseract[Tesseract.js]"),
        createText("```")
      ])
    ]
  }]
});

const outputPath = path.resolve(process.cwd(), 'Phase1_Documentation.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated successfully at:", outputPath);
}).catch(err => {
  console.error("Error generating document:", err);
});
