// src/health/gemini.health.ts
import { ApiKeyService } from '@/api-key/api-key.service';
import { GeminiService } from '@/gemini/gemini.service';
import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';


@Injectable()
export class GeminiHealthIndicator extends HealthIndicator {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly apiKeyService: ApiKeyService
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Kiểm tra xem có API keys nào có sẵn trong database không
      const availableKeys = await this.apiKeyService.findAll();
      
      if (!availableKeys || availableKeys.length === 0) {
        // Không có keys, nhưng có thể đây là hành vi mong muốn
        // Chúng ta có thể xem đây là "cảnh báo" thay vì "lỗi"
        return this.getStatus(key, true, { message: 'No API keys available' });
      }
      
      // Thử khởi tạo và kiểm tra kết nối
      const geminiInstance = await this.geminiService.initialize();
      
      // Nếu khởi tạo thành công, trả về trạng thái "up"
      return this.getStatus(key, true, { 
        availableKeys: availableKeys.length,
        activeStatus: availableKeys.filter(k => k.status).length
      });
    } catch (error) {
      // Nếu có lỗi, trả về trạng thái "down" với thông tin lỗi
      throw new HealthCheckError(
        'Gemini API health check failed',
        this.getStatus(key, false, { 
          message: error.message,
          timestamp: new Date().toISOString()
        })
      );
    }
  }
}