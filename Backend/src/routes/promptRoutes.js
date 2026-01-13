const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { submitPrompt } = require('../controllers/promptController');

router.post('/', submitPrompt);

module.exports = router;