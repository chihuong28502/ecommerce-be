import { CategoryModule } from '@/category/category.module';
import { Category, CategorySchema } from '@/category/schemas/category.schema';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductController } from './product.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { Review, ReviewSchema } from './schemas/review.schema';
import { Variant, VariantSchema } from './schemas/variant.schema';
import { ProductService } from './service/product.service';
import { VariantService } from './service/variant.service';
import { VariantController } from './variant.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Variant.name, schema: VariantSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
    CategoryModule,
  ],
  controllers: [ProductController, VariantController],
  providers: [ProductService, VariantService],
  exports: [ProductService, VariantService],
})
export class ProductModule { }
