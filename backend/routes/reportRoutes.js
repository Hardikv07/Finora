const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const { exportPDF, exportExcel, exportCSV } = require("../controllers/reportController");

router.get("/pdf", protect, logAudit("EXPORTED_PDF_REPORT"), exportPDF);
router.get("/excel", protect, logAudit("EXPORTED_EXCEL_REPORT"), exportExcel);
router.get("/csv", protect, logAudit("EXPORTED_CSV_REPORT"), exportCSV);

module.exports = router;
