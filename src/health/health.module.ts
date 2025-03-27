// src/health/health.module.ts
import { ApiKeyModule } from '@/api-key/api-key.module';
import { GeminiModule } from '@/gemini/gemini.module';
import { RedisModule } from '@/redis/redis.module';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { GeminiHealthIndicator } from './provide/gemini.health';
import { RedisHealthIndicator } from './provide/redis.health';

@Module({
  imports: [TerminusModule, RedisModule, GeminiModule,ApiKeyModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, GeminiHealthIndicator]
})
export class HealthModule { }