const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createSession,
  getSession,
  resetSession,
  selectResponse,
  toggleProvider,
  retryProvider
} = require('../controllers/sessionController');

// Session Management
router.post('/', createSession);
router.get('/:sessionId', getSession);
router.post('/:sessionId/reset', resetSession);
router.post('/:sessionId/select-response', selectResponse);
router.post('/:sessionId/toggle-provider', toggleProvider);
router.post('/:sessionId/retry-provider', retryProvider);

module.exports = router;