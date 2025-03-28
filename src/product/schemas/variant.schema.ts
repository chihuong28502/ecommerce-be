import { Product } from '@/product/schemas/product.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

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
export class Variant extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Product',
    required: true
  })
  product: Product;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true })
  color: string;

  @Prop({type: String, required: true})
  colorHex: string;

  @Prop({
    required: true,
    default: 0,
    min: 0
  })
  stock: number;

  @Prop({
    type: [String],
    default: []
  })
  images: string[];

  @Prop({
    default: true
  })
  isAvailable: boolean;

  @Prop({
    default: 0,
    min: 0
  })
  soldCount: number;

  @Prop({
    type: Number,
    default: null,
    min: 0
  })
  price: number | null;

  @Prop({
    type: Number,
    default: null,
    min: 0
  })
  discountPrice: number | null;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);

// Indexes for performance optimization
VariantSchema.index({ product: 1 });
VariantSchema.index({ size: 1 });
VariantSchema.index({ color: 1 });
VariantSchema.index({ isAvailable: 1 });