import {
  Body,
  Controller,
  Get,
  Logger,
  Post
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { CreateApiKeyDto, CreateArrApiKeyDto } from './dto/create-api-key.dto';

@ApiTags('api-keys')
@Controller('api-keys')
export class ApiKeyController {
  private readonly logger = new Logger(ApiKeyController.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}
  //chỉ admin mới dc thêm apiKey
  @Post('/create')
  @ApiOperation({ summary: 'Create new API key' })
  @ApiResponse({ status: 201, description: 'The API key has been created.' })
  async create(@Body() createApiKeyDto: CreateApiKeyDto) {
    this.logger.log(`Creating new API key`);
    return this.apiKeyService.create(createApiKeyDto);
  }

  @Post('/create-multi')
  @ApiOperation({ summary: 'Create multi new API key' })
  @ApiResponse({ status: 201, description: 'The API key has been created.' })
  async createMulti(@Body() createArrApiKeyDto: CreateArrApiKeyDto) {
    this.logger.log(`Creating new API key`);
    return this.apiKeyService.createMulti(createArrApiKeyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all API keys' })
  async findAll() {
    return this.apiKeyService.findAll();
  }
}
