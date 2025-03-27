import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { CreateApiKeyDto, CreateArrApiKeyDto } from './dto/create-api-key.dto';
import { ApiKey } from './schemas/api-key.schema';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);

  private static readonly LIMITS = {
    MINUTE_LIMIT: 14,
    DAILY_LIMIT: 1490,
    TOKEN_LIMIT: 1000000,
  };

  constructor(
    @InjectModel(ApiKey.name)
    private readonly apiKeyModel: Model<ApiKey>,
  ) { }

  async getNextApiKey(): Promise<ApiKey[]> {
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60 * 1000);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Clean up old records
    await this.apiKeyModel.updateMany(
      {},
      {
        $pull: {
          minuteRequests: { timestamp: { $lt: minuteAgo } },
          dailyRequests: { date: { $lt: startOfDay } },
        },
      },
    );

    // Reset timed out keys
    const inactiveKeys = await this.apiKeyModel.find({ status: false });
    for (const key of inactiveKeys) {
      await this.checkAndResetStatus(key.key);
    }

    // Get available keys
    const allKeys = await this.apiKeyModel.find().sort({ usageCount: 1 });

    for (const key of allKeys) {
      try {
        await this.checkRateLimits(key.key);
        await this.updateApiKeyStatus(key.key, false);
        return [key];
      } catch (error) {
        this.logger.warn(`Key ${key.key} not available: ${error.message}`);
        continue;
      }
    }

    throw new Error('No available API keys found');
  }

  async checkRateLimits(apiKey: string): Promise<boolean> {
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60 * 1000);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const result = await this.apiKeyModel.aggregate([
      { $match: { key: apiKey } },
      {
        $addFields: {
          currentMinuteCount: {
            $size: {
              $filter: {
                input: '$minuteRequests',
                as: 'req',
                cond: { $gte: ['$$req.timestamp', minuteAgo] },
              },
            },
          },
          currentDailyRequest: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$dailyRequests',
                  as: 'req',
                  cond: { $eq: ['$$req.date', startOfDay] },
                },
              },
              0,
            ],
          },
        },
      },
    ]);

    if (!result.length) throw new Error('API key not found');
    const stats = result[0];

    if (stats.currentMinuteCount >= ApiKeyService.LIMITS.MINUTE_LIMIT) {
      await this.updateApiKeyStatus(apiKey, false, 'MINUTE');
      throw new Error('Minute rate limit exceeded');
    }

    const dailyCount = stats.currentDailyRequest?.count || 0;
    if (dailyCount >= ApiKeyService.LIMITS.DAILY_LIMIT) {
      await this.updateApiKeyStatus(apiKey, false, 'DAILY');
      throw new Error('Daily request limit exceeded');
    }

    const tokenCount = stats.currentDailyRequest?.tokenCount || 0;
    if (tokenCount >= ApiKeyService.LIMITS.TOKEN_LIMIT) {
      await this.updateApiKeyStatus(apiKey, false, 'TOKEN');
      throw new Error('Daily token limit exceeded');
    }

    return true;
  }

  async checkCurrentTokens(apiKey: string): Promise<{
    isValid: boolean;
    currentTokens: number;
    remainingTokens: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    const result = await this.apiKeyModel.aggregate([
      { $match: { key: apiKey } },
      {
        $addFields: {
          currentDailyRequest: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$dailyRequests',
                  as: 'req',
                  cond: { $eq: ['$$req.date', startOfDay] },
                },
              },
              0,
            ],
          },
        },
      },
    ]);

    if (!result.length) throw new Error('API key not found');

    const currentTokens = result[0].currentDailyRequest?.tokenCount || 0;

    if (currentTokens >= ApiKeyService.LIMITS.TOKEN_LIMIT) {
      await this.updateApiKeyStatus(apiKey, false, 'TOKEN');
      throw new Error('Daily token limit exceeded');
    }

    return {
      isValid: true,
      currentTokens,
      remainingTokens: ApiKeyService.LIMITS.TOKEN_LIMIT - currentTokens,
    };
  }

  async checkAndResetStatus(apiKey: string): Promise<void> {
    const key = await this.apiKeyModel.findOne({ key: apiKey });
    if (!key || key.status || !key.lastCheckedAt || !key.limitType) return;

    const now = new Date();
    const limitType = key.limitType;
    const lastChecked = new Date(key.lastCheckedAt);

    let shouldReset = false;

    switch (limitType) {
      case 'MINUTE':
        // Reset after 1 minute
        shouldReset = now.getTime() - lastChecked.getTime() >= 60 * 1000;
        break;
      case 'DAILY':
      case 'TOKEN':
        // Reset at midnight
        shouldReset = now.getDate() !== lastChecked.getDate();
        break;
    }

    if (shouldReset) {
      await this.updateApiKeyStatus(apiKey, true);
      this.logger.log(
        `Reset API key ${apiKey} after ${limitType.toLowerCase()} limit timeout`,
      );
    }
  }

  async trackUsage(apiKey: string, tokenCount = 0): Promise<void> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    await this.checkRateLimits(apiKey);

    const dailyUpdate = await this.apiKeyModel.updateOne(
      {
        key: apiKey,
        'dailyRequests.date': startOfDay,
      },
      {
        $push: {
          minuteRequests: {
            timestamp: now,
            count: 1,
          },
        },
        $inc: {
          'dailyRequests.$.count': 1,
          'dailyRequests.$.tokenCount': tokenCount,
          usageCount: 1,
        },
      },
    );

    if (dailyUpdate.modifiedCount === 0) {
      await this.apiKeyModel.updateOne(
        { key: apiKey },
        {
          $push: {
            minuteRequests: {
              timestamp: now,
              count: 1,
            },
            dailyRequests: {
              date: startOfDay,
              count: 1,
              tokenCount: tokenCount,
            },
          },
          $inc: { usageCount: 1 },
        },
      );
    }

    try {
      await this.checkRateLimits(apiKey);
    } catch (error) {
      throw new Error(`Limit exceeded after update: ${error.message}`);
    }
  }

  async updateApiKeyStatus(
    apiKey: string,
    status: boolean,
    limitType: string | null = null,
  ): Promise<ApiKey | null> {
    if (!apiKey) return null;

    const updateData: any = {
      status,
      lastCheckedAt: new Date(),
    };

    if (limitType) {
      updateData.limitType = limitType;
    } else if (status === true) {
      updateData.limitType = null;
    }

    return this.apiKeyModel.findOneAndUpdate(
      { key: apiKey },
      { $set: updateData },
      { new: true },
    );
  }

  // CRUD operations
  async create(createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    const createdApiKey = new this.apiKeyModel({
      key: createApiKeyDto.key,
      status: true,
      usageCount: 0,
      lastUsedAt: null,
      lastCheckedAt: null,
      minuteRequests: [],
      dailyRequests: [],
    });
    return createdApiKey.save();
  }
  async createMulti(createArrApiKeyDto: CreateArrApiKeyDto): Promise<ApiKey[]> {
    // Giả sử createArrApiKeyDto.keys là một mảng các chuỗi key
    const createdApiKeys = await Promise.all(
      createArrApiKeyDto.keys.map(async (key) => {
        const newApiKey = new this.apiKeyModel({
          key: key,
          status: true,
          usageCount: 0,
          lastUsedAt: null,
          lastCheckedAt: null,
          minuteRequests: [],
          dailyRequests: [],
        });
        return newApiKey.save();
      })
    );
    return createdApiKeys;
  }

  async createArrApiKeyDto(createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
    const createdApiKey = new this.apiKeyModel({
      key: createApiKeyDto.key,
      status: true,
      usageCount: 0,
      lastUsedAt: null,
      lastCheckedAt: null,
      minuteRequests: [],
      dailyRequests: [],
    });
    return createdApiKey.save();
  }

  async findAll(): Promise<ApiKey[]> {
    return this.apiKeyModel.find();
  }
}
