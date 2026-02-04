/**
 * =====================================================
 * MOCK API - REPLACE WITH ACTUAL BACKEND CALLS
 * =====================================================
 * This file simulates backend responses for development.
 * In production, replace with actual API integrations.
 * 
 * Backend responsibilities:
 * - Credential management (API keys per provider)
 * - Rate limiting and quota management
 * - Request routing and load balancing
 * - Response normalization across providers
 * - Logging and analytics
 * - Error handling and retry logic
 * =====================================================
 */

import { ProviderType, ProviderResponse, ConversationTurn } from '@/types';

// Helper function to generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// Helper function to generate mock response text
function generateMockResponseText(provider: ProviderType, prompt: string, context: ConversationTurn[]): string {
  const responses = MOCK_RESPONSES[provider];
  return responses[Math.floor(Math.random() * responses.length)];
}

const MOCK_RESPONSES: Record<ProviderType, string[]> = {
  gpt: [
    "I'd be happy to help you with that! Based on your query, here's a comprehensive response that covers the key aspects you're asking about.\n\nFirst, let me break down the main points:\n\n1. **Understanding the Context**: Your question touches on an important topic that requires careful consideration of multiple factors.\n\n2. **Key Considerations**: There are several approaches we could take here, each with their own trade-offs.\n\n3. **Recommendation**: Based on best practices, I would suggest starting with the most straightforward approach and iterating from there.\n\nWould you like me to elaborate on any specific aspect?",
    "That's a great question! Let me provide a detailed analysis.\n\nThe solution involves several interconnected components that work together to achieve the desired outcome. Here's how they fit together:\n\n```\nComponent A → Component B → Output\n     ↓\nComponent C (validation)\n```\n\nThis architecture ensures reliability while maintaining flexibility for future modifications.",
  ],
  llama: [
    "Let me think through this step by step.\n\n**Analysis:**\nYour question presents an interesting challenge. Here's my understanding and proposed solution:\n\n1. The core issue seems to be related to how data flows through the system\n2. We need to consider both performance and maintainability\n3. The solution should be scalable\n\n**Proposed Approach:**\n- Start with a modular design\n- Implement proper error handling\n- Add monitoring for key metrics\n\nThis should give you a solid foundation to build upon.",
    "Interesting problem! Here's my take:\n\nFrom a technical standpoint, there are multiple valid approaches. The optimal choice depends on your specific constraints:\n\n• If performance is critical: Consider approach A\n• If maintainability is the priority: Approach B might be better\n• For a balanced solution: A hybrid of both\n\nLet me know which direction you'd like to explore further.",
  ],
  mistral: [
    "Excellent question! I'll provide a thorough response.\n\n## Overview\n\nThis topic requires understanding several key concepts:\n\n### 1. Foundational Principles\nThe underlying mechanics work by establishing a clear separation of concerns, allowing each component to focus on its specific responsibility.\n\n### 2. Implementation Details\n```typescript\n// Example structure\ninterface Solution {\n  input: InputType;\n  process(): Result;\n  validate(): boolean;\n}\n```\n\n### 3. Best Practices\n- Always validate inputs\n- Handle edge cases gracefully\n- Document your assumptions\n\nWould you like code examples for any specific part?",
    "I appreciate the question! Here's a comprehensive breakdown:\n\nThe solution can be approached from multiple angles, but I recommend focusing on clarity and correctness first, then optimizing as needed.\n\n**Key insight:** The most elegant solutions often emerge from deeply understanding the problem constraints rather than jumping straight to implementation.",
  ],
  gemini: [
    "Thanks for your question! Let me share my perspective.\n\n🎯 **Key Takeaways:**\n\n1. **Context Matters**: The best approach depends heavily on your specific use case and constraints.\n\n2. **Trade-offs**: Every solution involves trade-offs between:\n   - Performance vs. Simplicity\n   - Flexibility vs. Stability\n   - Speed vs. Accuracy\n\n3. **Recommendation**: Start simple, measure, then optimize.\n\n💡 **Pro Tip**: Document your decisions and the reasoning behind them. Future you will thank present you!\n\nShould I dive deeper into any of these areas?",
    "Great question! Here's what I think:\n\nThe answer depends on several factors that we should consider:\n\n**Technical Considerations:**\n• System architecture\n• Performance requirements\n• Scaling needs\n\n**Practical Considerations:**\n• Team expertise\n• Time constraints\n• Maintenance burden\n\nI'd suggest starting with a proof of concept to validate assumptions before committing to a full implementation.",
  ],
  copilot: [
    "I can help with that! Here's a structured approach:\n\n## Problem Analysis\nLet's break this down into manageable components:\n\n### Step 1: Define Requirements\n- What are the inputs?\n- What outputs do we expect?\n- What are the constraints?\n\n### Step 2: Design Solution\n```\n┌─────────────┐     ┌─────────────┐     ┌─────────────┐\n│   Input     │ ──► │  Process    │ ──► │   Output    │\n└─────────────┘     └─────────────┘     └─────────────┘\n```\n\n### Step 3: Implement & Test\nStart with the core logic, then add error handling and edge cases.\n\nLet me know if you need help with any specific step!",
    "Sure, I'd be glad to assist!\n\nBased on your question, here are some approaches worth considering:\n\n**Option 1: Direct Approach**\n- Pros: Simple, fast to implement\n- Cons: May not scale well\n\n**Option 2: Abstracted Approach**\n- Pros: More flexible, easier to maintain\n- Cons: More upfront complexity\n\n**My recommendation:** Start with Option 1 for a quick win, then refactor to Option 2 if needed.",
  ],
  deepseek: [
    "Let me analyze this carefully.\n\n## Deep Analysis\n\nYour question touches on fundamental concepts that deserve thorough exploration:\n\n### Theoretical Foundation\nThe underlying principles here relate to how systems handle complexity and maintain coherence across different abstraction levels.\n\n### Practical Application\n```python\n# Conceptual example\ndef solve(problem):\n    # Decompose into subproblems\n    parts = decompose(problem)\n    \n    # Solve each part\n    solutions = [solve_part(p) for p in parts]\n    \n    # Combine results\n    return combine(solutions)\n```\n\n### Key Insights\n1. Decomposition is often the hardest part\n2. The combination strategy matters as much as individual solutions\n3. Iteration beats perfection\n\nFeel free to ask follow-up questions!",
    "Fascinating question! Here's my analysis:\n\nThis problem can be viewed through multiple lenses:\n\n**Systems Perspective:**\nThink of it as interconnected components where changes propagate through the system.\n\n**Optimization Perspective:**\nWe're essentially trying to find the optimal point in a multi-dimensional space.\n\n**Practical Perspective:**\nWhat's the simplest thing that could possibly work?\n\nI recommend starting with the practical view, then incorporating insights from the other perspectives as you iterate.",
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function simulateError(): boolean {
  // 10% chance of error for realism
  return Math.random() < 0.1;
}

function simulateRateLimit(): boolean {
  // 5% chance of rate limiting
  return Math.random() < 0.05;
}

/**
 * =====================================================
 * MOCK RESPONSE GENERATOR
 * =====================================================
 * Simulates responses from AI providers.
 * Replace with actual API calls in production.
 * 
 * Integration points:
 * - fetch/axios for HTTP requests
 * - AbortController for cancellation
 * =====================================================
 */
export async function generateMockResponse(
  provider: ProviderType,
  prompt: string,
  context: ConversationTurn[],
  onUpdate: (update: Partial<ProviderResponse>) => void
): Promise<ProviderResponse> {
  const startTime = Date.now();
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  // Simulate rate limiting
  if (Math.random() < 0.05) {
    onUpdate({ 
      status: 'rate-limited',
      errorMessage: 'Rate limit exceeded. Retry after 30 seconds.'
    });
    return {
      id: generateId(),
      provider,
      prompt,
      response: '',
      status: 'rate-limited',
      metrics: { latencyMs: null, tokenCount: null, responseLength: 0, firstTokenLatencyMs: null, tokensPerSecond: null },
      retryCount: 0,
      errorMessage: 'Rate limit exceeded. Retry after 30 seconds.',
      timestamp: startTime,
    };
  }
  
  // Simulate provider errors
  if (Math.random() < 0.1) {
    onUpdate({ 
      status: 'error',
      errorMessage: 'Provider temporarily unavailable. Please retry.'
    });
    return {
      id: generateId(),
      provider,
      prompt,
      response: '',
      status: 'error',
      metrics: { latencyMs: null, tokenCount: null, responseLength: 0, firstTokenLatencyMs: null, tokensPerSecond: null },
      retryCount: 0,
      errorMessage: 'Provider temporarily unavailable. Please retry.',
      timestamp: startTime,
    };
  }
  
  // Simulate response generation
  const responseText = generateMockResponseText(provider, prompt, context);
  const totalTokens = Math.ceil(responseText.length / 4);
  
  // Update with final response
  onUpdate({
    status: 'success',
    response: responseText,
    metrics: {
      latencyMs: Date.now() - startTime,
      tokenCount: totalTokens,
      responseLength: responseText.length,
      firstTokenLatencyMs: Date.now() - startTime,
      tokensPerSecond: totalTokens / ((Date.now() - startTime) / 1000),
    }
  });
  
  return {
    id: generateId(),
    provider,
    prompt,
    response: responseText,
    status: 'success',
    metrics: {
      latencyMs: Date.now() - startTime,
      tokenCount: totalTokens,
      responseLength: responseText.length,
      firstTokenLatencyMs: Date.now() - startTime,
      tokensPerSecond: totalTokens / ((Date.now() - startTime) / 1000),
    },
    retryCount: 0,
    errorMessage: null,
    timestamp: startTime,
  };
}
