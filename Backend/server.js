require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());

// Logging middleware to debug requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

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

// Import the actual provider response processing from middleware
const { processProviderResponse } = require('./middleware/ai-providers');

// Start the server
app.listen(PORT, () => {
  console.log(`ResponseRally Backend server running on port ${PORT}`);
});

module.exports = app;