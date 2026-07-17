const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const {
    getAnalyticsCharts,
    smartSearch,
    getRules,
    createRule,
    deleteRule,
    evaluateRulesManually
} = require("../controllers/analyticsController");

router.route("/")
    .get(protect, getAnalyticsCharts);

router.route("/search")
    .get(protect, smartSearch);

router.route("/rules")
    .get(protect, getRules)
    .post(protect, logAudit("CREATED_AUTOMATION_RULE"), createRule);

router.route("/rules/evaluate")
    .post(protect, logAudit("EVALUATED_RULES"), evaluateRulesManually);

router.route("/rules/:id")
    .delete(protect, logAudit("DELETED_AUTOMATION_RULE"), deleteRule);

module.exports = router;
