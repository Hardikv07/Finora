const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authmiddleware');
const { chat } = require('../controllers/copilotController');

// POST /api/copilot/chat — Protected, requires JWT token
router.post('/chat', protect, chat);

module.exports = router;
