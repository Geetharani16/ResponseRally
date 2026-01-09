/**
 * Normalize AI provider responses into a common format
 * @param {Object} params
 * @returns {Object} normalized response
 */
export const normalizeResponse = ({
  provider,
  output,
  latency,
  status
}) => {
  return {
    provider: provider,                 // GPT, Gemini, Mistral, Grok
    status: status,                     // success | error
    latency: latency,                   // in milliseconds
    text: status === "success"
      ? output
      : null,
    error: status === "error"
      ? output
      : null,
    length: status === "success"
      ? output.length
      : 0,
    timestamp: new Date().toISOString()
  };
};
