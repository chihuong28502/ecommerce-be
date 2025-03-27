import { GenderEnum, ProductTypeEnum } from '@/enums/enums-product/enums-product';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator';

export class DiscountDto {
  @ApiProperty({ description: 'Phần trăm giảm giá' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  percentage: number;

  @ApiProperty({ description: 'Ngày bắt đầu giảm giá' })
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ description: 'Ngày kết thúc giảm giá' })
  @IsNotEmpty()
  endDate: Date;

  @ApiProperty({ description: 'Lý do giảm giá' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ description: 'Trạng thái kích hoạt' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Tên sản phẩm' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mô tả sản phẩm' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Giá sản phẩm' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({ description: 'Giá sau khi giảm' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPrice?: number;

  @ApiProperty({ description: 'Hình ảnh sản phẩm' })
  @IsArray()
  @IsNotEmpty()
  images: string[];

  @ApiProperty({ description: 'ID danh mục' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Giới tính', enum: GenderEnum })
  @IsEnum(GenderEnum)
  @IsNotEmpty()
  gender: string;

  @ApiProperty({ description: 'Loại sản phẩm', enum: ProductTypeEnum })
  @IsEnum(ProductTypeEnum)
  @IsNotEmpty()
  productType: string;

  @ApiProperty({ description: 'Chất liệu' })
  @IsArray()
  @IsOptional()
  material?: string[];

  @ApiProperty({ description: 'Sản phẩm nổi bật' })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ description: 'Sản phẩm mới' })
  @IsBoolean()
  @IsOptional()
  isNew?: boolean;

  @ApiProperty({ description: 'Sản phẩm bán chạy' })
  @IsBoolean()
  @IsOptional()
  isBestseller?: boolean;

  @ApiProperty({ description: 'Sản phẩm đang giảm giá' })
  @IsBoolean()
  @IsOptional()
  isOnSale?: boolean;

  // @ApiProperty({ description: 'Thông tin giảm giá' })
  // @ValidateNested()
  // @Type(() => DiscountDto)
  // @IsOptional()
  // discount?: DiscountDto;

  @ApiProperty({ description: 'Các tag sản phẩm' })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'Tiêu đề SEO' })
  @IsString()
  @IsOptional()
  seoTitle?: string;

  @ApiProperty({ description: 'Mô tả SEO' })
  @IsString()
  @IsOptional()
  seoDescription?: string;

  @ApiProperty({ description: 'Từ khóa SEO' })
  @IsString()
  @IsOptional()
  seoKeywords?: string;
}

export class CreateVariantDto {
  @ApiProperty({ description: 'ID sản phẩm' })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiProperty({ description: 'Kích cỡ sản phẩm' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ description: 'Màu sắc sản phẩm' })
  @IsString()
  @IsNotEmpty()
  color: string;

  @ApiProperty({ description: 'Màu sắc sản phẩm colorHex' })
  @IsString()
  @IsNotEmpty()
  colorHex: string;

  @ApiProperty({ description: 'Số lượng tồn kho' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Hình ảnh của biến thể' })
  @IsArray()
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: 'Trạng thái khả dụng' })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiProperty({ description: 'Giá biến thể' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'Giá giảm của biến thể' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPrice?: number;
}

export class UpdateProductDto extends CreateProductDto {}
export class UpdateVariantDto extends CreateVariantDto {}