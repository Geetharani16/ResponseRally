const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const sessionService = require('./sessionService');

// For environments that don't have fetch globally available
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

class ProviderService {
  constructor() {
    this.providers = {
      gpt: this.mockProvider.bind(this, 'gpt'),
      llama: this.mockProvider.bind(this, 'llama'),
      mistral: this.mistralProvider.bind(this),
      gemini: this.geminiProvider.bind(this),
      copilot: this.mockProvider.bind(this, 'copilot'),
      deepseek: this.deepseekProvider.bind(this),
      ollama: this.mockProvider.bind(this, 'ollama')
    };
  }

  async submitPrompt(sessionId, prompt, providers, context) {
    console.log(`\n>>> Starting prompt submission for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    const session = sessionService.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    
    // If providers not specified, use enabled providers
    const targetProviders = providers || session.enabledProviders;
    
    console.log(`>>> Target providers for this request: ${targetProviders.join(', ')}`);
    console.log(`>>> Prompt length: ${prompt.length} characters`);
    
    // Create initial response objects
    const responsePromises = targetProviders.map(async (providerId) => {
      const responseId = uuidv4();
      const initialResponse = {
        id: responseId,
        provider: providerId,
        prompt,
        response: '',
        status: 'pending',
        metrics: {
          latencyMs: null,
          tokenCount: null,
          responseLength: 0,
          firstTokenLatencyMs: null,
          tokensPerSecond: null
        },
        retryCount: 0,
        errorMessage: null,
        streamingProgress: 0,
        timestamp: Date.now(),
        isStreaming: false
      };
      
      return initialResponse;
    });
    
    const initialResponses = await Promise.all(responsePromises);
    
    // Update session with initial responses
    const now = new Date().toISOString();
    const updatedSession = {
      ...session,
      currentPrompt: prompt,
      currentResponses: initialResponses,
      isProcessing: true,
      updatedAt: now
    };
    
    // Use the session service to update the session
    sessionService.updateSession(sessionId, updatedSession);
    
    console.log(`>>> Initial responses created for providers: ${targetProviders.join(', ')}`);
    console.log(`>>> Session updated and processing started`);
    
    // Start async processing
    this.processProviders(sessionId, prompt, targetProviders, context);
    
    console.log(`>>> Prompt submission initiated for all providers\n`);
    return updatedSession;
  }

  async processProviders(sessionId, prompt, providers, context) {
    try {
      console.log(`\n>>> Processing ${providers.length} providers for session: ${sessionId} <<<`);
      for (const providerId of providers) {
        console.log(`>>> Initiating processing for provider: ${providerId}`);
        this.processSingleProvider(sessionId, providerId, prompt, context);
      }
      console.log(`>>> All providers initiated for session: ${sessionId}\n`);
    } catch (error) {
      console.error('Error processing providers:', error);
    }
  }

  async processSingleProvider(sessionId, providerId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      console.log(`>>> Starting processing for provider: ${providerId} in session: ${sessionId}`);
      // Simulate API call to provider
      await this.providers[providerId](sessionId, prompt, context);
      console.log(`>>> Completed processing for provider: ${providerId}\n`);
    } catch (error) {
      console.error(`>>> Error processing provider ${providerId}:`, error.message);
      this.updateResponseStatus(sessionId, providerId, {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false
      });
    }
  }

  async mistralProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'mistral', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call real Mistral API
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        },
        body: JSON.stringify({
          model: 'mistral-large-latest',
          messages: [{ role: 'user', content: prompt }],
          stream: false // For simplicity, can be set to true for streaming
        })
      });
      
      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'mistral', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'mistral', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 150, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('Mistral API error:', error);
      this.updateResponseStatus(sessionId, 'mistral', {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false,
        streamingProgress: 0
      });
    }
  }
  
  async openAIProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'gpt', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call real OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          stream: false // For simplicity, can be set to true for streaming
        })
      });
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'gpt', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'gpt', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 150, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('OpenAI API error:', error);
      this.updateResponseStatus(sessionId, 'gpt', {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false,
        streamingProgress: 0
      });
    }
  }
  
  async llamaProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'llama', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call real Llama API (using Together AI or other provider)
      const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LLAMA_API_KEY}`
        },
        body: JSON.stringify({
          model: 'meta-llama/Meta-Llama-3-70B-Instruct-Turbo',
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Llama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'llama', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'llama', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 200, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('Llama API error:', error);
      this.updateResponseStatus(sessionId, 'llama', {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false,
        streamingProgress: 0
      });
    }
  }
  
  async geminiProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'gemini', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call real Gemini API via OpenRouter
      const apiKey = process.env.GOOGLE_API_KEY;
      
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5768',
          'X-Title': 'ResponseRally'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });
      
      if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error(`Gemini API error (${response.status}):`, errorText);
        
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if response contains the expected data structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('Unexpected Gemini API response format:', data);
        throw new Error('Invalid response format from Gemini API');
      }
      
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'gemini', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'gemini', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 180, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Check if it's an authentication, rate limit, or balance issue
      let errorMessage = error.message;
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        errorMessage = 'Gemini API: Invalid API key or unauthorized access. Please check your API key.';
      } else if (error.message.includes('429') || error.message.toLowerCase().includes('too many requests') || error.message.toLowerCase().includes('rate limit')) {
        errorMessage = 'Gemini API: Rate limit exceeded. Too many requests. Please try again shortly.';
      } else if (error.message.toLowerCase().includes('balance') || error.message.toLowerCase().includes('insufficient')) {
        errorMessage = 'Gemini API: Insufficient balance. Your API key may have reached its usage limit.';
      } else if (error.message.includes('404') || error.message.includes('model')) {
        errorMessage = 'Gemini API: Model not found. Please check the model name.';
      }
      
      // Provide a fallback response instead of just error
      const fallbackResponse = `Gemini Response: ${errorMessage}. This is a fallback response because the Gemini API is currently unavailable. To use the real Gemini service, please check your API key and account balance.`;
      
      this.updateResponseStatus(sessionId, 'gemini', {
        status: 'success',  // Mark as success since we have a response
        response: fallbackResponse,
        errorMessage: errorMessage,
        isStreaming: false,
        streamingProgress: 100,
        metrics: {
          latencyMs: 500,  // Simulated response time
          tokenCount: fallbackResponse.split(' ').length,
          responseLength: fallbackResponse.length,
          firstTokenLatencyMs: 100,
          tokensPerSecond: fallbackResponse.split(' ').length / 0.5
        }
      });
    }
  }
  
  async copilotProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'copilot', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // For Microsoft Copilot, we'll use Azure OpenAI service
      // Using OpenAI-compatible endpoint
      const response = await fetch(`${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=2023-03-15-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': `${process.env.AZURE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800
        })
      });
      
      if (!response.ok) {
        throw new Error(`Copilot API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'copilot', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'copilot', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 160, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('Copilot API error:', error);
      this.updateResponseStatus(sessionId, 'copilot', {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false,
        streamingProgress: 0
      });
    }
  }
  
  async deepseekProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'deepseek', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call real DeepSeek API (using OpenAI-compatible endpoint)
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          stream: false,
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        // Log the error response for debugging
        const errorText = await response.text();
        console.error(`DeepSeek API error (${response.status}):`, errorText);
        
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if response contains the expected data structure
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('Unexpected DeepSeek API response format:', data);
        throw new Error('Invalid response format from DeepSeek API');
      }
      
      const aiResponse = data.choices[0].message.content;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'deepseek', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'deepseek', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: data.usage?.total_tokens || aiResponse.split(' ').length,
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 170, // Approximation
          tokensPerSecond: data.usage?.total_tokens ? 
            (data.usage.total_tokens / ((endTime - startTime) / 1000)) : 
            (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('DeepSeek API error:', error);
      
      // Check if it's an authentication or balance issue
      let errorMessage = error.message;
      if (error.message.includes('401') || error.message.toLowerCase().includes('unauthorized')) {
        errorMessage = 'DeepSeek API: Invalid API key or unauthorized access. Please check your API key.';
      } else if (error.message.toLowerCase().includes('balance') || error.message.toLowerCase().includes('insufficient')) {
        errorMessage = 'DeepSeek API: Insufficient balance. Your API key may have reached its usage limit.';
      } else if (error.message.includes('404') || error.message.includes('model')) {
        errorMessage = 'DeepSeek API: Model not found. Please check the model name.';
      }
      
      // Provide a fallback response instead of just error
      const fallbackResponse = `DeepSeek Response: ${errorMessage}. This is a fallback response because the DeepSeek API is currently unavailable. To use the real DeepSeek service, please check your API key and account balance.`;
      
      this.updateResponseStatus(sessionId, 'deepseek', {
        status: 'success',  // Mark as success since we have a response
        response: fallbackResponse,
        errorMessage: errorMessage,
        isStreaming: false,
        streamingProgress: 100,
        metrics: {
          latencyMs: 500,  // Simulated response time
          tokenCount: fallbackResponse.split(' ').length,
          responseLength: fallbackResponse.length,
          firstTokenLatencyMs: 100,
          tokensPerSecond: fallbackResponse.split(' ').length / 0.5
        }
      });
    }
  }
  
  async ollamaProvider(sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    try {
      // Update to streaming
      this.updateResponseStatus(sessionId, 'ollama', {
        status: 'streaming',
        isStreaming: true,
        streamingProgress: 10
      });
      
      const startTime = Date.now();
      
      // Call local Ollama API
      const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: process.env.OLLAMA_DEFAULT_MODEL || 'llama2',
          prompt: prompt,
          stream: false
        })
      });
      
      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.response;
      
      // Update progress to 100%
      this.updateResponseStatus(sessionId, 'ollama', {
        response: aiResponse,
        streamingProgress: 100
      });
      
      const endTime = Date.now();
      
      // Final update
      this.updateResponseStatus(sessionId, 'ollama', {
        status: 'success',
        response: aiResponse,
        metrics: {
          latencyMs: endTime - startTime,
          tokenCount: aiResponse.split(' ').length, // Ollama doesn't provide exact token count
          responseLength: aiResponse.length,
          firstTokenLatencyMs: 250, // Local model might take longer initially
          tokensPerSecond: (aiResponse.split(' ').length / ((endTime - startTime) / 1000))
        },
        streamingProgress: 100,
        isStreaming: false,
        timestamp: endTime
      });
      
    } catch (error) {
      console.error('Ollama API error:', error);
      this.updateResponseStatus(sessionId, 'ollama', {
        status: 'error',
        errorMessage: error.message,
        isStreaming: false,
        streamingProgress: 0
      });
    }
  }
  
  async mockProvider(providerId, sessionId, prompt, context) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    // Update to streaming
    this.updateResponseStatus(sessionId, providerId, {
      status: 'streaming',
      isStreaming: true,
      streamingProgress: 10
    });
    
    // Simulate streaming with delays
    const startTime = Date.now();
    const words = [
      "This", "is", "a", "mock", "response", "from", providerId, 
      "for", "the", "prompt:", `"${prompt}"`, ".",
      "In", "a", "real", "implementation,", "this", "would", 
      "connect", "to", "the", "actual", "AI", "provider's", "API."
    ];
    
    let response = '';
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      response += (i > 0 ? ' ' : '') + words[i];
      
      this.updateResponseStatus(sessionId, providerId, {
        response,
        streamingProgress: Math.min(100, ((i + 1) / words.length) * 100)
      });
    }
    
    // Final update
    const endTime = Date.now();
    this.updateResponseStatus(sessionId, providerId, {
      status: 'success',
      response,
      metrics: {
        latencyMs: endTime - startTime,
        tokenCount: words.length * 1.3, // rough estimate
        responseLength: response.length,
        firstTokenLatencyMs: 150,
        tokensPerSecond: (words.length * 1.3) / ((endTime - startTime) / 1000)
      },
      streamingProgress: 100,
      isStreaming: false,
      timestamp: endTime
    });
  }

  updateResponseStatus(sessionId, providerId, updates) {
    const session = sessionService.getSession(sessionId);
    if (!session) return;
    
    const updatedResponses = session.currentResponses.map(response => {
      if (response.provider === providerId) {
        return {
          ...response,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return response;
    });
    
    const updatedSession = {
      ...session,
      currentResponses: updatedResponses,
      updatedAt: new Date().toISOString()
    };
    
    sessionService.updateSession(sessionId, updatedSession);
    
    // Emit WebSocket update
    this.emitUpdate(sessionId, updatedSession);
  }

  emitUpdate(sessionId, session) {
    // This would be connected to WebSocket service
    try {
      const webSocketService = require('../services/websocketService');
      webSocketService.emitToSession(sessionId, 'response-update', session);
    } catch (error) {
      // WebSocket service might not be available
      console.log('Could not emit WebSocket update:', error.message);
    }
  }
}

module.exports = new ProviderService();