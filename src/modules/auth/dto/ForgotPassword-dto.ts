import { IsNotEmpty, IsString } from 'class-validator';


export class ForgotPasswordDTO {

  @IsNotEmpty()
  @IsString()
  userId: string;

}
