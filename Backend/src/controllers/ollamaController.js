exports.checkOllamaHealth = async (req, res, next) => {
  try {
    // In a real implementation, this would check the actual Ollama service
    res.json({ 
      status: 'Ollama is running', 
      models: ['llama2', 'mistral', 'phi'] // example models
    });
  } catch (error) {
    next(error);
  }
};

const providerService = require('../services/providerService');

exports.processOllamaPrompt = async (req, res, next) => {
  try {
    const { sessionId, prompt, context } = req.body;
    
    // Process using the actual provider service
    const session = await providerService.submitPrompt(
      sessionId,
      prompt,
      ['ollama'],
      context
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Find the Ollama response from the session
    const ollamaResponse = session.currentResponses.find(resp => resp.provider === 'ollama');
    
    res.json({
      response: ollamaResponse || {
        id: 'fallback-id',
        provider: 'ollama',
        prompt: prompt,
        response: 'Ollama processing failed',
        status: 'error',
        metrics: {
          latencyMs: 0,
          tokenCount: 0,
          responseLength: 0,
          firstTokenLatencyMs: 0,
          tokensPerSecond: 0
        },
        retryCount: 0,
        errorMessage: 'Failed to get response from Ollama',
        streamingProgress: 0,
        timestamp: Date.now(),
        isStreaming: false
      }
    });
  } catch (error) {
    next(error);
  }
};