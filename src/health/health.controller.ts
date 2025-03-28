// src/health/health.controller.ts
import { Public } from '@/common/decorators/public.decorator';
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, MongooseHealthIndicator } from '@nestjs/terminus';
import { GeminiHealthIndicator } from './provide/gemini.health';
import { RedisHealthIndicator } from './provide/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: MongooseHealthIndicator,
    private gemini: GeminiHealthIndicator,
    private redis: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  check() {
    console.log("Health check endpoint hit");
    
    return this.health.check([
      () => this.redis.isHealthy('redis'),
      () => this.db.pingCheck('database'),
      () => this.gemini.isHealthy('gemini_api'),
    ]);
  }
}