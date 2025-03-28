import { ROLE } from '@/common/enums/role.enum';
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
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(ROLE.ADMIN)
  @ResponseMessage('Tạo danh mục thành công')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  @Public()
  @ResponseMessage('Lấy danh sách danh mục thành công')
  findAll(@Query() query: any) {
    return this.categoryService.findAll(query);
  }

  @Get('tree')
  @Public()
  @ResponseMessage('Lấy cây danh mục thành công')
  getCategoryTree() {
    return this.categoryService.getCategoryTree();
  }

  @Get('menu')
  @Public()
  @ResponseMessage('Lấy danh mục menu thành công')
  getMenuCategories() {
    return this.categoryService.getMenuCategories();
  }

  @Get('home')
  @Public()
  @ResponseMessage('Lấy danh mục trang chủ thành công')
  getHomeCategories() {
    return this.categoryService.getHomeCategories();
  }

  @Get('children/:parentId')
  @Public()
  @ResponseMessage('Lấy danh mục con thành công')
  getChildCategories(@Param('parentId') parentId?: string) {
    return this.categoryService.getChildCategories(parentId);
  }

  @Get('breadcrumb/:id')
  @Public()
  @ResponseMessage('Lấy breadcrumb thành công')
  getBreadcrumb(@Param('id') id: string) {
    return this.categoryService.getBreadcrumb(id);
  }

  @Get(':id')
  @Public()
  @ResponseMessage('Lấy thông tin danh mục thành công')
  findById(@Param('id') id: string) {
    return this.categoryService.findById(id);
  }

  @Get('slug/:slug')
  @Public()
  @ResponseMessage('Lấy thông tin danh mục thành công')
  findBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Cập nhật danh mục thành công')
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN)
  @ResponseMessage('Xóa danh mục thành công')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}