/**
 * AI Provider Integration Middleware
 * 
 * This file will contain the actual implementations for connecting to various AI providers.
 * Currently contains placeholder functions that will be replaced with real API calls.
 */

const axios = require('axios');

// Provider API configurations
const providers = {
  gpt: {
    name: 'OpenAI GPT-4',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    model: 'gpt-4'
  },
  ollama: {
    name: 'Ollama Gemma3 1B',
    baseUrl: 'http://localhost:11434/api',
    apiKeyEnv: null,  // Ollama doesn't require API key
    model: 'gemma3:1b'
  },
  llama: {
    name: 'Meta LLaMA',
    baseUrl: 'https://api.llama.ai/v1', // Placeholder URL
    apiKeyEnv: 'LLAMA_API_KEY',
    model: 'llama-3-70b'
  },
  mistral: {
    name: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    model: 'mistral-large-latest'
  },
  gemini: {
    name: 'Google Gemini 3 Flash Preview (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'GOOGLE_API_KEY',
    model: 'google/gemini-3-flash-preview'  // Using OpenRouter's model identifier
  },
  copilot: {
    name: 'Microsoft Copilot',
    baseUrl: 'https://api.copilottest.com/v1', // Placeholder URL
    apiKeyEnv: 'COPILOT_API_KEY',
    model: 'copilot-model'
  },
  deepseek: {
    name: 'DeepSeek R1 Free (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'deepseek/deepseek-r1-0528:free'  // Using OpenRouter's free DeepSeek model
  }
};

/**
 * Generic function to call an AI provider API
 */
const callProviderAPI = async (providerId, prompt, context = []) => {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  // Prepare the request payload based on the provider
  let requestData;
  let url;
  let headers;

  // Handle Ollama specially (doesn't require API key)
  if (providerId === 'ollama') {
    headers = {
      'Content-Type': 'application/json',
    };
  } else {
    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`Missing API key for ${provider.name}. Please set ${provider.apiKeyEnv} in environment variables.`);
    }
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  switch (providerId) {
    case 'gpt':
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true, // Enable streaming
        temperature: 0.7
      };
      break;

    case 'gemini':
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000  // Limit token usage to avoid hitting limits
      };
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5768',
        'X-Title': 'ResponseRally'  // Optional: Helps OpenRouter identify your app
      };
      break;

    case 'mistral':
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true
      };
      break;

    case 'llama':
      // LLaMA provider-specific implementation
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true
      };
      break;

    case 'copilot':
      // Copilot provider-specific implementation
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true
      };
      break;

    case 'ollama':
      // Ollama provider-specific implementation
      url = `${provider.baseUrl}/chat`;  // Ollama uses /api/chat endpoint
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true,  // Ollama supports streaming
        options: {
          temperature: 0.7,
        }
      };
      headers = {
        'Content-Type': 'application/json',
      };
      break;
    
    case 'deepseek':
      // DeepSeek provider-specific implementation (using OpenRouter)
      url = `${provider.baseUrl}/chat/completions`;
      requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 2000  // Limit token usage to avoid hitting limits
      };
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5768',
        'X-Title': 'ResponseRally'  // Optional: Helps OpenRouter identify your app
      };
      break;

    default:
      throw new Error(`Unsupported provider: ${providerId}`);
  }

  try {
    // Make the API call
    const response = await axios.post(url, requestData, { 
      headers,
      timeout: 30000, // 30 second timeout
      responseType: 'stream' // For streaming responses
    });

    return response;
  } catch (error) {
    console.error(`Error calling ${provider.name} API:`, error.message);
    throw error;
  }
};

/**
 * Process a provider response with streaming capability
 */
const processProviderResponse = async (providerId, prompt, context = [], onResponseUpdate) => {
  try {
    const startTime = Date.now();
    let firstTokenTime = null;
    let accumulatedResponse = '';
    let tokenCount = 0;

    // Handle Ollama separately since it requires different streaming implementation
    if (providerId === 'ollama') {
      // Get the provider configuration
      const provider = providers[providerId];
      
      // Prepare the request payload for Ollama
      const requestData = {
        model: provider.model,
        messages: [
          ...context.map(ctx => ({ role: 'user', content: ctx.userPrompt })),
          { role: 'user', content: prompt }
        ],
        stream: true,  // Ollama supports streaming
        options: {
          temperature: 0.7,
        }
      };
      
      const url = `${provider.baseUrl}/chat`;
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Handle Ollama streaming response using axios
      try {
        const responseStream = await axios.post(url, requestData, {
          headers,
          responseType: 'stream'  // Axios supports streaming
        });
        
        return new Promise((resolve, reject) => {
          let buffer = '';
          
          responseStream.data.on('data', (chunk) => {
            buffer += chunk.toString();
            
            // Process complete lines
            let lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line
            
            for (const line of lines) {
              if (line.trim() === '') continue;
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6)); // Remove 'data: ' prefix
                  
                  if (data.done) {
                    // Stream completed
                    responseStream.data.emit('close');
                    break;
                  }
                  
                  if (data.message && data.message.content) {
                    const content = data.message.content;
                    accumulatedResponse += content;
                    tokenCount += content.length / 4; // Approximate token count
                    
                    if (!firstTokenTime) firstTokenTime = Date.now();
                    
                    const currentTime = Date.now();
                    const latencyMs = currentTime - startTime;
                    const responseLength = accumulatedResponse.length;
                    const firstTokenLatencyMs = firstTokenTime - startTime;
                    const tokensPerSecond = tokenCount / ((currentTime - startTime) / 1000);
                    
                    // Call the update function with progress
                    onResponseUpdate({
                      response: accumulatedResponse,
                      status: 'streaming',
                      isStreaming: true,
                      streamingProgress: Math.min(100, Math.round((responseLength / 1000) * 100)), // Estimate progress
                      metrics: {
                        latencyMs,
                        tokenCount: Math.floor(tokenCount),
                        responseLength,
                        firstTokenLatencyMs,
                        tokensPerSecond: isNaN(tokensPerSecond) ? 0 : tokensPerSecond
                      }
                    });
                  }
                } catch (e) {
                  console.error('Error parsing Ollama SSE data:', e);
                }
              }
            }
          });
          
          responseStream.data.on('end', () => {
            resolve({
              response: accumulatedResponse,
              status: 'success',
              isStreaming: false,
              streamingProgress: 100,
              metrics: {
                latencyMs: Date.now() - startTime,
                tokenCount: Math.floor(tokenCount),
                responseLength: accumulatedResponse.length,
                firstTokenLatencyMs: firstTokenTime - startTime,
                tokensPerSecond: tokenCount / ((Date.now() - startTime) / 1000)
              }
            });
          });
          
          responseStream.data.on('error', (error) => {
            console.error('Ollama stream error:', error);
            reject(error);
          });
        });
      } catch (streamError) {
        console.error('Error in Ollama streaming:', streamError);
        throw streamError;
      }
    } else {
      // Make the actual API call to the provider for other providers
      const response = await callProviderAPI(providerId, prompt, context);
      
      // Handle streaming response based on provider
      if (response.data && response.data.choices) {
        // For models that return structured responses (OpenRouter, etc.)
        const fullResponse = response.data.choices[0]?.message?.content || 'No response received';
        
        // Simulate streaming by sending partial responses (in a real implementation, 
        // you would parse the actual stream)
        const words = fullResponse.split(' ');
        const tokensPerChunk = 3;

        for (let i = 0; i < words.length; i += tokensPerChunk) {
          const chunk = words.slice(i, i + tokensPerChunk).join(' ') + ' ';
          accumulatedResponse += chunk;
          tokenCount += tokensPerChunk;

          // Calculate metrics
          if (!firstTokenTime) firstTokenTime = Date.now();
          const currentTime = Date.now();
          const latencyMs = currentTime - startTime;
          const responseLength = accumulatedResponse.length;
          const firstTokenLatencyMs = firstTokenTime - startTime;
          const tokensPerSecond = tokenCount / ((currentTime - startTime) / 1000);

          // Call the update function with progress
          onResponseUpdate({
            response: accumulatedResponse,
            status: 'streaming',
            isStreaming: true,
            streamingProgress: Math.min(100, Math.round((i / words.length) * 100)),
            metrics: {
              latencyMs,
              tokenCount,
              responseLength,
              firstTokenLatencyMs,
              tokensPerSecond: isNaN(tokensPerSecond) ? 0 : tokensPerSecond
            }
          });

          // Simulate realistic streaming delay
          await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 30));
        }
      } else {
        // Handle non-streaming response
        if (!firstTokenTime) firstTokenTime = Date.now();
        const fullResponse = response.data || 'No response received';
        accumulatedResponse = fullResponse.toString();
        tokenCount = Math.ceil(accumulatedResponse.length / 4);
        
        // Send immediate update
        onResponseUpdate({
          response: accumulatedResponse,
          status: 'success',
          isStreaming: false,
          streamingProgress: 100,
          metrics: {
            latencyMs: Date.now() - startTime,
            tokenCount,
            responseLength: accumulatedResponse.length,
            firstTokenLatencyMs: firstTokenTime - startTime,
            tokensPerSecond: tokenCount / ((Date.now() - startTime) / 1000)
          }
        });
      }

      // Final response
      const endTime = Date.now();
      const totalLatency = endTime - startTime;
      const finalTokenCount = Math.ceil(accumulatedResponse.length / 4);

      return {
        response: accumulatedResponse.trim(),
        status: 'success',
        isStreaming: false,
        streamingProgress: 100,
        metrics: {
          latencyMs: totalLatency,
          tokenCount: finalTokenCount,
          responseLength: accumulatedResponse.length,
          firstTokenLatencyMs: firstTokenTime - startTime,
          tokensPerSecond: finalTokenCount / (totalLatency / 1000)
        }
      };
    }
  } catch (error) {
    console.error(`Error processing ${providers[providerId].name} response:`, error);
    return {
      response: '',
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
};

/**
 * Validate if all required API keys are present
 */
const validateProviderKeys = () => {
  const missingKeys = [];
  
  Object.keys(providers).forEach(providerId => {
    const provider = providers[providerId];
    
    // Skip validation for providers that don't require API keys (like Ollama)
    if (provider.apiKeyEnv !== null) {
      const apiKey = process.env[provider.apiKeyEnv];
      
      if (!apiKey) {
        missingKeys.push(provider.apiKeyEnv);
      }
    }
  });
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys
  };
};

module.exports = {
  callProviderAPI,
  processProviderResponse,
  validateProviderKeys,
  providers
};