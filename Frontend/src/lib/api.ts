/**
 * =====================================================
 * ACTUAL API INTEGRATION
 * =====================================================
 * This file provides real API calls to the backend.
 * Replaces the mock API implementation.
 * =====================================================
 */

import { ProviderType, ProviderResponse, ConversationTurn, SessionState, DashboardData } from '@/types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:5002/api/v1' 
  : 'http://localhost:5002/api/v1';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Session Management
 */
export async function createSession(): Promise<SessionState> {
  return apiCall<SessionState>('/sessions', {
    method: 'POST',
  });
}

export async function getSession(sessionId: string): Promise<SessionState> {
  return apiCall<SessionState>(`/sessions/${sessionId}`);
}

export async function resetSession(sessionId: string): Promise<SessionState> {
  return apiCall<SessionState>(`/sessions/${sessionId}/reset`, {
    method: 'POST',
  });
}

export async function selectResponse(sessionId: string, responseId: string): Promise<SessionState> {
  return apiCall<SessionState>(`/sessions/${sessionId}/select`, {
    method: 'POST',
    body: JSON.stringify({ responseId }),
  });
}

export async function toggleProvider(sessionId: string, providerId: ProviderType): Promise<SessionState> {
  return apiCall<SessionState>(`/sessions/${sessionId}/providers/${providerId}/toggle`, {
    method: 'POST',
  });
}

export async function retryProvider(sessionId: string, providerId: ProviderType): Promise<SessionState> {
  return apiCall<SessionState>(`/sessions/${sessionId}/providers/${providerId}/retry`, {
    method: 'POST',
  });
}

/**
 * AI Response Generation
 */
export async function generateResponse(
  sessionId: string,
  provider: ProviderType,
  prompt: string,
  context: ConversationTurn[],
  onUpdate: (update: Partial<ProviderResponse>) => void
): Promise<ProviderResponse> {
  const response = await fetch(`${API_BASE_URL}/responses/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      provider,
      prompt,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error(`Response generation failed: ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  let fullResponse = '';
  let isFirstChunk = true;
  let firstTokenTime = 0;

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              
              if (isFirstChunk) {
                firstTokenTime = Date.now();
                isFirstChunk = false;
                onUpdate({
                  status: 'streaming',
                  isStreaming: true,
                  metrics: {
                    latencyMs: null,
                    tokenCount: null,
                    responseLength: 0,
                    firstTokenLatencyMs: firstTokenTime,
                    tokensPerSecond: null,
                  }
                });
              }

              if (parsed.content) {
                fullResponse += parsed.content;
                const elapsed = Date.now() - firstTokenTime;
                const tokenCount = Math.ceil(fullResponse.length / 4);
                
                onUpdate({
                  response: fullResponse,
                  streamingProgress: parsed.progress || 0,
                  metrics: {
                    latencyMs: elapsed,
                    tokenCount,
                    responseLength: fullResponse.length,
                    firstTokenLatencyMs: firstTokenTime,
                    tokensPerSecond: tokenCount / (elapsed / 1000),
                  }
                });
              }

              if (parsed.status === 'complete') {
                return {
                  id: parsed.id,
                  provider,
                  prompt,
                  response: fullResponse,
                  status: 'success',
                  metrics: parsed.metrics,
                  retryCount: 0,
                  errorMessage: null,
                  streamingProgress: 100,
                  timestamp: Date.now(),
                  isStreaming: false,
                };
              }

              if (parsed.status === 'error') {
                onUpdate({
                  status: 'error',
                  errorMessage: parsed.error,
                });
                return {
                  id: parsed.id,
                  provider,
                  prompt,
                  response: '',
                  status: 'error',
                  metrics: { latencyMs: null, tokenCount: null, responseLength: 0, firstTokenLatencyMs: null, tokensPerSecond: null },
                  retryCount: 0,
                  errorMessage: parsed.error,
                  streamingProgress: 0,
                  timestamp: Date.now(),
                  isStreaming: false,
                };
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  throw new Error('No response received');
}

/**
 * Dashboard & Analytics
 */
export async function getDashboardData(userId: string): Promise<DashboardData> {
  return apiCall<DashboardData>(`/analytics/dashboard/${userId}`);
}

export async function getUserAnalytics(userId: string) {
  return apiCall(`/analytics/user/${userId}`);
}

export async function getUserSessions(userId: string) {
  return apiCall(`/sessions/user/${userId}`);
}

/**
 * User Management
 */
export async function createUser(userData: { email: string; name: string }) {
  return apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function getUserProfile(userId: string) {
  return apiCall(`/users/${userId}`);
}

/**
 * Export & Data Management
 */
export async function exportSessionData(sessionId: string, format: 'json' | 'csv') {
  return apiCall(`/sessions/${sessionId}/export`, {
    method: 'POST',
    body: JSON.stringify({ format }),
  });
}

export async function exportUserData(userId: string, format: 'json' | 'csv') {
  return apiCall(`/users/${userId}/export`, {
    method: 'POST',
    body: JSON.stringify({ format }),
  });
}