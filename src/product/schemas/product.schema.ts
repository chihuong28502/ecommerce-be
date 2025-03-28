import { Category } from '@/category/schemas/category.schema';
import { GenderEnum, ProductTypeEnum } from '@/common/enums/enums-product/enums-product';
import { Review } from '@/product/schemas/review.schema';
import { Variant } from '@/product/schemas/variant.schema';
import { User } from '@/user/schemas/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
})
export class Product extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
    default: () => `PROD-${uuidv4().split('-')[0].toUpperCase()}`
  })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0 })
  discountPrice?: number;

  @Prop({ type: [String], required: true })
  images: string[];

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Category;

  @Prop({
    type: String,
    enum: GenderEnum,
    required: true
  })
  gender: string;

  @Prop({
    type: String,
    enum: ProductTypeEnum,
    required: true
  })
  productType: string;

  @Prop([String])
  material?: string[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Variant' }],
    default: []
  })
  variants: Variant[];

  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Review' }],
    default: []
  })
  reviews: Review[];

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isNew: boolean;

  @Prop({ default: false })
  isBestseller: boolean;

  @Prop({ default: false })
  isOnSale: boolean;

  @Prop({ default: 0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  numReviews: number;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User'
  })
  createdBy: User;

  @Prop()
  seoTitle?: string;

  @Prop()
  seoDescription?: string;

  @Prop()
  seoKeywords?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Indexes
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ code: 1 }, { unique: true });
ProductSchema.index({ category: 1 });
ProductSchema.index({ gender: 1 });
ProductSchema.index({ productType: 1 });
ProductSchema.index({ isFeatured: 1 });

// Virtual to calculate total stock
ProductSchema.virtual('totalStock').get(function () {
  return this.variants.reduce((total, variant) => total + variant.stock, 0);
});

// Virtual to check if product has stock
ProductSchema.virtual('hasStock').get(function () {
  return this.variants.some(variant => variant.stock > 0);
});