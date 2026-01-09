import { normalizeResponse } from "../utils/normalizer.js";
import { withErrorHandling, formatErrorMessage } from "../utils/errorHandler.js";

import { callGPT } from "./gpt.service.js";
import { callGemini } from "./gemini.service.js";
import { callMistral } from "./mistral.service.js";
import { callGrok } from "./grok.service.js";

/**
 * Wrap providers with retry + timeout protection
 */
const providers = [
  {
    name: "GPT",
    fn: withErrorHandling(callGPT, { retries: 2, timeout: 8000 })
  },
  {
    name: "Gemini",
    fn: withErrorHandling(callGemini, { retries: 2, timeout: 8000 })
  },
  {
    name: "Mistral",
    fn: withErrorHandling(callMistral, { retries: 2, timeout: 8000 })
  },
  {
    name: "Grok",
    fn: withErrorHandling(callGrok, { retries: 2, timeout: 8000 })
  }
];

/**
 * Main orchestration logic
 * @param {string} prompt
 * @returns {Array} normalized responses
 */
export const orchestratePrompt = async (prompt) => {
  const tasks = providers.map(async ({ name, fn }) => {
    const startTime = Date.now();

    try {
      const output = await fn(prompt);
      const latency = Date.now() - startTime;

      return normalizeResponse({
        provider: name,
        output,
        latency,
        status: "success"
      });
    } catch (error) {
      const latency = Date.now() - startTime;

      return normalizeResponse({
        provider: name,
        output: formatErrorMessage(error),
        latency,
        status: "error"
      });
    }
  });

  return Promise.all(tasks);
};
