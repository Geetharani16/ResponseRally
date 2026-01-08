require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// In-memory storage for sessions (in production, use a database like MongoDB or PostgreSQL)
let sessions = new Map();
let providers = [
  { id: 'gpt', name: 'GPT-4', displayName: 'OpenAI GPT-4', enabled: true },
  { id: 'llama', name: 'LLaMA', displayName: 'Meta LLaMA', enabled: true },
  { id: 'mistral', name: 'Mistral', displayName: 'Mistral AI', enabled: true },
  { id: 'gemini', name: 'Gemini', displayName: 'Google Gemini', enabled: true },
  { id: 'copilot', name: 'Copilot', displayName: 'Microsoft Copilot', enabled: true },
  { id: 'deepseek', name: 'DeepSeek', displayName: 'DeepSeek', enabled: true }
];

// Helper function to create a new session
const createSession = () => {
  return {
    id: uuidv4(),
    conversationHistory: [],
    currentPrompt: '',
    currentResponses: [],
    isProcessing: false,
    selectedResponseId: null,
    enabledProviders: providers.filter(p => p.enabled).map(p => p.id),
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// Import API routes
const apiRoutes = require('./routes/api');

// Use API routes
app.use('/api/v1', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Simulate provider response (in the real implementation, this would call actual AI APIs)
const simulateProviderResponse = async (response, context = []) => {
  // Simulate different response times for different providers
  const baseLatencies = {
    gpt: 500,
    llama: 600,
    mistral: 400,
    gemini: 450,
    copilot: 550,
    deepseek: 700,
  };
  
  const baseLatency = baseLatencies[response.provider] || 500;
  await new Promise(resolve => setTimeout(resolve, baseLatency + Math.random() * 500));
  
  // Simulate 10% chance of error for realism
  if (Math.random() < 0.1) {
    return {
      ...response,
      status: 'error',
      errorMessage: 'Provider temporarily unavailable. Please retry.',
      metrics: {
        latencyMs: null,
        tokenCount: null,
        responseLength: 0,
        firstTokenLatencyMs: null,
        tokensPerSecond: null,
      },
    };
  }
  
  // Simulate 5% chance of rate limiting
  if (Math.random() < 0.05) {
    return {
      ...response,
      status: 'rate-limited',
      errorMessage: 'Rate limit exceeded. Retry after 30 seconds.',
      metrics: {
        latencyMs: null,
        tokenCount: null,
        responseLength: 0,
        firstTokenLatencyMs: null,
        tokensPerSecond: null,
      },
    };
  }
  
  // Get a simulated response based on provider
  const responses = {
    gpt: [
      "I'd be happy to help you with that! Based on your query, here's a comprehensive response that covers the key aspects you're asking about.\n\nFirst, let me break down the main points:\n\n1. **Understanding the Context**: Your question touches on an important topic that requires careful consideration of multiple factors.\n\n2. **Key Considerations**: There are several approaches we could take here, each with their own trade-offs.\n\n3. **Recommendation**: Based on best practices, I would suggest starting with the most straightforward approach and iterating from there.\n\nWould you like me to elaborate on any specific aspect?",
      "That's a great question! Let me provide a detailed analysis.\n\nThe solution involves several interconnected components that work together to achieve the desired outcome. Here's how they fit together:\n\n```\nComponent A → Component B → Output\n     ↓\nComponent C (validation)\n```\n\nThis architecture ensures reliability while maintaining flexibility for future modifications."
    ],
    llama: [
      "Let me think through this step by step.\n\n**Analysis:**\nYour question presents an interesting challenge. Here's my understanding and proposed solution:\n\n1. The core issue seems to be related to how data flows through the system\n2. We need to consider both performance and maintainability\n3. The solution should be scalable\n\n**Proposed Approach:**\n- Start with a modular design\n- Implement proper error handling\n- Add monitoring for key metrics\n\nThis should give you a solid foundation to build upon.",
      "Interesting problem! Here's my take:\n\nFrom a technical standpoint, there are multiple valid approaches. The optimal choice depends on your specific constraints:\n\n• If performance is critical: Consider approach A\n• If maintainability is the priority: Approach B might be better\n• For a balanced solution: A hybrid of both\n\nLet me know which direction you'd like to explore further."
    ],
    mistral: [
      "Excellent question! I'll provide a thorough response.\n\n## Overview\n\nThis topic requires understanding several key concepts:\n\n### 1. Foundational Principles\nThe underlying mechanics work by establishing a clear separation of concerns, allowing each component to focus on its specific responsibility.\n\n### 2. Implementation Details\n```typescript\n// Example structure\ninterface Solution {\n  input: InputType;\n  process(): Result;\n  validate(): boolean;\n}\n```\n\n### 3. Best Practices\n- Always validate inputs\n- Handle edge cases gracefully\n- Document your assumptions\n\nWould you like code examples for any specific part?",
      "I appreciate the question! Here's a comprehensive breakdown:\n\nThe solution can be approached from multiple angles, but I recommend focusing on clarity and correctness first, then optimizing as needed.\n\n**Key insight:** The most elegant solutions often emerge from deeply understanding the problem constraints rather than jumping straight to implementation."
    ],
    gemini: [
      "Thanks for your question! Let me share my perspective.\n\n🎯 **Key Takeaways:**\n\n1. **Context Matters**: The best approach depends heavily on your specific use case and constraints.\n\n2. **Trade-offs**: Every solution involves trade-offs between:\n   - Performance vs. Simplicity\n   - Flexibility vs. Stability\n   - Speed vs. Accuracy\n\n3. **Recommendation**: Start simple, measure, then optimize.\n\n💡 **Pro Tip**: Document your decisions and the reasoning behind them. Future you will thank present you!\n\nShould I dive deeper into any of these areas?",
      "Great question! Here's what I think:\n\nThe answer depends on several factors that we should consider:\n\n**Technical Considerations:**\n• System architecture\n• Performance requirements\n• Scaling needs\n\n**Practical Considerations:**\n• Team expertise\n• Time constraints\n• Maintenance burden\n\nI'd suggest starting with a proof of concept to validate assumptions before committing to a full implementation."
    ],
    copilot: [
      "I can help with that! Here's a structured approach:\n\n## Problem Analysis\nLet's break this down into manageable components:\n\n### Step 1: Define Requirements\n- What are the inputs?\n- What outputs do we expect?\n- What are the constraints?\n\n### Step 2: Design Solution\n```\n┌─────────────┐     ┌─────────────┐     ┌─────────────┐\n│   Input     │ ──► │  Process    │ ──► │   Output    │\n└─────────────┘     └─────────────┘     └─────────────┘\n```\n\n### Step 3: Implement & Test\nStart with the core logic, then add error handling and edge cases.\n\nLet me know if you need help with any specific step!",
      "Sure, I'd be glad to assist!\n\nBased on your question, here are some approaches worth considering:\n\n**Option 1: Direct Approach**\n- Pros: Simple, fast to implement\n- Cons: May not scale well\n\n**Option 2: Abstracted Approach**\n- Pros: More flexible, easier to maintain\n- Cons: More upfront complexity\n\n**My recommendation:** Start with Option 1 for a quick win, then refactor to Option 2 if needed."
    ],
    deepseek: [
      "Let me analyze this carefully.\n\n## Deep Analysis\n\nYour question touches on fundamental concepts that deserve thorough exploration:\n\n### Theoretical Foundation\nThe underlying principles here relate to how systems handle complexity and maintain coherence across different abstraction levels.\n\n### Practical Application\n```python\n# Conceptual example\ndef solve(problem):\n    # Decompose into subproblems\n    parts = decompose(problem)\n    \n    # Solve each part\n    solutions = [solve_part(p) for p in parts]\n    \n    # Combine results\n    return combine(solutions)\n```\n\n### Key Insights\n1. Decomposition is often the hardest part\n2. The combination strategy matters as much as individual solutions\n3. Iteration beats perfection\n\nFeel free to ask follow-up questions!",
      "Fascinating question! Here's my analysis:\n\nThis problem can be viewed through multiple lenses:\n\n**Systems Perspective:**\nThink of it as interconnected components where changes propagate through the system.\n\n**Optimization Perspective:**\nWe're essentially trying to find the optimal point in a multi-dimensional space.\n\n**Practical Perspective:**\nWhat's the simplest thing that could possibly work?\n\nI recommend starting with the practical view, then incorporating insights from the other perspectives as you iterate."
    ]
  };
  
  const providerResponses = responses[response.provider] || responses.gpt;
  const fullResponse = providerResponses[Math.floor(Math.random() * providerResponses.length)];
  
  // Simulate streaming by updating the response gradually
  const startTime = Date.now();
  const firstTokenTime = startTime + Math.random() * 300;
  
  // Update response status to streaming
  response.status = 'streaming';
  response.isStreaming = true;
  response.metrics.firstTokenLatencyMs = firstTokenTime - startTime;
  
  // Simulate streaming by gradually adding content
  const words = fullResponse.split(' ');
  const tokensPerChunk = 3;
  let accumulated = '';
  
  for (let i = 0; i < words.length; i += tokensPerChunk) {
    const chunk = words.slice(i, i + tokensPerChunk).join(' ') + ' ';
    accumulated += chunk;
    
    const progress = Math.min(100, Math.round((i / words.length) * 100));
    const elapsed = Date.now() - startTime;
    const estimatedTokens = Math.ceil(accumulated.length / 4);
    
    response.response = accumulated;
    response.streamingProgress = progress;
    response.metrics = {
      latencyMs: elapsed,
      tokenCount: estimatedTokens,
      responseLength: accumulated.length,
      firstTokenLatencyMs: firstTokenTime - startTime,
      tokensPerSecond: estimatedTokens / (elapsed / 1000),
    };
    
    // Simulate realistic streaming delay
    await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 50));
  }
  
  const endTime = Date.now();
  const totalLatency = endTime - startTime;
  const tokenCount = Math.ceil(fullResponse.length / 4);
  
  return {
    ...response,
    response: fullResponse.trim(),
    status: 'success',
    metrics: {
      latencyMs: totalLatency,
      tokenCount,
      responseLength: fullResponse.length,
      firstTokenLatencyMs: firstTokenTime - startTime,
      tokensPerSecond: tokenCount / (totalLatency / 1000),
    },
    isStreaming: false,
    streamingProgress: 100,
  };
};

// Start the server
app.listen(PORT, () => {
  console.log(`ResponseRally Backend server running on port ${PORT}`);
});

module.exports = app;