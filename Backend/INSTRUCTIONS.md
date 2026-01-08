# ResponseRally Backend Instructions

## Setup

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the PORT if needed (default is 5000)
   - Add your AI provider API keys when available

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## API Integration with Frontend

The frontend is already prepared with commented API calls that will connect to the backend when uncommented. The API endpoints are located in `Frontend/src/hooks/useSession.ts`.

To enable backend integration:

1. Uncomment the API service functions in `Frontend/src/hooks/useSession.ts`
2. Remove or comment out the mock API imports
3. Ensure the backend server is running on `http://localhost:5000`

## Available Endpoints

Full API documentation is available in `API_DOCUMENTATION.md`

## Provider Configuration

The backend is configured to work with the following AI providers:
- OpenAI (GPT-4)
- Meta (LLaMA)
- Mistral AI
- Google (Gemini)
- Microsoft (Copilot)
- DeepSeek

## Database Integration

Currently using in-memory storage for development. For production deployment:
1. Update `database/db.js` to connect to your preferred database (MongoDB, PostgreSQL, etc.)
2. Implement the database methods with actual database queries

## Troubleshooting

- If the server won't start, ensure all dependencies are installed
- Check that the port (default 5000) is not already in use
- Verify your environment variables are set correctly

## Next Steps

When you have the API keys for the various AI providers:
1. Add them to the `.env` file
2. Update the provider configurations in `middleware/ai-providers.js`
3. Test the actual API connections