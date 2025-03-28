import { Transform } from 'class-transformer';
import { IsBoolean, IsMongoId, IsNumber, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @MinLength(2, { message: 'Tên danh mục phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Tên danh mục không được quá 100 ký tự' })
  name: string;


  @IsString()
  @IsOptional()
  @MaxLength(500, { message: 'Mô tả không được quá 500 ký tự' })
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsMongoId()
  @IsOptional()
  parentCategory?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  level?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  order?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  showInMenu?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  showInHome?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Meta title không được quá 100 ký tự' })
  metaTitle?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200, { message: 'Meta description không được quá 200 ký tự' })
  metaDescription?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100, { message: 'Meta keywords không được quá 100 ký tự' })
  metaKeywords?: string;
}

export class UpdateCategoryDto extends CreateCategoryDto {

  @IsString()
  @MinLength(2, { message: 'Slug phải có ít nhất 2 ký tự' })
  @MaxLength(100, { message: 'Slug không được quá 100 ký tự' })
  slug: string;
}

export class FilterCategoryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsMongoId()
  @IsOptional()
  parentCategory?: string;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  showInMenu?: boolean;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  showInHome?: boolean;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  level?: number;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 1)
  page?: number = 1;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10) || 10)
  limit?: number = 10;

  @IsString()
  @IsOptional()
  sortBy?: string = 'order';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}

export class CategoryResponseDto {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  parentCategory?: string;
  level: number;
  order: number;
  isActive: boolean;
  showInMenu: boolean;
  showInHome: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  createdAt: Date;
  updatedAt: Date;
}