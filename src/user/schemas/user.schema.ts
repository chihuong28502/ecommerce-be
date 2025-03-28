// @/modules/users/schemas/user.schema.ts
import { ROLE } from '@/common/enums/role.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, enum: ROLE, default: ROLE.USER })
  role: ROLE;

  @Prop()
  avatar?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);



