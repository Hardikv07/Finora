const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authmiddleware");
const { getActivityTimeline } = require("../controllers/adminController");

router.route("/")
    .get(protect, getActivityTimeline);

module.exports = router;
