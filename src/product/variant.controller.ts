import { ResponseMessage } from '@/common/decorators/response.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CreateVariantDto, UpdateVariantDto } from './dto/product.dto';
import { Variant } from './schemas/variant.schema';
import { VariantService } from './service/variant.service';

@ApiTags('Variants')
@Controller('variants')
export class VariantController {
  constructor(private readonly variantService: VariantService) { }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  @ResponseMessage('Tạo biến thể thành công')
  @ApiOperation({ summary: 'Tạo biến thể mới' })
  @ApiResponse({ status: 201, description: 'Biến thể đã được tạo' })
  async create(@Body() createVariantDto: CreateVariantDto): Promise<Variant> {
    return this.variantService.create(createVariantDto);
  }

  @Get('product/:productId')
  @ResponseMessage('Lấy danh sách biến thể của sản phẩm thành công')
  @ApiOperation({ summary: 'Lấy các biến thể của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách biến thể' })
  async findByProduct(@Param('productId') productId: string): Promise<Variant[]> {
    return this.variantService.findByProduct(productId);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  @ResponseMessage('Cập nhật biến thể thành công')
  @ApiOperation({ summary: 'Cập nhật biến thể' })
  @ApiResponse({ status: 200, description: 'Biến thể đã được cập nhật' })
  async update(
    @Param('id') id: string,
    @Body() updateVariantDto: UpdateVariantDto
  ): Promise<Variant> {
    return this.variantService.update(id, updateVariantDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  @ResponseMessage('Xóa biến thể thành công')
  @ApiOperation({ summary: 'Xóa biến thể' })
  @ApiResponse({ status: 200, description: 'Biến thể đã được xóa' })
  async remove(@Param('id') id: string):Promise<void> {
    return this.variantService.remove(id);
  }

  @Patch(':id/stock')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  @ResponseMessage('Cập nhật tồn kho biến thể thành công')
  @ApiOperation({ summary: 'Cập nhật tồn kho biến thể' })
  @ApiResponse({ status: 200, description: 'Tồn kho biến thể đã được cập nhật' })
  async updateStock(
    @Param('id') id: string,
    @Body('quantity') quantity: number
  ): Promise<Variant> {
    return this.variantService.updateStock(id, quantity);
  }
}