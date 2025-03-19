import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiKeyModule } from 'src/api-key/api-key.module';
import { GeminiController } from './gemini.controller';
import { GeminiService } from './gemini.service';
import { PromptService } from './prompt.service';

@Module({
  imports: [ConfigModule, ApiKeyModule],
  controllers: [GeminiController],
  providers: [GeminiService, PromptService],
  exports: [GeminiService, PromptService],
})
export class GeminiModule {}
