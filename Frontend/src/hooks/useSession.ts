import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  SessionState, 
  ProviderResponse, 
  ConversationTurn, 
  ProviderType,
  PROVIDERS 
} from '@/types';


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

// API service for backend communication
const apiService = {
  // Create a new session
  createSession: async (): Promise<SessionState> => {
    const response = await fetch('http://localhost:5002/api/v1/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to create session');
    return response.json();
  },

  // Submit prompt to backend
  submitPrompt: async (sessionId: string, prompt: string, providers: ProviderType[], context: ConversationTurn[] = []) => {
    const response = await fetch('http://localhost:5002/api/v1/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, prompt, providers, context }),
    });
    if (!response.ok) throw new Error('Failed to submit prompt');
    return response.json();
  },

  // Select best response
  selectResponse: async (sessionId: string, responseId: string) => {
    const response = await fetch(`http://localhost:5002/api/v1/session/${sessionId}/select-response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId }),
    });
    if (!response.ok) throw new Error('Failed to select response');
    return response.json();
  },

  // Toggle provider
  toggleProvider: async (sessionId: string, providerId: ProviderType) => {
    const response = await fetch(`http://localhost:5002/api/v1/session/${sessionId}/toggle-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });
    if (!response.ok) throw new Error('Failed to toggle provider');
    return response.json();
  },

  // Retry provider
  retryProvider: async (sessionId: string, providerId: ProviderType) => {
    const response = await fetch(`http://localhost:5002/api/v1/session/${sessionId}/retry-provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId }),
    });
    if (!response.ok) throw new Error('Failed to retry provider');
    return response.json();
  },

  // Reset session
  resetSession: async (sessionId: string) => {
    const response = await fetch(`http://localhost:5002/api/v1/session/${sessionId}/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to reset session');
    return response.json();
  },

  // Get session
  getSession: async (sessionId: string) => {
    const response = await fetch(`http://localhost:5002/api/v1/session/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to get session');
    return response.json();
  },
};

// WebSocket service for real-time updates
const wsService = {
  connect: (sessionId: string, onMessage: (data: any) => void) => {
    // TODO: Implement WebSocket connection for real-time updates
    // const ws = new WebSocket(`ws://localhost:5002/ws/session/${sessionId}`);
    // ws.onmessage = (event) => onMessage(JSON.parse(event.data));
    
    // For now, we'll use polling as fallback
    const interval = setInterval(async () => {
      try {
        const session = await apiService.getSession(sessionId);
        onMessage({ type: 'session_update', data: session });
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 1000); // Poll every second
    
    return () => clearInterval(interval);
  }
};

// Function to initialize session from backend
const initializeSession = async (): Promise<SessionState> => {
  try {
    // Try to create a new session via backend
    return await apiService.createSession();
  } catch (error) {
    console.error('Backend connection failed, falling back to local session:', error);
    // Fallback to local session if backend is not available
    return createInitialSession();
  }
};

// Function to load a stored conversation into session
const loadStoredConversation = (storedConversation: any): SessionState => {
  return {
    id: storedConversation.id.replace('conv_', ''),
    conversationHistory: storedConversation.turns,
    currentPrompt: '',
    currentResponses: [],
    isProcessing: false,
    selectedResponseId: null,
    enabledProviders: ['gpt', 'llama', 'mistral', 'gemini', 'copilot', 'deepseek'],
  };
};

export function useSession() {
  const [session, setSession] = useState<SessionState>(createInitialSession);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize session from backend on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const backendSession = await initializeSession();
        setSession(backendSession);
      } catch (error) {
        console.error('Failed to initialize session from backend:', error);
        // Keep the initial session if backend fails
      }
    };
    
    initSession();
  }, []);

  // Listen for conversation load events
  useEffect(() => {
    const handleLoadConversation = (event: CustomEvent) => {
      const storedConversation = event.detail;
      const loadedSession = loadStoredConversation(storedConversation);
      setSession(loadedSession);
    };

    const handleNewSession = () => {
      setSession(createInitialSession());
    };

    window.addEventListener('rr-load-conversation', handleLoadConversation as EventListener);
    window.addEventListener('rr-new-session', handleNewSession);
    
    return () => {
      window.removeEventListener('rr-load-conversation', handleLoadConversation as EventListener);
      window.removeEventListener('rr-new-session', handleNewSession);
    };
  }, []);

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

    // Update UI to show pending state
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

    try {
      // Submit to backend API
      const updatedSession = await apiService.submitPrompt(session.id, prompt, session.enabledProviders, session.conversationHistory);
      
      // Update session with response from backend
      setSession(updatedSession);
    } catch (error) {
      console.error('Error submitting prompt:', error);
      
      // Show error message and keep responses empty
      setSession(prev => ({
        ...prev,
        isProcessing: false,
        currentResponses: [],
      }));
    }
  }, [session.id, session.isProcessing, session.enabledProviders, session.conversationHistory]);

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
  const selectBestResponse = useCallback(async (responseId: string) => {
    try {
      // Update backend
      const updatedSession = await apiService.selectResponse(session.id, responseId);
      
      // Update local state with response from backend
      setSession(updatedSession);
    } catch (error) {
      console.error('Error selecting response:', error);
      
      // Fallback to local implementation if backend fails
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
    }
  }, [session.id]);

  const toggleProvider = useCallback(async (providerId: ProviderType) => {
    try {
      // Update backend
      const updatedSession = await apiService.toggleProvider(session.id, providerId);
      
      // Update local state with response from backend
      setSession(updatedSession);
    } catch (error) {
      console.error('Error toggling provider:', error);
      
      // Fallback to local implementation if backend fails
      setSession(prev => ({
        ...prev,
        enabledProviders: prev.enabledProviders.includes(providerId)
          ? prev.enabledProviders.filter(p => p !== providerId)
          : [...prev.enabledProviders, providerId],
      }));
    }
  }, [session.id]);

  const resetSession = useCallback(async () => {
    abortControllerRef.current?.abort();
    
    try {
      // Reset session on backend
      const newSession = await apiService.resetSession(session.id);
      
      // Update local state
      setSession(newSession);
    } catch (error) {
      console.error('Error resetting session:', error);
      
      // Fallback to local implementation if backend fails
      setSession(createInitialSession());
    }
  }, [session.id]);

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
    try {
      // Retry provider on backend
      const updatedSession = await apiService.retryProvider(session.id, providerId);
      
      // Update local state with response from backend
      setSession(updatedSession);
    } catch (error) {
      console.error('Error retrying provider:', error);
      
      // Simply return without fallback response generation
      return;
    }
  }, [session.id, session.currentPrompt, session.currentResponses, session.conversationHistory]);

  return {
    session,
    submitPrompt,
    selectBestResponse,
    toggleProvider,
    resetSession,
    retryProvider,
  };
}
