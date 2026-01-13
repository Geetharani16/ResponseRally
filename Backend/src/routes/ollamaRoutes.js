const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  checkOllamaHealth,
  processOllamaPrompt
} = require('../controllers/ollamaController');

router.get('/health', checkOllamaHealth);
router.post('/process', processOllamaPrompt);

module.exports = router;