import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class ApiKey extends Document {
  @Prop({ required: true, index: true })
  key: string;

  @Prop({ default: true, index: true })
  status: boolean;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({
    type: String,
    enum: ['MINUTE', 'DAILY', 'TOKEN', null],
    default: null,
    index: true,
  })
  limitType: string | null;

  @Prop({ type: Date, default: null })
  lastUsedAt: Date | null;

  @Prop({ type: Date, default: null })
  lastCheckedAt: Date | null;

  @Prop([
    {
      timestamp: { type: Date, index: true },
      count: { type: Number, default: 0 },
    },
  ])
  minuteRequests: Array<{
    timestamp: Date;
    count: number;
  }>;

  @Prop([
    {
      date: { type: Date, index: true },
      count: { type: Number, default: 0 },
      tokenCount: { type: Number, default: 0 },
    },
  ])
  dailyRequests: Array<{
    date: Date;
    count: number;
    tokenCount: number;
  }>;
}

export const ApiKeySchema = SchemaFactory.createForClass(ApiKey);

// Indexes
ApiKeySchema.index({ status: 1, limitType: 1, usageCount: 1 });
ApiKeySchema.index({ 'minuteRequests.timestamp': 1 });
ApiKeySchema.index({ 'dailyRequests.date': 1 });
