//config gemini api
export const geminiConfig = {
  models: {
    default: 'gemini-1.5-flash',
  },
  defaults: {
    max_tokens: 8192, // limit max token
  },
  errors: {
    maxRetries: 5,
    retryDelay: 1000,
    messages: {
      authentication: 'Invalid API key or authentication failed',
      rateLimit: 'Rate limit exceeded. Please try again later',
      server: 'Gemini API internal error',
    },
  },
};
