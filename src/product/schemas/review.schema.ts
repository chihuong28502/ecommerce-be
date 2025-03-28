import { Product } from '@/product/schemas/product.schema';
import { User } from '@/user/schemas/user.schema';
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
export class Review extends Document {
  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  })
  product: Product;

  @Prop({ 
    type: MongooseSchema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  user: User;

  @Prop({ 
    required: true, 
    min: 1, 
    max: 5 
  })
  rating: number;

  @Prop({ 
    type: String, 
    default: '' 
  })
  comment: string;

  @Prop({ 
    type: [String], 
    default: [] 
  })
  images: string[];

  @Prop({ 
    default: false 
  })
  isVerifiedPurchase: boolean;

  @Prop({ 
    type: [String], 
    default: [] 
  })
  likes: string[];

  @Prop({ 
    type: [String], 
    default: [] 
  })
  replies: string[];
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Indexes for performance optimization
ReviewSchema.index({ product: 1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isVerifiedPurchase: 1 });