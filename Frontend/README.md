# ResponseRally Frontend

The frontend for ResponseRally - a sophisticated AI benchmarking and research interface that allows users to compare responses from multiple AI providers (GPT-4, LLaMA, Mistral, Gemini, Copilot, and DeepSeek) side-by-side.

## Project Setup

### Prerequisites
- Node.js and npm

### Installation
1. Navigate to the `Frontend` directory
2. Install dependencies: `npm install`

### Development
To start the development server, run:
```bash
npm run dev
```
The application will be available at http://localhost:5768

### Building for Production
To build the application for production, run:
```bash
npm run build
```

## Technologies Used

This project is built with:

- Vite
- TypeScript
- React
- shadcn/ui
- Tailwind CSS

## Components

- **Header.tsx**: Application header with theme toggle and session controls
- **PromptInput.tsx**: Multi-provider prompt submission interface
- **ResponseGrid.tsx**: Horizontal scrolling grid for displaying responses
- **ResponseCard.tsx**: Individual response display with actions
- **ComprehensiveMetricsMatrix.tsx**: Combined metrics matrix showing all provider metrics in tabular format
- **ConversationHistory.tsx**: Chronological display of conversation turns
- **MetricsPanel.tsx**: Performance metrics visualization
- **ProviderBadge.tsx**: Provider identification badges
- **StatusIndicator.tsx**: Visual status indicators

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Lint the codebase
