const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { processProviderResponse, validateProviderKeys } = require('../middleware/ai-providers');
const db = require('../database/db');

const router = express.Router();

// Submit prompt to multiple providers
router.post('/', async (req, res) => {
  try {
    const { sessionId, prompt, providers: selectedProviders, context } = req.body;
    
    if (!sessionId || !prompt) {
      return res.status(400).json({ error: 'sessionId and prompt are required' });
    }
    
    let session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Update session with new prompt
    session.currentPrompt = prompt;
    session.isProcessing = true;
    session.selectedResponseId = null;
    session.currentResponses = [];
    
    // Validate API keys
    const validation = validateProviderKeys();
    if (!validation.isValid) {
      console.warn('Missing API keys for providers:', validation.missingKeys);
    }
    
    // Initialize responses for each selected provider
    const providersToUse = selectedProviders || session.enabledProviders;
    const initialResponses = providersToUse.map(provider => ({
      id: uuidv4(),
      provider,
      prompt,
      response: '',
      status: 'pending',
      metrics: {
        latencyMs: null,
        tokenCount: null,
        responseLength: 0,
        firstTokenLatencyMs: null,
        tokensPerSecond: null,
      },
      retryCount: 0,
      errorMessage: null,
      streamingProgress: 0,
      timestamp: Date.now(),
      isStreaming: false,
    }));
    
    session.currentResponses = initialResponses;
    await db.updateSession(sessionId, session);
    
    // Process responses from different providers concurrently
    const responsePromises = initialResponses.map(async (response) => {
      try {
        return await processProviderResponse(
          response.provider,
          response.prompt,
          context || [],
          async (update) => {
            // Update response in real-time (this would typically use WebSockets or SSE)
            let sessionToUpdate = await db.getSession(sessionId);
            if (sessionToUpdate) {
              const idx = sessionToUpdate.currentResponses.findIndex(r => r.id === response.id);
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
      } catch (error) {
        console.error(`Error processing response for ${response.provider}:`, error);
        return {
          ...response,
          status: 'error',
          errorMessage: error.message || 'Provider temporarily unavailable',
          isStreaming: false,
          streamingProgress: 0,
          metrics: {
            latencyMs: null,
            tokenCount: null,
            responseLength: 0,
            firstTokenLatencyMs: null,
            tokensPerSecond: null
          }
        };
      }
    });
    
    const responses = await Promise.all(responsePromises);
    
    // Update session with final responses
    session.currentResponses = responses.map((response, index) => ({
      ...initialResponses[index],
      ...response
    }));
    
    session.isProcessing = false;
    session.updatedAt = new Date();
    
    await db.updateSession(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error processing prompt:', error);
    res.status(500).json({ error: 'Failed to process prompt' });
  }
});

module.exports = router;