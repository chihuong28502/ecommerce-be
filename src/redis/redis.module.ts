import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URI');

        if (!redisUrl) {
          throw new Error('Redis URL is missing');
        }

        const redis = new Redis(redisUrl);

        redis.on('connect', () => {
          console.log('Successfully connected to Redis');
        });

        redis.on('error', (err) => {
          console.error('Redis error:', err);
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
