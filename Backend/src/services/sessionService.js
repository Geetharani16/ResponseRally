const { v4: uuidv4 } = require('uuid');
const Database = require('../../database/db');

const DEFAULT_PROVIDERS = [
  'gpt', 'llama', 'mistral', 'gemini', 
  'copilot', 'deepseek'
];

class SessionService {
  constructor() {
    this.db = new Database();
  }
  async createSession(userId = null) {
    const sessionId = uuidv4();
    const now = new Date().toISOString();
    
    const session = {
      id: sessionId,
      userId,
      conversationHistory: [],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: null,
      enabledProviders: [...DEFAULT_PROVIDERS],
      createdAt: now,
      updatedAt: now
    };
    
    const createdSession = await this.db.createSession(session);
    return createdSession;
  }

  async getSession(sessionId) {
    return await this.db.getSession(sessionId);
  }

  async resetSession(sessionId) {
    const session = await this.db.getSession(sessionId);
    if (!session) return null;
    
    const now = new Date().toISOString();
    
    const resetSession = {
      conversationHistory: [],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: null,
      enabledProviders: [...DEFAULT_PROVIDERS],
      updatedAt: now
    };
    
    return await this.db.updateSession(sessionId, resetSession);
  }

  async selectResponse(sessionId, responseId) {
    const session = await this.db.getSession(sessionId);
    if (!session) return null;
    
    const response = session.currentResponses.find(r => r.id === responseId);
    if (!response) {
      throw new Error('Response not found');
    }
    
    const now = new Date().toISOString();
    
    // Create conversation turn
    const conversationTurn = {
      id: uuidv4(),
      sessionId: sessionId,
      turnIndex: session.conversationHistory.length,
      userPrompt: session.currentPrompt,
      selectedResponse: response,
      allResponses: [...session.currentResponses],
      timestamp: Date.now()
    };
    
    // Save conversation to database
    await this.db.createConversation(conversationTurn);
    
    // Save all responses individually to the responses collection with best response tagged
    for (const resp of session.currentResponses) {
      await this.db.createResponse({
        ...resp,
        conversationId: conversationTurn.id,
        isBest: resp.id === responseId, // Mark as best if it matches the selected response
        createdAt: new Date()
      });
    }
    
    // Update session
    const updatedSession = {
      conversationHistory: [...session.conversationHistory, conversationTurn],
      currentPrompt: '',
      currentResponses: [],
      isProcessing: false,
      selectedResponseId: responseId,
      updatedAt: now
    };
    
    return await this.db.updateSession(sessionId, updatedSession);
  }
  
  // Method to get all responses for a conversation with best response tagging
  async getConversationResponses(conversationId) {
    try {
      return await this.db.responses.find({ conversationId }).toArray();
    } catch (error) {
      console.error('Error getting conversation responses:', error);
      throw error;
    }
  }
  
  // Method to get all responses for a session
  async getSessionResponses(sessionId) {
    try {
      // First get all conversations for the session
      const conversations = await this.db.conversations.find({ sessionId }).toArray();
      
      // Get conversation IDs
      const conversationIds = conversations.map(conv => conv.id);
      
      // Get all responses for those conversations
      if (conversationIds.length === 0) {
        return [];
      }
      
      return await this.db.responses.find({ 
        conversationId: { $in: conversationIds } 
      }).toArray();
    } catch (error) {
      console.error('Error getting session responses:', error);
      throw error;
    }
  }
  
  // Method to get conversations by session (needed for analytics)
  async getConversationsBySession(sessionId) {
    try {
      return await this.db.conversations.find({ sessionId }).toArray();
    } catch (error) {
      console.error('Error getting conversations by session:', error);
      throw error;
    }
  }

  async toggleProvider(sessionId, providerId) {
    const session = await this.db.getSession(sessionId);
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
      enabledProviders,
      updatedAt: now
    };
    
    return await this.db.updateSession(sessionId, updatedSession);
  }

  async retryProvider(sessionId, providerId) {
    const session = await this.db.getSession(sessionId);
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
      currentResponses: updatedResponses,
      updatedAt: now
    };
    
    return await this.db.updateSession(sessionId, updatedSession);
  }
  
  // Method to update a session directly (used by provider service)
  async updateSession(sessionId, sessionData) {
    const session = await this.db.getSession(sessionId);
    if (!session) return null;
    
    return await this.db.updateSession(sessionId, sessionData);
  }

  // Analytics methods
  async getUserAnalytics(userId) {
    return await this.db.getAnalytics(userId);
  }

  async getUserSessions(userId) {
    return await this.db.sessions.find({ userId }).sort({ createdAt: -1 }).toArray();
  }

  // Enhanced analytics for dashboard with comprehensive error handling
  async getDashboardData(userId) {
    try {
      console.log(`SessionService: Starting dashboard data generation for user: ${userId}`);
      console.log(`SessionService: UserId type: ${typeof userId}`);
      console.log(`SessionService: UserId value: "${userId}"`);
      
      // Validate userId
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid userId provided');
      }
      
      // Get all user sessions
      console.log(`SessionService: Fetching sessions for user: ${userId}`);
      const sessions = await this.db.sessions.find({ userId }).toArray();
      console.log(`SessionService: Found ${sessions.length} sessions`);
      
      if (sessions.length === 0) {
        console.log(`SessionService: No sessions found for user ${userId}, returning empty data`);
        return this.getEmptyDashboardData();
      }

      // Get all conversations for user
      const sessionIds = sessions.map(s => s.id);
      console.log(`SessionService: Fetching conversations for ${sessionIds.length} sessions`);
      const conversations = await this.db.conversations.find({ 
        sessionId: { $in: sessionIds } 
      }).toArray();
      console.log(`SessionService: Found ${conversations.length} conversations`);

      // Get all responses
      const conversationIds = conversations.map(c => c.id);
      console.log(`SessionService: Fetching responses for ${conversationIds.length} conversations`);
      const responses = conversationIds.length > 0 
        ? await this.db.responses.find({
            conversationId: { $in: conversationIds }
          }).toArray()
        : [];
      console.log(`SessionService: Found ${responses.length} responses`);

      // Calculate overall stats
      console.log('SessionService: Calculating overall statistics');
      const overallStats = this.calculateOverallStats(sessions, conversations, responses);
      
      // Calculate provider stats
      console.log('SessionService: Calculating provider statistics');
      const providerStats = this.calculateProviderStats(responses);
      
      // Calculate performance trends (last 7 days)
      console.log('SessionService: Calculating performance trends');
      const performanceTrends = this.calculatePerformanceTrends(responses);

      const dashboardData = {
        overallStats,
        providerStats,
        recentConversations: conversations.slice(-10), // Last 10 conversations
        performanceTrends
      };
      
      console.log(`SessionService: Dashboard data generation completed for user: ${userId}`);
      console.log(`SessionService: Final stats - Conversations: ${overallStats.totalConversations}, Responses: ${overallStats.totalResponses}`);
      
      return dashboardData;
    } catch (error) {
      console.error(`SessionService: Error generating dashboard data for user ${userId}:`, error);
      console.error('SessionService: Error stack:', error.stack);
      return this.getEmptyDashboardData();
    }
  }

  getEmptyDashboardData() {
    return {
      overallStats: {
        totalConversations: 0,
        totalPrompts: 0,
        totalResponses: 0,
        successfulResponses: 0,
        errorResponses: 0,
        avgLatency: 0,
        avgTokens: 0,
        avgResponseLength: 0,
        mostSelectedProvider: 'gpt',
        fastestProvider: 'gpt',
        mostReliableProvider: 'gpt',
        totalTokensGenerated: 0,
        avgTokensPerSecond: 0,
        totalRetries: 0
      },
      providerStats: [],
      recentConversations: [],
      performanceTrends: []
    };
  }

  calculateOverallStats(sessions, conversations, responses) {
    const successfulResponses = responses.filter(r => r.status === 'success').length;
    const errorResponses = responses.filter(r => r.status === 'error' || r.status === 'rate-limited').length;
    const totalResponses = responses.length;
    
    const avgLatency = responses.length > 0 
      ? responses.reduce((sum, r) => sum + (r.metrics?.latencyMs || 0), 0) / responses.length
      : 0;
    
    const avgTokens = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.metrics?.tokenCount || 0), 0) / responses.length
      : 0;
    
    const avgResponseLength = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.metrics?.responseLength || 0), 0) / responses.length
      : 0;

    const totalTokensGenerated = responses.reduce((sum, r) => sum + (r.metrics?.tokenCount || 0), 0);
    const avgTokensPerSecond = responses.length > 0
      ? responses.reduce((sum, r) => sum + (r.metrics?.tokensPerSecond || 0), 0) / responses.length
      : 0;
    
    const totalRetries = responses.reduce((sum, r) => sum + (r.retryCount || 0), 0);

    // Find most selected provider
    const providerCounts = {};
    responses.forEach(r => {
      providerCounts[r.provider] = (providerCounts[r.provider] || 0) + 1;
    });
    const mostSelectedProvider = Object.keys(providerCounts).reduce((a, b) => 
      providerCounts[a] > providerCounts[b] ? a : b, 'gpt');

    // Find fastest provider
    const providerLatencies = {};
    responses.filter(r => r.status === 'success' && r.metrics?.latencyMs).forEach(r => {
      if (!providerLatencies[r.provider]) {
        providerLatencies[r.provider] = [];
      }
      providerLatencies[r.provider].push(r.metrics.latencyMs);
    });
    const avgProviderLatencies = {};
    Object.keys(providerLatencies).forEach(provider => {
      avgProviderLatencies[provider] = providerLatencies[provider].reduce((a, b) => a + b, 0) / providerLatencies[provider].length;
    });
    const fastestProvider = Object.keys(avgProviderLatencies).reduce((a, b) => 
      avgProviderLatencies[a] < avgProviderLatencies[b] ? a : b, 'gpt');

    // Find most reliable provider
    const providerSuccessRates = {};
    Object.keys(providerCounts).forEach(provider => {
      const providerResponses = responses.filter(r => r.provider === provider);
      const successful = providerResponses.filter(r => r.status === 'success').length;
      providerSuccessRates[provider] = successful / providerResponses.length;
    });
    const mostReliableProvider = Object.keys(providerSuccessRates).reduce((a, b) => 
      providerSuccessRates[a] > providerSuccessRates[b] ? a : b, 'gpt');

    return {
      totalConversations: conversations.length,
      totalPrompts: sessions.length,
      totalResponses,
      successfulResponses,
      errorResponses,
      avgLatency,
      avgTokens,
      avgResponseLength,
      mostSelectedProvider,
      fastestProvider,
      mostReliableProvider,
      totalTokensGenerated,
      avgTokensPerSecond,
      totalRetries
    };
  }

  calculateProviderStats(responses) {
    const providers = ['gpt', 'llama', 'mistral', 'gemini', 'copilot', 'deepseek'];
    const providerData = {};
    
    // Initialize provider data
    providers.forEach(provider => {
      providerData[provider] = {
        totalResponses: 0,
        successfulResponses: 0,
        errorResponses: 0,
        totalLatency: 0,
        totalTokens: 0,
        totalResponseLength: 0,
        totalFirstTokenLatency: 0,
        totalTokensPerSecond: 0,
        totalRetries: 0,
        responseCount: 0
      };
    });

    // Aggregate response data
    responses.forEach(response => {
      const provider = response.provider;
      if (!providerData[provider]) return;
      
      const data = providerData[provider];
      data.totalResponses++;
      data.responseCount++;
      
      if (response.status === 'success') {
        data.successfulResponses++;
        data.totalLatency += response.metrics?.latencyMs || 0;
        data.totalTokens += response.metrics?.tokenCount || 0;
        data.totalResponseLength += response.metrics?.responseLength || 0;
        data.totalFirstTokenLatency += response.metrics?.firstTokenLatencyMs || 0;
        data.totalTokensPerSecond += response.metrics?.tokensPerSecond || 0;
      } else {
        data.errorResponses++;
      }
      
      data.totalRetries += response.retryCount || 0;
    });

    // Convert to ProviderStats format
    return providers.map(provider => {
      const data = providerData[provider];
      const successRate = data.totalResponses > 0 ? data.successfulResponses / data.totalResponses : 0;
      const selectionRate = responses.length > 0 ? data.totalResponses / responses.length : 0;
      
      return {
        provider,
        totalResponses: data.totalResponses,
        successfulResponses: data.successfulResponses,
        errorResponses: data.errorResponses,
        avgLatency: data.successfulResponses > 0 ? data.totalLatency / data.successfulResponses : 0,
        avgTokens: data.successfulResponses > 0 ? data.totalTokens / data.successfulResponses : 0,
        avgResponseLength: data.successfulResponses > 0 ? data.totalResponseLength / data.successfulResponses : 0,
        totalTokens: data.totalTokens,
        selectionRate,
        successRate,
        avgFirstTokenLatency: data.successfulResponses > 0 ? data.totalFirstTokenLatency / data.successfulResponses : 0,
        avgTokensPerSecond: data.successfulResponses > 0 ? data.totalTokensPerSecond / data.successfulResponses : 0,
        totalRetries: data.totalRetries
      };
    }).filter(stats => stats.totalResponses > 0); // Only return providers with data
  }

  calculatePerformanceTrends(responses) {
    // Group responses by day for last 7 days
    const now = new Date();
    const trends = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayResponses = responses.filter(r => {
        const responseDate = new Date(r.createdAt);
        return responseDate.toISOString().split('T')[0] === dateStr;
      });
      
      const successfulResponses = dayResponses.filter(r => r.status === 'success');
      
      const avgLatency = successfulResponses.length > 0
        ? successfulResponses.reduce((sum, r) => sum + (r.metrics?.latencyMs || 0), 0) / successfulResponses.length
        : 0;
      
      const successRate = dayResponses.length > 0
        ? successfulResponses.length / dayResponses.length
        : 0;
      
      trends.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        avgLatency: Math.round(avgLatency),
        successRate: parseFloat(successRate.toFixed(3)),
        totalResponses: dayResponses.length
      });
    }
    
    return trends;
  }
}

module.exports = new SessionService();