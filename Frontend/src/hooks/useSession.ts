import { useState, useCallback, useRef } from 'react';
import { 
  SessionState, 
  ProviderResponse, 
  ConversationTurn, 
  ProviderType,
  PROVIDERS 
} from '@/types';
import { generateMockResponse } from '@/lib/mockApi';

const generateId = () => Math.random().toString(36).substring(2, 15);

const createInitialSession = (): SessionState => ({
  id: generateId(),
  conversationHistory: [],
  currentPrompt: '',
  currentResponses: [],
  isProcessing: false,
  selectedResponseId: null,
  enabledProviders: PROVIDERS.filter(p => p.enabled).map(p => p.id),
});

export function useSession() {
  const [session, setSession] = useState<SessionState>(createInitialSession);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * =====================================================
   * BACKEND INTEGRATION PLACEHOLDER: API CALLS
   * =====================================================
   * Replace this mock implementation with actual API calls.
   * 
   * Expected backend behavior:
   * - Fan out to all enabled providers in parallel
   * - Return streaming responses via SSE/WebSocket
   * - Handle rate limiting with exponential backoff
   * - Aggregate responses with consistent schema
   * 
   * API Endpoint: POST /api/v1/prompt
   * Request: { prompt: string, providers: ProviderType[], context?: ConversationTurn[] }
   * Response: EventStream or WebSocket with ProviderResponse updates
   * =====================================================
   */
  const submitPrompt = useCallback(async (prompt: string) => {
    if (!prompt.trim() || session.isProcessing) return;

    // Cancel any pending requests
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setSession(prev => ({
      ...prev,
      currentPrompt: prompt,
      isProcessing: true,
      selectedResponseId: null,
      currentResponses: prev.enabledProviders.map(provider => ({
        id: generateId(),
        provider,
        prompt,
        response: '',
        status: 'pending',
        metrics: {
          latencyMs: null,
          tokenCount: null,
          responseLength: 0,
          firstTokenLatencyMs: null,
          tokensPerSecond: null,
        },
        retryCount: 0,
        errorMessage: null,
        streamingProgress: 0,
        timestamp: Date.now(),
        isStreaming: false,
      })),
    }));

    /**
     * =====================================================
     * STREAMING HANDLER PLACEHOLDER
     * =====================================================
     * Implementation options:
     * 
     * 1. Server-Sent Events (SSE):
     *    const eventSource = new EventSource(`/api/stream?prompt=${encodeURIComponent(prompt)}`);
     *    eventSource.onmessage = (event) => updateResponse(JSON.parse(event.data));
     * 
     * 2. WebSocket:
     *    const ws = new WebSocket('wss://api.example.com/stream');
     *    ws.send(JSON.stringify({ prompt, providers }));
     *    ws.onmessage = (event) => updateResponse(JSON.parse(event.data));
     * 
     * 3. Fetch with ReadableStream:
     *    const response = await fetch('/api/stream', { method: 'POST', body: JSON.stringify({ prompt }) });
     *    const reader = response.body.getReader();
     *    while (true) {
     *      const { done, value } = await reader.read();
     *      if (done) break;
     *      updateResponse(parseChunk(value));
     *    }
     * =====================================================
     */

    // Mock implementation - simulates streaming responses
    const responses = await Promise.all(
      session.enabledProviders.map(async (provider) => {
        return generateMockResponse(
          provider,
          prompt,
          session.conversationHistory,
          (update) => {
            setSession(prev => ({
              ...prev,
              currentResponses: prev.currentResponses.map(r =>
                r.provider === provider ? { ...r, ...update } : r
              ),
            }));
          }
        );
      })
    );

    setSession(prev => ({
      ...prev,
      isProcessing: false,
      currentResponses: responses,
    }));
  }, [session.isProcessing, session.enabledProviders, session.conversationHistory]);

  /**
   * =====================================================
   * BEST RESPONSE SELECTION
   * =====================================================
   * When a user selects a response as "Best":
   * 1. Mark it as selected
   * 2. Add to conversation history
   * 3. Clear current responses for next prompt
   * 
   * Future: POST /api/v1/feedback with selection data for analytics
   * =====================================================
   */
  const selectBestResponse = useCallback((responseId: string) => {
    setSession(prev => {
      const selectedResponse = prev.currentResponses.find(r => r.id === responseId);
      if (!selectedResponse) return prev;

      const newTurn: ConversationTurn = {
        id: generateId(),
        userPrompt: prev.currentPrompt,
        selectedResponse,
        allResponses: prev.currentResponses,
        timestamp: Date.now(),
      };

      return {
        ...prev,
        selectedResponseId: responseId,
        conversationHistory: [...prev.conversationHistory, newTurn],
        currentResponses: [],
        currentPrompt: '',
      };
    });
  }, []);

  const toggleProvider = useCallback((providerId: ProviderType) => {
    setSession(prev => ({
      ...prev,
      enabledProviders: prev.enabledProviders.includes(providerId)
        ? prev.enabledProviders.filter(p => p !== providerId)
        : [...prev.enabledProviders, providerId],
    }));
  }, []);

  const resetSession = useCallback(() => {
    abortControllerRef.current?.abort();
    setSession(createInitialSession());
  }, []);

  /**
   * =====================================================
   * RETRY LOGIC PLACEHOLDER
   * =====================================================
   * Implement exponential backoff for failed requests:
   * 
   * const retryWithBackoff = async (fn, maxRetries = 3) => {
   *   for (let i = 0; i < maxRetries; i++) {
   *     try {
   *       return await fn();
   *     } catch (error) {
   *       if (i === maxRetries - 1) throw error;
   *       await sleep(Math.pow(2, i) * 1000 + Math.random() * 1000);
   *     }
   *   }
   * };
   * =====================================================
   */
  const retryProvider = useCallback(async (providerId: ProviderType) => {
    const response = session.currentResponses.find(r => r.provider === providerId);
    if (!response) return;

    setSession(prev => ({
      ...prev,
      currentResponses: prev.currentResponses.map(r =>
        r.provider === providerId
          ? { ...r, status: 'pending', retryCount: r.retryCount + 1, errorMessage: null }
          : r
      ),
    }));

    const newResponse = await generateMockResponse(
      providerId,
      session.currentPrompt,
      session.conversationHistory,
      (update) => {
        setSession(prev => ({
          ...prev,
          currentResponses: prev.currentResponses.map(r =>
            r.provider === providerId ? { ...r, ...update } : r
          ),
        }));
      }
    );

    setSession(prev => ({
      ...prev,
      currentResponses: prev.currentResponses.map(r =>
        r.provider === providerId ? newResponse : r
      ),
    }));
  }, [session.currentPrompt, session.currentResponses, session.conversationHistory]);

  return {
    session,
    submitPrompt,
    selectBestResponse,
    toggleProvider,
    resetSession,
    retryProvider,
  };
}
