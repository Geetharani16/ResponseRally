const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { processProviderResponse, validateProviderKeys } = require('../middleware/ai-providers');
const db = require('../database/db');

const router = express.Router();

// Ollama-specific route to test connection
router.get('/health', async (req, res) => {
  try {
    // Test connection to Ollama
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      res.json({ status: 'Ollama is running', models: await response.json() });
    } else {
      res.status(503).json({ status: 'Ollama not available', error: 'Cannot connect to Ollama' });
    }
  } catch (error) {
    res.status(503).json({ status: 'Ollama not available', error: error.message });
  }
});

// Process a prompt specifically for Ollama
router.post('/process', async (req, res) => {
  try {
    const { sessionId, prompt, context = [] } = req.body;
    
    if (!sessionId || !prompt) {
      return res.status(400).json({ error: 'sessionId and prompt are required' });
    }

    let session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Process with Ollama provider specifically
    const ollamaResponse = await processProviderResponse(
      'ollama',  // Ollama provider ID
      prompt,
      context,
      async (update) => {
        // Update response in real-time
        let sessionToUpdate = await db.getSession(sessionId);
        if (sessionToUpdate) {
          // Find and update the Ollama response in the session
          const idx = sessionToUpdate.currentResponses.findIndex(r => r.provider === 'ollama');
          if (idx !== -1) {
            sessionToUpdate.currentResponses[idx] = {
              ...sessionToUpdate.currentResponses[idx],
              ...update
            };
            await db.updateSession(sessionId, sessionToUpdate);
          }
        }
      }
    );

    res.json({ response: ollamaResponse });
  } catch (error) {
    console.error('Error processing Ollama request:', error);
    res.status(500).json({ error: 'Failed to process Ollama request' });
  }
});

module.exports = router;