import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/mongoose";
import { User, UserDocument } from "./user.schema";
import { Model } from "mongoose";
import { CreateUserDto } from "./dto/create-user.dto";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

  ) {}

  async createUser(payload: CreateUserDto): Promise<UserDocument> {

    return await this.userModel.create(payload);
  }

  async getUserByUserID(userId: string): Promise<UserDocument> {
    return this.userModel.findOne({
      userId: userId,
    });
  }


  async getUserByResetToken(token: string): Promise<User | null> {
    const now = new Date();
    return await this.userModel
      .findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: now },
      })
      .exec();
  }

  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    return await this.userModel.findByIdAndUpdate(userId, updateData, { new: true }).exec();
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return await bcrypt.hash(password, salt);
  }


  async update(userId: string, user: Partial<User>): Promise<User> {
    return await this.userModel.findOneAndUpdate({ userId }, user, { new: true }).exec();
  }

}
