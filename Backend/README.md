# ResponseRally Backend

Backend API server for the ResponseRally AI comparison application.

## Overview

This backend provides API endpoints for:
- Session management
- Multi-provider AI response comparison
- Conversation history tracking
- Performance metrics collection
- Theme management

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
```

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Session Management

- `POST /api/v1/session` - Create a new session
- `GET /api/v1/session/:sessionId` - Get session details
- `POST /api/v1/session/:sessionId/reset` - Reset a session

### Prompt Processing

- `POST /api/v1/prompt` - Submit a prompt to multiple AI providers
- `POST /api/v1/session/:sessionId/select-response` - Select the best response
- `POST /api/v1/session/:sessionId/toggle-provider` - Toggle a provider on/off
- `POST /api/v1/session/:sessionId/retry-provider` - Retry a failed provider

### Health Check

- `GET /health` - Check server health status

## Configuration

The server uses environment variables for configuration. Update the `.env` file as needed.

## AI Provider Integration

When you have API keys for the various AI providers, add them to the `.env` file:
- OPENAI_API_KEY
- GOOGLE_API_KEY (for Gemini)
- MISTRAL_API_KEY
- Meta_API_KEY (for LLaMA)
- COPILOT_API_KEY
- DEEPSEEK_API_KEY

## Database Integration

Currently using in-memory storage. For production, integrate with a database like MongoDB or PostgreSQL by replacing the `sessions` Map with database operations.

## Rate Limiting

The API includes rate limiting to prevent abuse. Current limits:
- 100 requests per 15 minutes per IP address