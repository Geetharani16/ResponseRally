const sessionService = require('../services/sessionService');
const { v4: uuidv4 } = require('uuid');

exports.createSession = async (req, res, next) => {
  try {
    console.log(`\n>>> Creating new session at ${new Date().toISOString()} <<<`);
    const session = await sessionService.createSession();
    console.log(`>>> New session created successfully with ID: ${session.id}`);
    console.log(`>>> Enabled providers: ${session.enabledProviders.join(', ')}`);
    console.log(`>>> Session created at: ${session.createdAt}\n`);
    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating session:', error.message);
    next(error);
  }
};

exports.getSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    console.log(`\n>>> Retrieving session: ${sessionId} at ${new Date().toISOString()} <<<`);
    const session = await sessionService.getSession(sessionId);
    
    if (!session) {
      console.log(`>>> Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`>>> Session retrieved successfully: ${sessionId}`);
    console.log(`>>> Active providers: ${session.enabledProviders.join(', ')}`);
    console.log(`>>> Last updated: ${session.updatedAt}\n`);
    res.json(session);
  } catch (error) {
    console.error('Error retrieving session:', error.message);
    next(error);
  }
};

exports.resetSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    console.log(`\n>>> Resetting session: ${sessionId} at ${new Date().toISOString()} <<<`);
    const session = await sessionService.resetSession(sessionId);
    
    if (!session) {
      console.log(`>>> Cannot reset - Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`>>> Session reset successfully: ${sessionId}`);
    console.log(`>>> Conversation history cleared`);
    console.log(`>>> Current prompt cleared`);
    console.log(`>>> All responses cleared\n`);
    res.json(session);
  } catch (error) {
    console.error('Error resetting session:', error.message);
    next(error);
  }
};

exports.selectResponse = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { responseId } = req.body;
    
    if (!responseId) {
      return res.status(400).json({ error: 'responseId is required' });
    }
    
    console.log(`\n>>> Selecting best response for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    console.log(`>>> Response ID selected: ${responseId}`);
    const session = await sessionService.selectResponse(sessionId, responseId);
    
    if (!session) {
      console.log(`>>> Cannot select response - Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    console.log(`>>> Response selected successfully in session: ${sessionId}`);
    console.log(`>>> Selected response ID: ${responseId}`);
    console.log(`>>> Added to conversation history\n`);
    res.json(session);
  } catch (error) {
    console.error('Error selecting response:', error.message);
    next(error);
  }
};

exports.toggleProvider = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    console.log(`\n>>> Toggling provider: ${providerId} for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    const session = await sessionService.toggleProvider(sessionId, providerId);
    
    if (!session) {
      console.log(`>>> Cannot toggle provider - Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const isEnabled = session.enabledProviders.includes(providerId);
    console.log(`>>> Provider ${providerId} ${isEnabled ? 'enabled' : 'disabled'} in session: ${sessionId}`);
    console.log(`>>> Updated active providers: ${session.enabledProviders.join(', ')}\n`);
    res.json(session);
  } catch (error) {
    console.error('Error toggling provider:', error.message);
    next(error);
  }
};

exports.retryProvider = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { providerId } = req.body;
    
    if (!providerId) {
      return res.status(400).json({ error: 'providerId is required' });
    }
    
    console.log(`\n>>> Retrying provider: ${providerId} for session: ${sessionId} at ${new Date().toISOString()} <<<`);
    const session = await sessionService.retryProvider(sessionId, providerId);
    
    if (!session) {
      console.log(`>>> Cannot retry provider - Session not found: ${sessionId}`);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const response = session.currentResponses.find(r => r.provider === providerId);
    const retryCount = response ? response.retryCount : 0;
    console.log(`>>> Provider ${providerId} retry initiated in session: ${sessionId}`);
    console.log(`>>> Retry count for ${providerId}: ${retryCount}`);
    console.log(`>>> Status updated to pending\n`);
    res.json(session);
  } catch (error) {
    console.error('Error retrying provider:', error.message);
    next(error);
  }
};