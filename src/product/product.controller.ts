import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ResponseMessage } from '@/common/decorators/response.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { ROLE } from '@/common/enums/role.enum';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './schemas/product.schema';
import { ProductService } from './service/product.service';

@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Tạo sản phẩm thành công')
  @ApiOperation({ summary: 'Tạo sản phẩm mới' })
  @ApiResponse({ status: 201, description: 'Sản phẩm đã được tạo' })
  async create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: any
  ): Promise<Product> {
    return this.productService.create(createProductDto, user);
  }

  @Get()
  @ResponseMessage('Lấy danh sách sản phẩm thành công')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách sản phẩm' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'productType', required: false, type: String })
  async findAll(
    @Query() query: any
  ): Promise<Product[]> {
    return this.productService.findAll(query);
  }


  @Get(':id')
  @ResponseMessage('Lấy chi tiết sản phẩm thành công')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo ID' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productService.findOne(id);
  }

  @Get('slug/:slug')
  @ResponseMessage('Lấy chi tiết sản phẩm theo slug thành công')
  @ApiOperation({ summary: 'Lấy chi tiết sản phẩm theo slug' })
  @ApiResponse({ status: 200, description: 'Chi tiết sản phẩm' })
  async findBySlug(@Param('slug') slug: string): Promise<Product> {
    return this.productService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Cập nhật sản phẩm thành công')
  @ApiOperation({ summary: 'Cập nhật sản phẩm' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được cập nhật' })
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: any
  ): Promise<Product> {
    return this.productService.update(id, updateProductDto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Xóa sản phẩm thành công')
  @ApiOperation({ summary: 'Xóa sản phẩm' })
  @ApiResponse({ status: 200, description: 'Sản phẩm đã được xóa' })
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get(":id/products")
  async getProductsByCategory(@Param("id") id: string) {
    return this.productService.getProductsByCategory(id);
  }
}