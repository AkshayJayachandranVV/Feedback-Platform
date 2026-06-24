import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'crypto';
import { Category } from '../../categories/schemas/category.schema';

export enum FeedbackStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  ARCHIVED = 'archived',
}

@Schema({
  timestamps: true,
  collection: 'feedback',
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Feedback {
  @Prop({ type: String, default: randomUUID })
  _id: string;

  @Prop({ required: true })
  submitterName: string;

  @Prop({ required: true })
  submitterEmail: string;

  @Prop({ type: String, required: true, ref: 'Category' })
  categoryId: string;

  @Prop({ type: Number, default: 5 })
  rating: number;

  @Prop({ type: String, required: true })
  comment: string;

  @Prop({ type: String, enum: FeedbackStatus, default: FeedbackStatus.PENDING })
  status: FeedbackStatus;

  @Prop({ type: String, default: null })
  ipAddress: string;

  @Prop({ type: String, default: null })
  userAgent: string;

  id: string;
  createdAt?: Date;
  updatedAt?: Date;

  // Populated virtual category reference
  category?: Category;
}

export type FeedbackDocument = Feedback & {
  save(): Promise<FeedbackDocument>;
  populate(path: string | any): Promise<FeedbackDocument>;
};
export const FeedbackSchema: MongooseSchema = SchemaFactory.createForClass(Feedback);

// Declare database indexes for optimized query lookups
FeedbackSchema.index({ categoryId: 1 });
FeedbackSchema.index({ status: 1 });
FeedbackSchema.index({ createdAt: -1 });

// Set up virtual category field referencing the Category collection
FeedbackSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});
