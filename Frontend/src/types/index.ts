// ResponseRally Type Definitions

export type ProviderType = 'gpt' | 'llama' | 'mistral' | 'gemini' | 'copilot' | 'deepseek';

export type RequestStatus = 'idle' | 'pending' | 'success' | 'error' | 'timeout' | 'rate-limited';

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
  timestamp: number;
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
  userId?: string; // Optional userId from backend
  conversationHistory: ConversationTurn[];
  currentPrompt: string;
  currentResponses: ProviderResponse[];
  isProcessing: boolean;
  selectedResponseId: string | null;
  enabledProviders: ProviderType[];
  errorMessage?: string | null;
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

// Dashboard Types
export interface ProviderStats {
  provider: ProviderType;
  totalResponses: number;
  successfulResponses: number;
  errorResponses: number;
  avgLatency: number;
  avgTokens: number;
  avgResponseLength: number;
  totalTokens: number;
  selectionRate: number;
  successRate: number;
  avgFirstTokenLatency: number;
  avgTokensPerSecond: number;
  totalRetries: number;
}

export interface OverallStats {
  totalConversations: number;
  totalPrompts: number;
  totalResponses: number;
  successfulResponses: number;
  errorResponses: number;
  avgLatency: number;
  avgTokens: number;
  avgResponseLength: number;
  mostSelectedProvider: ProviderType | null;
  fastestProvider: ProviderType | null;
  mostReliableProvider: ProviderType | null;
  totalTokensGenerated: number;
  avgTokensPerSecond: number;
  totalRetries: number;
}

export interface DashboardData {
  overallStats: OverallStats;
  providerStats: ProviderStats[];
  recentConversations: ConversationTurn[];
  performanceTrends: {
    date: string;
    avgLatency: number;
    successRate: number;
    totalResponses: number;
  }[];
}
