import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop()
  image: string;

  @Prop()
  bannerImage: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Category' })
  parentCategory: Category;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  showInMenu: boolean;

  @Prop({ default: false })
  showInHome: boolean;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;
  
  @Prop()
  metaKeywords: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Tạo index để tối ưu truy vấn
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentCategory: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ order: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ showInMenu: 1 });
CategorySchema.index({ showInHome: 1 });

// Index phức hợp cho việc tìm kiếm danh mục hiển thị trong menu
CategorySchema.index({ isActive: 1, showInMenu: 1, order: 1 });