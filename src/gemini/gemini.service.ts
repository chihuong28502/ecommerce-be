import { ApiKey } from '@/api-key/schemas/api-key.schema';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';
import { ApiKeyService } from '../api-key/api-key.service';
import { geminiConfig } from '../config/gemini.config';

interface CompletionOptions {
  maxTokens?: number;
  model?: string;
  system?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private apiKeys: ApiKey[] = [];
  private currentKey: string | null = null;
  private client: GoogleGenerativeAI | null = null;
  private lastError: Error | null = null;

  constructor(private readonly apiKeyService: ApiKeyService) { }

  async initialize() {
    if (!this.client) {
      await this.setClient();
    }
    return this;
  }

  private async setClient() {
    try {
      this.apiKeys = await this.apiKeyService.getNextApiKey();
      this.logger.log(`Available API keys: ${this.apiKeys.length}`);

      if (!this.apiKeys?.length) {
        throw new Error('No valid API keys available');
      }

      this.currentKey = this.apiKeys[0].key;
      if (!this.currentKey) {
        throw new Error('API key is undefined');
      }

      await this.apiKeyService.updateApiKeyStatus(this.currentKey, false);
      this.client = new GoogleGenerativeAI(this.currentKey);
      this.logger.log(`Initialized with API key: ${this.currentKey}`);
    } catch (error) {
      if (this.currentKey) {
        await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
      }
      this.logger.error('Error initializing client:', error);
      throw error;
    }
  }

  private async switchKeyOnError() {
    try {
      const currentError = this.lastError?.message.toLowerCase() || '';
      const isLimitError =
        currentError.includes('limit') ||
        currentError.includes('429') ||
        currentError.includes('api key') ||
        currentError.includes('authentication');

      if (!isLimitError && this.currentKey) {
        await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
      }

      this.logger.warn('Switching to new API key...');

      // Reset keys if possible
      for (const key of this.apiKeys) {
        await this.apiKeyService.checkAndResetStatus(key.key);
      }

      const availableKeys = await this.apiKeyService.getNextApiKey();
      if (!availableKeys?.length) {
        throw new Error('No active API keys available');
      }

      for (const key of availableKeys) {
        try {
          await this.apiKeyService.checkRateLimits(key.key);

          this.currentKey = key.key;
          await this.apiKeyService.updateApiKeyStatus(this.currentKey, false);

          this.client = new GoogleGenerativeAI(this.currentKey);
          this.logger.warn(`Switched to new API key: ${this.currentKey}`);
          return;
        } catch (error) {
          this.logger.warn(`Key ${key.key} not available: ${error.message}`);
          continue;
        }
      }

      throw new Error('No valid API keys available for switch');
    } catch (error) {
      this.logger.error('Error switching API key:', error);
      throw error;
    }
  }

  private async trackApiUsage(result: any) {
    try {
      if (!this.currentKey) return;

      const tokenCount = this.estimateTokenCount(result);
      await this.apiKeyService.trackUsage(this.currentKey, tokenCount);

      const tokenStatus = await this.apiKeyService.checkCurrentTokens(
        this.currentKey,
      );
      if (tokenStatus.remainingTokens < 1000) {
        this.lastError = new Error('Token count low');
        await this.switchKeyOnError();
      }
    } catch (error) {
      this.logger.error('Error tracking API usage:', error);
      if (error.message.includes('limit')) {
        this.lastError = error;
        await this.switchKeyOnError();
      }
    }
  }

  private estimateTokenCount(text: any): number {
    if (typeof text !== 'string') {
      if (text.content) text = text.content;
      else return 0;
    }
    return Math.ceil(text.length / 4);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private static getRetryDelay(attempt: number): number {
    return Math.min(
      geminiConfig.errors.retryDelay * Math.pow(2, attempt),
      30000,
    );
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < geminiConfig.errors.maxRetries; attempt++) {
      if (attempt > 0) {
        await GeminiService.sleep(GeminiService.getRetryDelay(attempt));
      }

      try {
        // Verify rate limits before each attempt
        if (this.currentKey) {
          await this.apiKeyService.checkRateLimits(this.currentKey);
        }

        this.logger.debug(`Attempt ${attempt + 1}`);
        const result = await operation();

        await this.trackApiUsage(result);
        if (this.currentKey) {
          await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
        }

        return result;
      } catch (error) {
        this.lastError = error;
        this.logger.error(`Error in attempt ${attempt + 1}:`, error.message);

        const isLimitError =
          error.message.includes('429') ||  // Rate limit
          error.message.includes('500') ||  // Internal server error
          error.message.includes('API key') ||
          error.message.includes('rate') ||
          error.message.includes('undefined') ||
          error.message.includes('Internal Server Error') ||
          error.message.includes('authentication') ||
          error.message.includes('limit') ||
          error.message.includes('Expected \',\' or \']\' after array element in JSON');

        if (isLimitError) {
          await this.switchKeyOnError();
          continue;
        }

        if (this.currentKey) {
          await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
        }

        if (attempt === geminiConfig.errors.maxRetries - 1) {
          throw this.handleApiError(error);
        }
      }
    }

    throw this.handleApiError(
      this.lastError || new Error('Max retries exceeded'),
    );
  }

  private handleApiError(error: Error): Error {
    const errorMessages: Record<string, string> = {
      AUTHENTICATION_ERROR: geminiConfig.errors.messages.authentication,
      RATE_LIMIT_EXCEEDED: geminiConfig.errors.messages.rateLimit,
      INTERNAL_ERROR: geminiConfig.errors.messages.server,
    };

    const errorType = Object.keys(errorMessages).find((type) =>
      error.message.toLowerCase().includes(type.toLowerCase()),
    );

    const errorMessage = errorType
      ? errorMessages[errorType]
      : `Gemini API error: ${error.message}`;

    this.logger.error(errorMessage);
    return new Error(errorMessage);
  }

  async getCompletion(prompt: string, options: CompletionOptions = {}) {
    if (!prompt) throw new Error('Prompt is required');

    const {
      maxTokens = geminiConfig.defaults.max_tokens,
      model = geminiConfig.models.default,
    } = options;

    await this.initialize();

    try {
      return await this.executeWithRetry(async () => {
        if (!this.client) throw new Error('Client not initialized');

        const genModel = this.client.getGenerativeModel({ model });
        const jsonPrompt = ` 
          ${prompt}
          INSTRUCTIONS:
          - No markdown formatting
          - No code blocks, no \`\`\`json tags
        `;

        const response = await genModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: jsonPrompt }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        });

        const result = await response.response;
        if (!result?.text()) {
          throw new Error('Invalid response format from Gemini API');
        }

        return result
          .text()
          .trim()
          .replace(/^```json\s*/g, '')
          .replace(/\s*```$/g, '')
          .trim();
      });
    } catch (error) {
      if (this.currentKey) {
        const isLimitError =
          error.message.includes('429') ||
          error.message.includes('API key') ||
          error.message.includes('authentication') ||
          error.message.includes('limit');

        if (!isLimitError) {
          await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
        }
      }
      throw new Error(`Error generating content: ${error.message}`);
    }
  }

  async generateResponse(
    messages: Array<{ role: string; content: string }>,
    options: CompletionOptions = {},
  ) {
    if (!messages?.length) {
      throw new Error('Valid messages array is required');
    }

    const {
      maxTokens = geminiConfig.defaults.max_tokens,
      model = geminiConfig.models.default,
      system,
    } = options;

    await this.initialize();

    try {
      return await this.executeWithRetry(async () => {
        if (!this.client) throw new Error('Client not initialized');

        const genModel = this.client.getGenerativeModel({ model });
        const chat = genModel.startChat({
          history: [],
          generationConfig: {
            maxOutputTokens: maxTokens,
          },
        });

        if (system) {
          await chat.sendMessage(
            `Context for your responses: ${system}\n\n` +
            `Remember to follow these instructions for all responses.`,
          );
        }

        let lastResponse;
        for (const message of messages) {
          lastResponse = await chat.sendMessage(message.content);
        }

        if (!lastResponse?.response?.text()) {
          throw new Error('Invalid response format from Gemini API');
        }

        return {
          success: true,
          content: lastResponse.response.text(),
        };
      });
    } catch (error) {
      if (this.currentKey) {
        const isLimitError =
          error.message.includes('429') ||
          error.message.includes('API key') ||
          error.message.includes('authentication') ||
          error.message.includes('limit');

        if (!isLimitError) {
          await this.apiKeyService.updateApiKeyStatus(this.currentKey, true);
        }
      }
      throw new Error(`Error generating response: ${error.message}`);
    }
  }
}
