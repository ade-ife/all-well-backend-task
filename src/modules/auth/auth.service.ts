import { HttpException, HttpStatus, Inject, Injectable, Logger } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { RegisterDTO } from "./dto/signup-dto";
import { LoginDto } from "./dto/login-dto";
import { MailjetService } from "../../helpers/mailjet.service";
import { UtilityService } from "../../helpers/utility.service";
import * as crypto from 'crypto';
import { ResetPasswordDto } from "./dto/resetPassword-dto";
import { User } from "../user/user.schema";
import { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {
  constructor(
    @Inject(UserService)
    private readonly userService: UserService,
    private readonly mailjetService: MailjetService,
    @Inject(UtilityService)
    private readonly utilityService: UtilityService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,

  ) {}


  async register(data: RegisterDTO) {
    try {
      const userExists = await this.userService.getUserByUserID(data.userId);

      if (userExists) {
        throw new Error(`User with userId: ${data.userId} already exists.`);
      }

      const user = await this.userService.createUser(data);

      await this.mailjetService.sendEmail(
        "yevodox980@jthoven.com",
        `${user.userId}`,
        'Welcome to Our Platform',
        'Dear user, welcome to our platform! We are happy to have you on board.',
        '<h3>Dear user, welcome to our platform!</h3><p>We are happy to have you on board.</p>',
      );

      return { user };
    } catch (e) {
      if (e.code === 11000) {
        throw new HttpException(
          `User with userId: ${data.userId} already exists.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(payload: LoginDto) {
    const user = await this.userService.getUserByUserID(
      payload.userId,
    );
    if (!user)
      throw new HttpException(
        `User with email: ${payload.userId} does not exist`,
        HttpStatus.BAD_REQUEST,
      );

    const isValid = await user.isValidPassword(payload.password);

    if (!isValid)
      throw new HttpException(
        'Incorrect email or password',
        HttpStatus.BAD_REQUEST,
      );


    const token = await this.utilityService.generateToken(
      { id: user._id },
    );
    return { user, token };
  }

  async forgotPassword(userId: string, ) {
    const user = await this.userService.getUserByUserID(
      userId
    );
    if (!user)  {
      throw new HttpException('User not found.', HttpStatus.NOT_FOUND);
    }


    const token = crypto.randomBytes(32).toString('hex');

    const tokenExpires = new Date(Date.now() + 2 * 60 * 60 * 1000);


    await this.userService.updateUser(user._id, {
      resetPasswordToken: token,
      resetPasswordExpires: tokenExpires,
    });

    const resetUrl = `${process.env.RESET_URL}?token=${token}`;
    await this.mailjetService.sendEmail(
      'yevodox980@jthoven.com',
      `${user.userId}`,
      'Reset your password',
      `Please click the link below to reset your password:\n\n${resetUrl}`,
      `<p>Please click the link below to reset your password:</p><p><a href="${resetUrl}">Reset Password</a></p>`,
    );


    return await this.utilityService.generateToken(
      { id: user._id },
      '10m',
    );
  }

  async resetPassword(payload: ResetPasswordDto): Promise<User> {
    const { token, password, confirmPassword } = payload;

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }


    const user = await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gte: new Date(Date.now()) },
    }).exec()



    if (!user) {
      throw new Error('Invalid or expired token');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    return await this.userService.update(user.userId, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

  }

}
