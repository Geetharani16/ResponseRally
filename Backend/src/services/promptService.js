const providerService = require('./providerService');

// Placeholder for prompt service that will interface with provider service
const submitPrompt = async (sessionId, prompt, providers, context) => {
  // This function would typically coordinate between sessionService and providerService
  // For now, we'll call the provider service directly
  return await providerService.submitPrompt(sessionId, prompt, providers, context);
};

module.exports = {
  submitPrompt
};