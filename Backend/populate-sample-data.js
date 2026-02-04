const Database = require('./database/db');
const { v4: uuidv4 } = require('uuid');

async function populateSampleData() {
  const db = new Database();
  try {
    await db.connect();
    console.log('Connected to database');
    
    // Clear existing data
    await db.sessions.deleteMany({});
    await db.conversations.deleteMany({});
    await db.responses.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create sample sessions for test users
    const sessions = [
      {
        id: uuidv4(),
        userId: 'test@example.com',
        conversationHistory: [],
        currentPrompt: '',
        currentResponses: [],
        isProcessing: false,
        selectedResponseId: null,
        enabledProviders: ['gpt', 'llama', 'mistral'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: uuidv4(),
        userId: 'madhankumarmurugaraj@gmail.com',
        conversationHistory: [],
        currentPrompt: '',
        currentResponses: [],
        isProcessing: false,
        selectedResponseId: null,
        enabledProviders: ['gpt', 'gemini', 'copilot'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
    
    // Insert sessions
    for (const session of sessions) {
      await db.sessions.insertOne(session);
    }
    console.log('Inserted sample sessions');
    
    // Create sample conversations
    const conversations = [];
    const responses = [];
    
    // Conversations for test@example.com
    for (let i = 0; i < 8; i++) {
      const convId = uuidv4();
      const sessionId = sessions[0].id;
      
      conversations.push({
        id: convId,
        sessionId: sessionId,
        turnIndex: i,
        userPrompt: `Sample prompt ${i + 1}`,
        selectedResponse: null,
        allResponses: [],
        timestamp: Date.now() - (7 - i) * 24 * 60 * 60 * 1000,
        createdAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000)
      });
      
      // Add responses for each conversation
      const providers = ['gpt', 'llama', 'mistral'];
      for (const provider of providers) {
        const isSuccess = Math.random() > 0.15; // 85% success rate
        const responseId = uuidv4();
        
        responses.push({
          id: responseId,
          conversationId: convId,
          provider: provider,
          prompt: `Sample prompt ${i + 1}`,
          response: isSuccess 
            ? `This is a sample response from ${provider} for conversation ${i + 1}. It contains useful information and answers the user's query effectively.`
            : '',
          status: isSuccess ? 'success' : 'error',
          metrics: isSuccess ? {
            latencyMs: 500 + Math.random() * 2000,
            tokenCount: 100 + Math.floor(Math.random() * 200),
            responseLength: 150 + Math.floor(Math.random() * 100),
            firstTokenLatencyMs: 100 + Math.random() * 300,
            tokensPerSecond: 30 + Math.random() * 20
          } : null,
          retryCount: isSuccess ? 0 : 1,
          errorMessage: isSuccess ? null : 'Provider timeout',
          streamingProgress: 100,
          timestamp: Date.now() - (7 - i) * 24 * 60 * 60 * 1000,
          isStreaming: false,
          createdAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Conversations for madhankumarmurugaraj@gmail.com
    for (let i = 0; i < 5; i++) {
      const convId = uuidv4();
      const sessionId = sessions[1].id;
      
      conversations.push({
        id: convId,
        sessionId: sessionId,
        turnIndex: i,
        userPrompt: `User prompt ${i + 1}`,
        selectedResponse: null,
        allResponses: [],
        timestamp: Date.now() - (5 - i) * 24 * 60 * 60 * 1000,
        createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000)
      });
      
      // Add responses for each conversation
      const providers = ['gpt', 'gemini', 'copilot'];
      for (const provider of providers) {
        const isSuccess = Math.random() > 0.1; // 90% success rate
        const responseId = uuidv4();
        
        responses.push({
          id: responseId,
          conversationId: convId,
          provider: provider,
          prompt: `User prompt ${i + 1}`,
          response: isSuccess 
            ? `Response from ${provider} for user conversation ${i + 1}. This demonstrates the capabilities of the AI provider and provides valuable insights.`
            : '',
          status: isSuccess ? 'success' : 'error',
          metrics: isSuccess ? {
            latencyMs: 400 + Math.random() * 1500,
            tokenCount: 80 + Math.floor(Math.random() * 150),
            responseLength: 120 + Math.floor(Math.random() * 80),
            firstTokenLatencyMs: 80 + Math.random() * 250,
            tokensPerSecond: 35 + Math.random() * 25
          } : null,
          retryCount: isSuccess ? 0 : 1,
          errorMessage: isSuccess ? null : 'Rate limit exceeded',
          streamingProgress: 100,
          timestamp: Date.now() - (5 - i) * 24 * 60 * 60 * 1000,
          isStreaming: false,
          createdAt: new Date(Date.now() - (5 - i) * 24 * 60 * 60 * 1000)
        });
      }
    }
    
    // Insert conversations and responses
    for (const conversation of conversations) {
      await db.conversations.insertOne(conversation);
    }
    
    for (const response of responses) {
      await db.responses.insertOne(response);
    }
    
    console.log(`Inserted ${conversations.length} conversations and ${responses.length} responses`);
    
    // Verify data
    const sessionCount = await db.sessions.countDocuments();
    const convCount = await db.conversations.countDocuments();
    const respCount = await db.responses.countDocuments();
    
    console.log('\n=== DATABASE SUMMARY ===');
    console.log(`Sessions: ${sessionCount}`);
    console.log(`Conversations: ${convCount}`);
    console.log(`Responses: ${respCount}`);
    console.log('========================');
    
    console.log('\nSample data populated successfully!');
    
  } catch (error) {
    console.error('Error populating sample data:', error);
  } finally {
    await db.close();
  }
}

populateSampleData();