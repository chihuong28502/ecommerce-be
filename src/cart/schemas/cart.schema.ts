import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type CartItem = {
  productId: Types.ObjectId;  // id của sản phẩm
  variantId: Types.ObjectId;  // id của biến thể sản phẩm
  quantity: number;
};

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ required: true ,ref: 'User', type: MongooseSchema.Types.ObjectId})
  userId: string;

  @Prop({
    required: true,
    type: [{
      productId: { type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true },
      variantId: { type: MongooseSchema.Types.ObjectId, ref: 'Variant', required: true },
      quantity: { type: Number, required: true }
    }]
  })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);