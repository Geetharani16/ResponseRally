# ResponseRally

A sophisticated AI benchmarking and research interface that allows users to compare responses from multiple AI providers (GPT-4, LLaMA, Mistral, Gemini, Copilot, and DeepSeek) side-by-side.

## Getting Started

### Prerequisites
- Node.js and npm

### Installation
1. Clone the repository
2. Navigate to the `Frontend` directory
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev`

### Configuration
- The frontend runs on port **5768** by default
- To change the port, update `vite.config.ts` in the Frontend directory

### Running the Application
Run `npm run dev` in the Frontend directory to start the development server. The application will be available at http://localhost:5768

## Features
- Multi-provider AI response comparison
- Real-time streaming display with performance metrics
- Conversation context management
- Provider management and toggling
- Error handling with retry functionality