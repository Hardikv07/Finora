const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign } = require('docx');
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
      bannerTable("FEATURE 1 — USER AUTHENTICATION & SECURITY", ORANGE, WHITE, 22),
      new Paragraph({ spacing: { after: 200 } }),
      
      sectionHeaderTable("1. What problem it solves"),
      contentBox([
        createText("It secures the platform, ensuring users only see their own financial data. It manages identity verification, sessions (via JWTs), passwords, and secures routes from unauthorized access.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("2. User Flow"),
      contentBox([
        createText("1. User lands on LoginPage.jsx. They enter credentials and click login."),
        createText("2. If correct, they are navigated to DashboardPage.jsx."),
        createText("3. If they forget their password, they use the Forgot Password flow, receive an OTP via email, and reset it."),
        createText("4. Session persists via HttpOnly cookies (Access & Refresh tokens).")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("3. Code Flow"),
      contentBox([
        createText("Frontend (LoginPage.jsx) → API Request (Axios) → Backend Routes (authroutes.js) → Controller (authcontroller.js) → DB Query (user.js Model) → Compare Bcrypt Password → Generate JWT Tokens → Set Cookies → Response back to Frontend.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("4. API Endpoints Involved"),
      contentBox([
        createText("• POST /api/auth/register : Creates a new user."),
        createText("• POST /api/auth/login : Verifies credentials, returns short-lived Access Token & long-lived Refresh Token."),
        createText("• POST /api/auth/refresh : Uses Refresh Token cookie to issue a new Access Token."),
        createText("• POST /api/auth/logout : Clears tokens and active sessions."),
        createText("• POST /api/auth/google : OAuth2 integration for Google login.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("5. Files Responsible"),
      contentBox([
        createText("• frontend/src/pages/LoginPage.jsx : Renders the login/signup UI."),
        createText("• backend/models/user.js : Mongoose schema, includes pre-save hook for bcrypt password hashing."),
        createText("• backend/routes/authroutes.js : Maps auth endpoints to controller functions."),
        createText("• backend/controllers/authcontroller.js : Contains all the business logic for login, registration, token refresh, and password reset."),
        createText("• backend/middleware/authmiddleware.js : Exports 'protect', which validates JWT from headers or cookies before allowing access to private routes.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),

      sectionHeaderTable("6. Data Flow & Security Measures"),
      contentBox([
        createText("Credentials are sent via POST. Password is hashed by bcrypt before saving. Upon login, a 15-minute Access Token and a 7-day Refresh Token are generated. These are sent both in JSON and set as HttpOnly cookies to prevent XSS. The authmiddleware validates these tokens on every private request.")
      ]),
      new Paragraph({ spacing: { after: 200 } }),
      
      sectionHeaderTable("7. Important Business Logic & Validations"),
      contentBox([
        createText("• Token Replay Detection: If an old/used refresh token is presented, the system detects a potential breach and clears all active sessions for that user."),
        createText("• SHA-256 Hashed Reset Tokens: OTPs are hashed before being stored in the database so that even DB leaks don't compromise in-flight password resets.")
      ])
    ]
  }]
});

const outputPath = path.resolve(process.cwd(), 'Feature1_Authentication.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Document generated successfully at:", outputPath);
}).catch(err => console.error("Error generating document:", err));
