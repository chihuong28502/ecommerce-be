// src/health/redis.health.ts
import { RedisService } from '@/redis/redis.service';
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Kiểm tra kết nối Redis bằng cách thực hiện một lệnh đơn giản
      const client = this.redisService['redisClient'];
      await client.ping();
      
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis health check failed',
        this.getStatus(key, false)
      );
    }
  }
}