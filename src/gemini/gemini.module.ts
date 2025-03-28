import { ApiKeyModule } from '@/api-key/api-key.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiService } from './gemini.service';
import { PromptService } from './prompt.service';

@Module({
  imports: [ConfigModule, ApiKeyModule],
  controllers: [],
  providers: [GeminiService, PromptService],
  exports: [GeminiService, PromptService],
})
export class GeminiModule {}
