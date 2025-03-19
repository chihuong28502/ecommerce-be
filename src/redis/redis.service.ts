import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) { }

  async getCache<T>(key: string): Promise<T | null> {
    const cachedData = await this.redisClient.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async setCache<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.redisClient.set(key, JSON.stringify(value),'EX',ttl);
  }

  async clearCache(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  private async scanKeys(pattern: string, count: number = 100): Promise<string[]> {
    let cursor = '0';
    let allKeys: string[] = [];

    do {
      const [newCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', count);
      allKeys = [...allKeys, ...keys];
      cursor = newCursor;
    } while (cursor !== '0'); // Continue scanning until the cursor returns to '0'

    return allKeys;
  }

  private async deleteKeys(keys: string[]): Promise<void> {
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }

  // Function to clear the product page cache
  async clearProductsPageCache(): Promise<void> {
    try {
      const keys = await this.scanKeys('products_page_*'); // Get all product page keys
      await this.deleteKeys(keys); // Delete the found keys
    } catch (error) {
      console.error('Error clearing product page cache:', error);
    }
  }
  async clearAllCacheReviews(): Promise<void> {
    try {
      const reviewKeys = await this.scanKeys('reviews_*'); // Match all review-related keys
      await this.deleteKeys(reviewKeys); // Delete all the found keys
    } catch (error) {
      console.error('Error clearing review cache:', error);
    }
  }
}
