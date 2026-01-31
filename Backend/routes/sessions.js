const express = require('express');
const sessionService = require('../src/services/sessionService');

const router = express.Router();

// Create a new session
router.post('/', async (req, res) => {
  try {
    console.log(`\n>>> Creating new session via routes at ${new Date().toISOString()} <<<`);
    
    // Generate a unique user ID for this session
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`>>> Generated User ID: ${userId}`);
    
    const session = await sessionService.createSession(userId);
    console.log(`>>> New session created successfully with ID: ${session.id}`);
    console.log(`>>> Session userId field: ${session.userId}`);
    console.log(`>>> Enabled providers: ${session.enabledProviders.join(', ')}`);
    console.log(`>>> Session created at: ${session.createdAt}\n`);
    
    // Return session with userId so frontend can store it
    res.status(201).json({
      ...session,
      userId: userId
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// Reset session
router.post('/:sessionId/reset', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    const session = await sessionService.resetSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error resetting session:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

module.exports = router;