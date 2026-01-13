const { v4: uuidv4 } = require('uuid');

// In-memory storage (replace with database in production)
const sessions = new Map();

const DEFAULT_PROVIDERS = [
  'gpt', 'llama', 'mistral', 'gemini', 
  'copilot', 'deepseek'
];

class SessionService {
  createSession() {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    
    const session = {
      id: sessionId,
      conversationHistory: [],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: null,
      enabledProviders: [...DEFAULT_PROVIDERS],
      createdAt: now,
      updatedAt: now
    };
    
    sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId) {
    return sessions.get(sessionId) || null;
  }

  resetSession(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    const now = new Date().toISOString();
    
    const resetSession = {
      ...session,
      conversationHistory: [],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: null,
      enabledProviders: [...DEFAULT_PROVIDERS],
      updatedAt: now
    };
    
    sessions.set(sessionId, resetSession);
    return resetSession;
  }

  selectResponse(sessionId, responseId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    const response = session.currentResponses.find(r => r.id === responseId);
    if (!response) {
      throw new Error('Response not found');
    }
    
    const now = new Date().toISOString();
    
    // Create conversation turn
    const conversationTurn = {
      id: uuidv4(),
      userPrompt: session.currentPrompt,
      selectedResponse: response,
      allResponses: [...session.currentResponses],
      timestamp: Date.now()
    };
    
    // Update session
    const updatedSession = {
      ...session,
      conversationHistory: [...session.conversationHistory, conversationTurn],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: responseId,
      updatedAt: now
    };
    
    sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  toggleProvider(sessionId, providerId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    const now = new Date().toISOString();
    const enabledProviders = [...session.enabledProviders];
    
    const index = enabledProviders.indexOf(providerId);
    if (index > -1) {
      // Remove provider
      enabledProviders.splice(index, 1);
    } else {
      // Add provider
      enabledProviders.push(providerId);
    }
    
    const updatedSession = {
      ...session,
      enabledProviders,
      updatedAt: now
    };
    
    sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  retryProvider(sessionId, providerId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    const now = new Date().toISOString();
    const updatedResponses = session.currentResponses.map(response => {
      if (response.provider === providerId) {
        return {
          ...response,
          status: 'pending',
          errorMessage: null,
          streamingProgress: 0,
          isStreaming: false,
          retryCount: (response.retryCount || 0) + 1,
          timestamp: Date.now()
        };
      }
      return response;
    });
    
    const updatedSession = {
      ...session,
      currentResponses: updatedResponses,
      updatedAt: now
    };
    
    sessions.set(sessionId, updatedSession);
    
    // Trigger reprocessing (this would be connected to provider service)
    // providerService.retryProvider(sessionId, providerId);
    
    return updatedSession;
  }
  
  // Method to update a session directly (used by provider service)
  updateSession(sessionId, sessionData) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    
    const updatedSession = {
      ...session,
      ...sessionData,
      updatedAt: new Date().toISOString()
    };
    
    sessions.set(sessionId, updatedSession);
    return updatedSession;
  }
}

module.exports = new SessionService();