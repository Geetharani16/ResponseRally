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

// NEW: Get user conversations with all responses
export async function getUserConversations(userId: string) {
  return apiCall(`/analytics/responses/${userId}`);
}

// NEW: Get specific session with all responses
export async function getSessionResponses(sessionId: string) {
  return apiCall(`/analytics/responses/session/${sessionId}`);
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