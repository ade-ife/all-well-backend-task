import { IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  userID: string;

  @IsNotEmpty()
  @IsString()
  password: string;

}