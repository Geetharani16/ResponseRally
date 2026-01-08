const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/db');

const router = express.Router();

// Helper function to create a new session
const createSession = () => {
  return {
    id: uuidv4(),
    conversationHistory: [],
    currentPrompt: '',
    currentResponses: [],
    isProcessing: false,
    selectedResponseId: null,
    enabledProviders: ['gpt', 'llama', 'mistral', 'gemini', 'copilot', 'deepseek'],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Create a new session
router.post('/', async (req, res) => {
  try {
    const session = createSession();
    await db.createSession(session);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Get session by ID
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await db.getSession(sessionId);
    
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
    
    const session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Create a new session object but keep the ID
    const newSession = createSession();
    newSession.id = sessionId; // Preserve the session ID
    await db.updateSession(sessionId, newSession);
    
    res.json(newSession);
  } catch (error) {
    console.error('Error resetting session:', error);
    res.status(500).json({ error: 'Failed to reset session' });
  }
});

module.exports = router;