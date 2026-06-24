import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { randomUUID } from 'crypto';

@Schema({
  timestamps: true,
  collection: 'categories',
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
export class Category {
  @Prop({ type: String, default: randomUUID })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  slug: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  icon: string;

  @Prop({ type: Number, default: 0 })
  feedbackCount: number;

  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type CategoryDocument = Category & {
  save(): Promise<CategoryDocument>;
  populate(path: string | any): Promise<CategoryDocument>;
};
export const CategorySchema: MongooseSchema = SchemaFactory.createForClass(Category);
