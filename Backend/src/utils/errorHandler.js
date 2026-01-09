/**
 * Sleep helper for retry backoff
 * @param {number} ms
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Wrap an async function with retry & timeout logic
 * @param {Function} fn - async function (API call)
 * @param {Object} options
 * @returns {Function}
 */
export const withErrorHandling = (
  fn,
  {
    retries = 2,
    timeout = 10000, // 10 seconds
    backoff = 1000   // 1 second
  } = {}
) => {
  return async (...args) => {
    let lastError;

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await Promise.race([
          fn(...args),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timeout")),
              timeout
            )
          )
        ]);
      } catch (error) {
        lastError = error;

        if (attempt <= retries) {
          await sleep(backoff * attempt); // exponential backoff
        }
      }
    }

    throw lastError;
  };
};

/**
 * Format error message for UI-safe output
 * @param {Error} error
 * @returns {string}
 */
export const formatErrorMessage = (error) => {
  return error?.message || "Unknown provider error";
};
