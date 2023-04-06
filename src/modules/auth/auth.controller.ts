import { Body, Controller, HttpCode, HttpException, HttpStatus, Inject, Post, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDTO } from "./dto/signup-dto";
import { LoginDto } from "./dto/login-dto";
import { ForgotPasswordDTO } from "./dto/ForgotPassword-dto";
import { ResetPasswordDto } from "./dto/resetPassword-dto";

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('/signup')
  async register(@Body() payload: RegisterDTO) {
    try {
      const response = await this.authService.register(payload);
      return { message: 'Sign up successful', response };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }


  @Post('/login')
  async login(@Body() payload: LoginDto) {
    try {
      const response = await this.authService.login(payload);
      return { message: 'Login successfully', response };
    } catch (error) {
      throw new HttpException(
        error.message || 'Operation failed',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/password/forgot')
  async forgotPassword(@Body() payload: ForgotPasswordDTO) {
    try {
      const response = await this.authService.forgotPassword(
        payload.userId,
      );
      return { message: 'Reset password notification sent', response };
    } catch (error) {
      throw new HttpException(
        error.message || 'Operation failed',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }


  @Post('/new-password')
  async resetPassword(@Body() payload: ResetPasswordDto, @Query('token') token: string) {
    try {
      payload.token = token;
      const response = await this.authService.resetPassword(payload);
      return { message: 'Reset password successfully', response };
    } catch (error) {
      throw new HttpException(
        error.message || 'Operation failed',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }

}
