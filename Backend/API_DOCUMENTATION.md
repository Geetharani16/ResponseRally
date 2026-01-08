# ResponseRally Backend API Documentation

## Overview

The ResponseRally backend provides API endpoints for managing AI response comparisons across multiple providers. The backend handles session management, prompt processing, and response coordination between various AI providers.

## Base URL

`http://localhost:5000/api/v1`

## Endpoints

### Session Management

#### Create Session
- **POST** `/session`
- **Description**: Creates a new session for AI comparisons
- **Request**: No body required
- **Response**: Session object with ID and initial state

#### Get Session
- **GET** `/session/:sessionId`
- **Description**: Retrieves session details by ID
- **Response**: Session object with all current data

#### Reset Session
- **POST** `/session/:sessionId/reset`
- **Description**: Resets a session to its initial state
- **Response**: New session object with preserved ID

### Prompt Processing

#### Submit Prompt
- **POST** `/prompt`
- **Description**: Submits a prompt to multiple AI providers
- **Request Body**:
  ```json
  {
    "sessionId": "string",
    "prompt": "string",
    "providers": ["gpt", "llama", "mistral", "gemini", "copilot", "deepseek"],
    "context": []
  }
  ```
- **Response**: Updated session with pending responses

### Response Management

#### Select Best Response
- **POST** `/session/:sessionId/select-response`
- **Description**: Marks a response as the best one and adds to conversation history
- **Request Body**:
  ```json
  {
    "responseId": "string"
  }
  ```
- **Response**: Updated session object

#### Toggle Provider
- **POST** `/session/:sessionId/toggle-provider`
- **Description**: Enables or disables an AI provider
- **Request Body**:
  ```json
  {
    "providerId": "string"
  }
  ```
- **Response**: Updated session object

#### Retry Provider
- **POST** `/session/:sessionId/retry-provider`
- **Description**: Retries a failed provider response
- **Request Body**:
  ```json
  {
    "providerId": "string"
  }
  ```
- **Response**: Updated session object

### Health Check

#### Health Status
- **GET** `/health`
- **Description**: Checks server health status
- **Response**: Health status object

## Supported AI Providers

- `gpt` - OpenAI GPT-4
- `llama` - Meta LLaMA
- `mistral` - Mistral AI
- `gemini` - Google Gemini
- `copilot` - Microsoft Copilot
- `deepseek` - DeepSeek

## Response Format

All API responses follow this structure:

```json
{
  "id": "string",
  "provider": "string",
  "prompt": "string",
  "response": "string",
  "status": "pending|streaming|success|error|rate-limited",
  "metrics": {
    "latencyMs": "number|null",
    "tokenCount": "number|null",
    "responseLength": "number",
    "firstTokenLatencyMs": "number|null",
    "tokensPerSecond": "number|null"
  },
  "retryCount": "number",
  "errorMessage": "string|null",
  "streamingProgress": "number",
  "timestamp": "number",
  "isStreaming": "boolean"
}
```

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000
NODE_ENV=development

# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_api_key
MISTRAL_API_KEY=your_mistral_api_key
LLAMA_API_KEY=your_llama_api_key
COPILOT_API_KEY=your_copilot_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
```

## Database Integration

The backend currently uses in-memory storage for development. For production, integrate with a persistent database by updating the database layer in `database/db.js`.

## Rate Limiting

The API includes rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address