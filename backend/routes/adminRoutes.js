const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const logAudit = require("../middleware/auditmiddleware");
const {
    getAdminOverview,
    getUsersList,
    toggleBlockUser,
    getAuditLogs,
    getActivityTimeline
} = require("../controllers/adminController");

router.route("/overview")
    .get(protect, getAdminOverview);

router.route("/users")
    .get(protect, getUsersList);

router.route("/users/:id/block")
    .put(protect, logAudit("TOGGLED_USER_BLOCK_STATUS"), toggleBlockUser);

router.route("/audit-logs")
    .get(protect, getAuditLogs);

router.route("/timeline")
    .get(protect, getActivityTimeline);

module.exports = router;
