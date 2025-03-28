import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response.decorator';
import { Role } from '@/common/decorators/roles.decorator';
import { ROLE } from '@/common/enums/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
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
@UseGuards(JwtAuthGuard, RoleGuard)
export class VariantController {
  constructor(private readonly variantService: VariantService) { }

  @Post()
  @Role(ROLE.ADMIN)
  @ResponseMessage('Tạo biến thể thành công')
  @ApiOperation({ summary: 'Tạo biến thể mới' })
  @ApiResponse({ status: 201, description: 'Biến thể đã được tạo' })
  async create(@Body() createVariantDto: CreateVariantDto): Promise<Variant> {
    return this.variantService.create(createVariantDto);
  }


  @Public()
  @Get('product/:productId')
  @ResponseMessage('Lấy danh sách biến thể của sản phẩm thành công')
  @ApiOperation({ summary: 'Lấy các biến thể của sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách biến thể' })
  async findByProduct(@Param('productId') productId: string): Promise<Variant[]> {
    return this.variantService.findByProduct(productId);
  }

  @Patch(':id')
  @Role(ROLE.ADMIN)
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
  @Role(ROLE.ADMIN)
  @ResponseMessage('Xóa biến thể thành công')
  @ApiOperation({ summary: 'Xóa biến thể' })
  @ApiResponse({ status: 200, description: 'Biến thể đã được xóa' })
  async remove(@Param('id') id: string): Promise<{ success: boolean }> {
    return this.variantService.remove(id);
  }

  @Patch(':id/stock')
  @Role(ROLE.ADMIN)
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