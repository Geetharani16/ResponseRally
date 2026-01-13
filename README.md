# ResponseRally

A sophisticated AI benchmarking and research interface that allows users to compare responses from multiple AI providers (GPT-4, LLaMA, Mistral, Gemini, Copilot, and DeepSeek) side-by-side.

## Table of Contents
- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Clear Separation of Concerns](#clear-separation-of-concerns)
- [Getting Started](#getting-started)
- [Features](#features)

## Overview

ResponseRally consists of two main components:
- **Frontend**: A React-based user interface for AI response comparison
- **Backend**: A Node.js API server for managing AI provider requests and session management

The architecture is designed with a clear separation of concerns where the frontend handles UI/UX and client-side state management while the backend handles business logic, data persistence, and AI provider integrations.

## Directory Structure

```
ResponseRally/
├── Frontend/                     # React frontend application
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/           # UI components (Header, ResponseGrid, etc.)
│   │   │   ├── ui/               # Shadcn UI primitives
│   │   │   ├── ConversationHistory.tsx
│   │   │   ├── Header.tsx        # Header with theme toggle and session controls
│   │   │   ├── MetricsPanel.tsx  # Performance metrics display
│   │   │   ├── PromptInput.tsx   # Prompt input with provider toggles
│   │   │   ├── ProviderBadge.tsx # Provider identification badges
│   │   │   ├── ResponseCard.tsx  # Individual response display
│   │   │   ├── ResponseGrid.tsx  # Grid layout for response comparison
│   │   │   ├── StatusIndicator.tsx
│   │   │   └── ComprehensiveMetricsMatrix.tsx  # Combined metrics matrix for all providers
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useSession.ts     # Session state management (with backend API integration)
│   │   ├── lib/
│   │   │   ├── mockApi.ts      # Mock API for development (will be replaced by backend)
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Index.tsx       # Main application page
│   │   │   └── NotFound.tsx
│   │   ├── types/
│   │   │   └── index.ts        # TypeScript type definitions
│   │   ├── App.tsx              # Main App component (with ThemeProvider)
│   │   ├── index.css            # CSS variables for dark/light themes
│   │   └── main.tsx
│   ├── components.json
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── vite.config.ts         # Vite configuration (port 5768)
│   └── ...
├── Backend/                     # Node.js backend API server
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   ├── .env                    # Environment variables
│   ├── README.md               # Backend documentation
│   ├── API_DOCUMENTATION.md    # Detailed API endpoints
│   ├── INSTRUCTIONS.md         # Setup instructions
│   ├── routes/
│   │   └── api.js              # API route handlers
│   ├── middleware/
│   │   └── ai-providers.js     # AI provider integration logic
│   └── database/
│       └── db.js               # Database abstraction layer
└── README.md                 # This file (main project documentation)
```

## Frontend Architecture

The frontend is built with React, TypeScript, and Vite, featuring:

### Key Components
- **Header.tsx**: Application header with theme toggle (sun/moon icons), Export and Flow icons, and session controls
- **useSession.ts**: Centralized session state management hook that handles all AI comparison logic
- **ResponseGrid.tsx**: Horizontal scrolling grid for displaying multiple AI responses
- **ResponseCard.tsx**: Individual response cards with metrics and selection functionality
- **PromptInput.tsx**: Input component with provider toggling capabilities
- **MetricsPanel.tsx**: Performance metrics display (latency, tokens, etc.)
- **ComprehensiveMetricsMatrix.tsx**: Detailed metrics matrix display with expanded metrics (latency, tokens, efficiency, etc.)
- **ConversationHistory.tsx**: Scrollable conversation history display with vertical scrolling for better UX

### Styling & Themes
- **index.css**: Defines CSS variables for both dark and light themes
- **Dark Theme**: Technical aesthetic with blue/cyan accents
- **Light Theme**: Green-yellow-white gradient theme (as requested)
- **Theme Transition**: Smooth 300ms color transitions when switching themes

### API Integration
- **useSession.ts**: Contains commented API service functions ready for backend integration
- **Fallback System**: Maintains mock API functionality until backend is connected
- **Real-time Updates**: Prepared for WebSocket/SSE integration

### Frontend Responsibilities
- **UI/UX Rendering**: All visual elements, layouts, and user interactions
- **State Management**: Client-side state management for session data
- **User Input Handling**: Processing user prompts and provider selections
- **API Communication**: Making requests to backend API endpoints
- **Real-time Updates**: Updating UI based on backend responses
- **Theme Management**: Handling dark/light theme switching
- **Session State**: Managing local session state with backend synchronization

## Backend Architecture

The backend is built with Node.js, Express, and follows a modular architecture:

### Core Files
- **server.js**: Main server entry point with middleware and route configuration
- **routes/api.js**: All API endpoints for session management and AI interactions
- **middleware/ai-providers.js**: Integration layer for various AI providers
- **database/db.js**: Abstraction layer for database operations (currently in-memory)

### API Endpoints
- **Session Management**: `/api/v1/session` (create, get, reset)
- **Prompt Processing**: `/api/v1/prompt` (submit to multiple providers)
- **Response Management**: `/api/v1/session/:id/select-response`, `/toggle-provider`, `/retry-provider`
- **Health Check**: `/health`

### Features
- **Rate Limiting**: Prevents API abuse with 100 requests per 15 minutes
- **Session Management**: Maintains conversation history and context
- **Provider Integration**: Ready for OpenAI, Google, Meta, Mistral, Microsoft, and DeepSeek APIs
- **Real-time Updates**: Prepared for WebSocket integration

### Backend Responsibilities
- **Session Management**: Creating, storing, and managing session data
- **AI Provider Integration**: Handling communication with external AI services
- **Response Processing**: Collecting and aggregating responses from multiple providers
- **Data Persistence**: Storing session history and conversation context
- **Security & Validation**: Rate limiting, input validation, and API key management
- **Business Logic**: Processing requests and orchestrating responses
- **Metrics Collection**: Gathering performance metrics for responses

## Clear Separation of Concerns

ResponseRally follows a well-defined separation of concerns between frontend and backend:

| Aspect | Frontend Responsibility | Backend Responsibility |
|--------|------------------------|------------------------|
| **User Interface** | Rendering UI components, layouts, styling | No UI rendering |
| **State Management** | Client-side session state, UI state | Server-side session data, persistent storage |
| **API Communication** | Making HTTP requests to backend | Receiving and processing requests |
| **User Interaction** | Handling clicks, form submissions, user events | Processing business logic from user actions |
| **Data Validation** | Client-side validation, UX feedback | Server-side validation, security checks |
| **Authentication** | UI for login, token storage (if implemented) | Token generation, validation, user management |
| **AI Integration** | Displaying responses, metrics | Communicating with AI providers, aggregating responses |
| **Performance** | Optimizing UI rendering, caching | Optimizing API responses, database queries |
| **Error Handling** | UI error states, user feedback | API error responses, logging |

This clear division ensures that:
- The frontend focuses solely on presentation and user experience
- The backend handles all business logic, data operations, and external service integrations
- Both components communicate through well-defined API contracts
- Each component can be developed, tested, and maintained independently
- Scalability is achieved by scaling backend services separately from frontend delivery

## Getting Started

### Prerequisites
- Node.js and npm

### Frontend Setup
1. Navigate to the `Frontend` directory
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

### Backend Setup
1. Navigate to the `Backend` directory
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`
4. Start the server: `npm run dev`

### Configuration
- The frontend runs on port **5768** by default
- The backend runs on port **5000** by default
- To change ports, update `vite.config.ts` (frontend) or `.env` (backend)

### Running the Application
1. Start the backend server first: `cd Backend && npm run dev`
2. In a separate terminal, start the frontend: `cd Frontend && npm run dev`
3. The application will be available at http://localhost:5768

## Features
- Multi-provider AI response comparison
- Real-time streaming display with performance metrics
- Conversation context management with scrollable history
- Provider management and toggling
- Error handling with retry functionality
- Dark/Light theme with smooth transitions
- Enhanced header with Export and Flow icons
- Responsive design for all screen sizes
- Session persistence and management
- Ready for backend integration