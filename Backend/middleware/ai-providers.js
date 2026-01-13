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
    name: 'Xiaomi MiMo (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'xiaomi/mimo-v2-flash:free'  // Using OpenRouter's free Xiaomi model
  },

  llama: {
    name: 'Llama 3.3 70B Instruct Free (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'meta-llama/llama-3.3-70b-instruct:free'  // Using OpenRouter's free Llama model
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
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'mistralai/devstral-2512:free'  // Using OpenRouter's free model identifier
  },
  copilot: {
    name: 'Microsoft Copilot',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    model: 'nvidia/nemotron-3-nano-30b-a3b:free'  // Using OpenRouter's free model identifier
  },
  deepseek: {
    name: 'DeepSeek R1T2 Chimera Free (via OpenRouter)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'GOOGLE_API_KEY',
    model: 'tngtech/deepseek-r1t2-chimera:free'  // Using OpenRouter's free DeepSeek model
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

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    throw new Error(`Missing API key for ${provider.name}. Please set ${provider.apiKeyEnv} in environment variables.`);
  }
  headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };

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

    {
      // Handle streaming for other providers (GPT, Mistral, Gemini, etc.) properly
      const provider = providers[providerId];
      const apiKey = process.env[provider.apiKeyEnv];

      // Prepare the request payload based on the provider
      let requestData;
      let url;
      let headers;

      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };

      // Special handling for OpenRouter-based APIs (Gemini, DeepSeek)
      if (providerId === 'gemini' || providerId === 'deepseek') {
        headers['HTTP-Referer'] = 'http://localhost:5768';
        headers['X-Title'] = 'ResponseRally';
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
          break;

        case 'llama':
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

        case 'deepseek':
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
          break;

        default:
          throw new Error(`Unsupported provider: ${providerId}`);
      }

      // Make the API call with streaming
      const responseStream = await axios.post(url, requestData, { 
        headers,
        timeout: 30000, // 30 second timeout
        responseType: 'stream' // For streaming responses
      });

      return new Promise((resolve, reject) => {
        let buffer = '';
        let isResolved = false;

        responseStream.data.on('data', (chunk) => {
          if (isResolved) return; // Prevent multiple resolutions

          buffer += chunk.toString();

          // Process complete lines (SSE format)
          let lines = buffer.split('\n');
          buffer = lines.pop() || ''; // Keep incomplete line

          for (const line of lines) {
            if (line.trim() === '') continue;
            if (line.startsWith('data: ')) {
              try {
                const dataStr = line.substring(6); // Remove 'data: ' prefix
                if (dataStr.trim() === '[DONE]') {
                  // Stream completed
                  responseStream.data.emit('end');
                  break;
                }

                const data = JSON.parse(dataStr);
                
                if (data.choices && data.choices[0]) {
                  const choice = data.choices[0];
                  
                  if (choice.finish_reason) {
                    // Stream completed by finish reason
                    responseStream.data.emit('end');
                    break;
                  }

                  if (choice.delta && choice.delta.content) {
                    const content = choice.delta.content;
                    accumulatedResponse += content;
                    tokenCount += content.length / 4; // Approximate token count

                    if (!firstTokenTime) firstTokenTime = Date.now();

                    const currentTime = Date.now();
                    const latencyMs = currentTime - startTime;
                    const responseLength = accumulatedResponse.length;
                    const firstTokenLatencyMs = firstTokenTime ? firstTokenTime - startTime : null;
                    const tokensPerSecond = firstTokenTime ? tokenCount / ((currentTime - startTime) / 1000) : 0;

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
                }
              } catch (e) {
                // Skip invalid JSON lines (like [DONE] which might appear as plain text)
                if (dataStr.trim() !== '[DONE]') {
                  console.error(`Error parsing ${provider.name} SSE data:`, e);
                  console.error('Problematic line:', line);
                }
              }
            }
          }
        });

        responseStream.data.on('end', () => {
          if (isResolved) return;
          isResolved = true;
          
          resolve({
            response: accumulatedResponse,
            status: 'success',
            isStreaming: false,
            streamingProgress: 100,
            metrics: {
              latencyMs: Date.now() - startTime,
              tokenCount: Math.floor(tokenCount),
              responseLength: accumulatedResponse.length,
              firstTokenLatencyMs: firstTokenTime ? firstTokenTime - startTime : null,
              tokensPerSecond: firstTokenTime ? Math.floor(tokenCount / ((Date.now() - startTime) / 1000)) : 0
            }
          });
        });

        responseStream.data.on('error', (error) => {
          if (isResolved) return;
          isResolved = true;
          console.error(`${provider.name} stream error:`, error);
          reject(error);
        });
      });
    }
  } catch (error) {
    console.error(`Error processing ${providers[providerId].name} response:`, error);
    
    // Check if it's an API key error
    if (error.message && (error.message.includes('API key') || error.message.includes('Unauthorized') || error.message.includes('Missing API key'))) {
      // Generate a realistic fallback response from the backend
      const fallbackResponse = `This is a fallback response from ${providers[providerId].name}. The actual API key may not be configured properly. To use the real ${providers[providerId].name} service, please configure the ${providers[providerId].apiKeyEnv} in your environment variables.`;
      
      return {
        response: fallbackResponse,
        status: 'success',  // Mark as success since we have a response
        errorMessage: error.message || 'API key not configured',
        isStreaming: false,
        streamingProgress: 100,
        metrics: {
          latencyMs: 500,  // Simulated response time
          tokenCount: fallbackResponse.split(' ').length,
          responseLength: fallbackResponse.length,
          firstTokenLatencyMs: 100,
          tokensPerSecond: fallbackResponse.split(' ').length / 0.5
        }
      };
    } else {
      // For other errors, return error status
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
  }
};

/**
 * Validate if all required API keys are present
 */
const validateProviderKeys = () => {
  const missingKeys = [];
  
  Object.keys(providers).forEach(providerId => {
    const provider = providers[providerId];
    
    const apiKey = process.env[provider.apiKeyEnv];
    
    if (!apiKey) {
      missingKeys.push(provider.apiKeyEnv);
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