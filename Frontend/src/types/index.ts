// ResponseRally Type Definitions

export type ProviderType = 'gpt' | 'llama' | 'mistral' | 'gemini' | 'copilot' | 'deepseek';

export type RequestStatus = 'idle' | 'pending' | 'streaming' | 'success' | 'error' | 'timeout' | 'rate-limited';

export interface ProviderConfig {
  id: ProviderType;
  name: string;
  displayName: string;
  color: string;
  enabled: boolean;
}

export interface ResponseMetrics {
  latencyMs: number | null;
  tokenCount: number | null;
  responseLength: number;
  firstTokenLatencyMs: number | null;
  tokensPerSecond: number | null;
}

export interface ProviderResponse {
  id: string;
  provider: ProviderType;
  prompt: string;
  response: string;
  status: RequestStatus;
  metrics: ResponseMetrics;
  retryCount: number;
  errorMessage: string | null;
  streamingProgress: number; // 0-100
  timestamp: number;
  isStreaming: boolean;
}

export interface ConversationTurn {
  id: string;
  userPrompt: string;
  selectedResponse: ProviderResponse | null;
  allResponses: ProviderResponse[];
  timestamp: number;
}

export interface SessionState {
  id: string;
  conversationHistory: ConversationTurn[];
  currentPrompt: string;
  currentResponses: ProviderResponse[];
  isProcessing: boolean;
  selectedResponseId: string | null;
  enabledProviders: ProviderType[];
}

// Provider configuration
export const PROVIDERS: ProviderConfig[] = [
  { id: 'gpt', name: 'GPT-4', displayName: 'OpenAI GPT-4', color: 'provider-gpt', enabled: true },
  { id: 'llama', name: 'LLaMA', displayName: 'Meta LLaMA', color: 'provider-llama', enabled: true },
  { id: 'mistral', name: 'Mistral', displayName: 'Mistral AI', color: 'provider-mistral', enabled: true },
  { id: 'gemini', name: 'Gemini', displayName: 'Google Gemini', color: 'provider-gemini', enabled: true },
  { id: 'copilot', name: 'Copilot', displayName: 'Microsoft Copilot', color: 'provider-copilot', enabled: true },
  { id: 'deepseek', name: 'DeepSeek', displayName: 'DeepSeek', color: 'provider-deepseek', enabled: true },

];
