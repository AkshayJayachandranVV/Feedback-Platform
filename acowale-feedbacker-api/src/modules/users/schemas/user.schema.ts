import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { UserRole } from '../../../common/decorators/roles.decorator';
import { randomUUID } from 'crypto';

@Schema({
  timestamps: true,
  collection: 'users',
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
export class User {
  @Prop({ type: String, default: randomUUID })
  _id: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.ADMIN })
  role: UserRole;

  @Prop({ type: String, default: null })
  refreshTokenHash: string | null;

  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = User & {
  save(): Promise<UserDocument>;
  populate(path: string | any): Promise<UserDocument>;
};
export const UserSchema: MongooseSchema = SchemaFactory.createForClass(User);
