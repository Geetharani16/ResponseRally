const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { processProviderResponse, validateProviderKeys } = require('../middleware/ai-providers');
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
router.post('/session', async (req, res) => {
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
router.get('/session/:sessionId', async (req, res) => {
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

// Submit prompt to multiple providers
router.post('/prompt', async (req, res) => {
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
    const responses = await Promise.all(
      initialResponses.map(async (response) => {
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
      })
    );
    
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

// Select best response
router.post('/session/:sessionId/select-response', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { responseId } = req.body;
    
    let session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const selectedResponse = session.currentResponses.find(r => r.id === responseId);
    if (!selectedResponse) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    // Create a new conversation turn
    const newTurn = {
      id: uuidv4(),
      userPrompt: session.currentPrompt,
      selectedResponse,
      allResponses: [...session.currentResponses],
      timestamp: Date.now(),
    };
    
    session.conversationHistory.push(newTurn);
    session.selectedResponseId = responseId;
    session.currentResponses = [];
    session.currentPrompt = '';
    session.updatedAt = new Date();
    
    await db.updateSession(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error selecting response:', error);
    res.status(500).json({ error: 'Failed to select response' });
  }
});

// Toggle provider
router.post('/session/:sessionId/toggle-provider', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    let session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.enabledProviders.includes(providerId)) {
      session.enabledProviders = session.enabledProviders.filter(p => p !== providerId);
    } else {
      session.enabledProviders.push(providerId);
    }
    
    session.updatedAt = new Date();
    await db.updateSession(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error toggling provider:', error);
    res.status(500).json({ error: 'Failed to toggle provider' });
  }
});

// Retry provider
router.post('/session/:sessionId/retry-provider', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    let session = await db.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Find the response for this provider
    const responseIndex = session.currentResponses.findIndex(r => r.provider === providerId);
    if (responseIndex === -1) {
      return res.status(404).json({ error: 'Provider response not found' });
    }
    
    // Update the response status to pending
    session.currentResponses[responseIndex].status = 'pending';
    session.currentResponses[responseIndex].retryCount += 1;
    session.currentResponses[responseIndex].errorMessage = null;
    session.updatedAt = new Date();
    
    // Retry the provider response
    const updatedResponse = await processProviderResponse(
      providerId,
      session.currentResponses[responseIndex].prompt,
      session.conversationHistory,
      async (update) => {
        // Update response in real-time
        let sessionToUpdate = await db.getSession(sessionId);
        if (sessionToUpdate) {
          const idx = sessionToUpdate.currentResponses.findIndex(r => r.id === session.currentResponses[responseIndex].id);
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
    
    session.currentResponses[responseIndex] = {
      ...session.currentResponses[responseIndex],
      ...updatedResponse
    };
    
    session.updatedAt = new Date();
    await db.updateSession(sessionId, session);
    
    res.json(session);
  } catch (error) {
    console.error('Error retrying provider:', error);
    res.status(500).json({ error: 'Failed to retry provider' });
  }
});

// Reset session
router.post('/session/:sessionId/reset', async (req, res) => {
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