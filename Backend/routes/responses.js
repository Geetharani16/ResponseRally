const express = require('express');
const { v4: uuidv4 } = require('uuid');
const sessionService = require('../src/services/sessionService');

const router = express.Router();

// Select best response
router.post('/:sessionId/select-response', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { responseId } = req.body;
    
    let session = await sessionService.getSession(sessionId);
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
    
    await sessionService.updateSession(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error selecting response:', error);
    res.status(500).json({ error: 'Failed to select response' });
  }
});

// Toggle provider
router.post('/:sessionId/toggle-provider', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    let session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.enabledProviders.includes(providerId)) {
      session.enabledProviders = session.enabledProviders.filter(p => p !== providerId);
    } else {
      session.enabledProviders.push(providerId);
    }
    
    session.updatedAt = new Date();
    await sessionService.updateSession(sessionId, session);
    res.json(session);
  } catch (error) {
    console.error('Error toggling provider:', error);
    res.status(500).json({ error: 'Failed to toggle provider' });
  }
});

// Retry provider
router.post('/:sessionId/retry-provider', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    let session = await sessionService.getSession(sessionId);
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
    
    // In a real implementation, we would retry the provider response
    // For now, we'll return a successful response with updated status
    session.currentResponses[responseIndex].status = 'success';
    session.currentResponses[responseIndex].response = `Retry response from ${providerId} provider`;
    session.currentResponses[responseIndex].isStreaming = false;
    session.currentResponses[responseIndex].streamingProgress = 100;
    
    session.updatedAt = new Date();
    await sessionService.updateSession(sessionId, session);
    
    res.json(session);
  } catch (error) {
    console.error('Error retrying provider:', error);
    res.status(500).json({ error: 'Failed to retry provider' });
  }
});

// NEW: Get all responses for a session (including best response tags)
router.get('/:sessionId/responses', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get all responses for the session
    const responses = await sessionService.getSessionResponses(sessionId);
    
    res.json({
      sessionId,
      responses,
      totalResponses: responses.length,
      bestResponses: responses.filter(r => r.isBest).length
    });
  } catch (error) {
    console.error('Error fetching session responses:', error);
    res.status(500).json({ error: 'Failed to fetch session responses' });
  }
});

// NEW: Get all responses for a specific conversation
router.get('/:sessionId/conversation/:conversationId/responses', async (req, res) => {
  try {
    const { sessionId, conversationId } = req.params;
    
    // Get all responses for the conversation
    const responses = await sessionService.getConversationResponses(conversationId);
    
    res.json({
      sessionId,
      conversationId,
      responses,
      totalResponses: responses.length,
      bestResponses: responses.filter(r => r.isBest).length
    });
  } catch (error) {
    console.error('Error fetching conversation responses:', error);
    res.status(500).json({ error: 'Failed to fetch conversation responses' });
  }
});

module.exports = router;