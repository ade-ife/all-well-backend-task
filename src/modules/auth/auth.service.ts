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
      const userExists = await this.userService.getUserByUserID(
        data.userID
      );

      let user;

      if (!userExists) {
        user = await this.userService.createUser(data);
      } else {
        Logger.log('User id already exist');
        throw new HttpException(
          `User with userId: ${data.userID} already exist for this profile.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      console.log(user.userId)
      // Sending a welcome email
    await this.mailjetService.sendEmail(
        "yevodox980@jthoven.com",
      `${user.userId}`,
        'Welcome to Our Platform',
        'Dear user, welcome to our platform! We are happy to have you on board.',
        '<h3>Dear user, welcome to our platform!</h3><p>We are happy to have you on board.</p>',
      );

      return { user };
    } catch (e) {

      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(payload: LoginDto) {
    const user = await this.userService.getUserByUserID(
      payload.userId,
    );
    console.log(payload.userId)
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

    const resetUrl = `${process.env.RESET_URL}=${token}`;
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


    console.log('Token:', token);
    console.log('Current date:', new Date(Date.now()));

    const user = await this.userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gte: new Date(Date.now()) },
    }).exec()


    console.log(user)

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
