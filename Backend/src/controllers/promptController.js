const promptService = require('../services/promptService');

exports.submitPrompt = async (req, res, next) => {
  try {
    const { sessionId, prompt, providers, context } = req.body;
    
    if (!sessionId || !prompt) {
      return res.status(400).json({ 
        error: 'sessionId and prompt are required' 
      });
    }
    
    console.log(`\n>>> Submitting prompt to providers for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    console.log(`>>> Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    console.log(`>>> Target providers: ${(providers || []).join(', ') || 'all enabled'}`);
    
    const session = await promptService.submitPrompt(
      sessionId,
      prompt,
      providers,
      context
    );
    
    if (!session) {
      console.log(`>>> Error: Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`>>> Prompt submitted successfully to session: ${sessionId}`);
    console.log(`>>> Processing started for providers: ${session.enabledProviders.join(', ')}`);
    console.log(`>>> Current prompt: ${session.currentPrompt.substring(0, 50)}...\n`);
    
    res.json(session);
  } catch (error) {
    console.error('Error submitting prompt:', error.message);
    next(error);
  }
};