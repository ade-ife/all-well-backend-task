import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as _ from 'lodash';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;



@Schema({ timestamps: true })
export class User {


  @Prop({ trim: true, lowercase: true, required: true })
  userId: string;

  @Prop({ trim: true, required: true })
  password: string;

  @Prop()
  resetPasswordToken?: string;

  @Prop()
  resetPasswordExpires?: Date;

  isValidPassword: (password: string) => Promise<boolean>;
}

export const UserSchema: MongooseSchema<UserDocument> =
  SchemaFactory.createForClass(User);

UserSchema.index(
  {
    userId: 1,
    type: 1,
  },
  {
    unique: true,
  },
);

UserSchema.methods = {
  async isValidPassword(password): Promise<boolean> {
    try {
      const storedPassword = this.password || '';
      return bcrypt.compare(password, storedPassword);
    } catch (err) {
      throw new Error(err);
    }
  },

  toJSON(): Record<string, any> {
    const userObject = this.toObject();
    return _.omit(userObject, ['password']);
  },
};
UserSchema.pre<UserDocument>('save', async function (next) {
  try {
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

export const UserSchemaDefinition = { name: User.name, schema: UserSchema };
