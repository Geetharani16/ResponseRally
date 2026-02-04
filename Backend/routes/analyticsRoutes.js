const express = require('express');
const sessionService = require('../src/services/sessionService');

const router = express.Router();

// Get dashboard data for a user
router.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const dashboardData = await sessionService.getDashboardData(userId);
    
    res.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// NEW: Get detailed response analytics for a user
router.get('/responses/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get all sessions for the user
    const sessions = await sessionService.getUserSessions(userId);
    const sessionIds = sessions.map(s => s.id);
    
    if (sessionIds.length === 0) {
      return res.json({
        userId,
        totalSessions: 0,
        totalConversations: 0,
        totalResponses: 0,
        totalBestResponses: 0,
        responses: []
      });
    }
    
    // Get all conversations for user sessions
    const allConversations = [];
    for (const sessionId of sessionIds) {
      const conversations = await sessionService.getConversationsBySession(sessionId);
      allConversations.push(...conversations);
    }
    
    // Get all responses for those conversations
    const allResponses = [];
    for (const conversation of allConversations) {
      const responses = await sessionService.getConversationResponses(conversation.id);
      allResponses.push(...responses);
    }
    
    // Calculate statistics
    const totalBestResponses = allResponses.filter(r => r.isBest).length;
    
    res.json({
      userId,
      totalSessions: sessions.length,
      totalConversations: allConversations.length,
      totalResponses: allResponses.length,
      totalBestResponses,
      responseRate: allConversations.length > 0 ? (allResponses.length / allConversations.length) : 0, // Avg responses per conversation
      responses: allResponses,
      providerBreakdown: allResponses.reduce((acc, response) => {
        if (!acc[response.provider]) {
          acc[response.provider] = { total: 0, best: 0 };
        }
        acc[response.provider].total++;
        if (response.isBest) {
          acc[response.provider].best++;
        }
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching user response analytics:', error);
    res.status(500).json({ error: 'Failed to fetch user response analytics' });
  }
});

// NEW: Get response analytics for a specific session
router.get('/responses/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get session to verify ownership/validity
    const session = await sessionService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Get all responses for the session
    const responses = await sessionService.getSessionResponses(sessionId);
    
    // Calculate statistics for this session
    const totalBestResponses = responses.filter(r => r.isBest).length;
    
    res.json({
      sessionId,
      sessionOwnerId: session.userId,
      totalResponses: responses.length,
      totalBestResponses,
      responseRate: session.conversationHistory.length > 0 ? (responses.length / session.conversationHistory.length) : 0,
      responses,
      providerBreakdown: responses.reduce((acc, response) => {
        if (!acc[response.provider]) {
          acc[response.provider] = { total: 0, best: 0 };
        }
        acc[response.provider].total++;
        if (response.isBest) {
          acc[response.provider].best++;
        }
        return acc;
      }, {}),
      conversationSummary: session.conversationHistory.map(conv => ({
        id: conv.id,
        turnIndex: conv.turnIndex,
        userPrompt: conv.userPrompt,
        timestamp: conv.timestamp,
        selectedResponseId: conv.selectedResponse?.id || null,
        responseCount: responses.filter(r => r.conversationId === conv.id).length
      }))
    });
  } catch (error) {
    console.error('Error fetching session response analytics:', error);
    res.status(500).json({ error: 'Failed to fetch session response analytics' });
  }
});

module.exports = router;