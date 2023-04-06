import { Injectable } from '@nestjs/common';
import * as JWT from 'jsonwebtoken';



@Injectable()
export class UtilityService {


  generateToken = async (
    data: Record<string, any>,
    expiresIn?: string,
    secretKey?: string,
  ): Promise<string> => {
    const key = secretKey || process.env.JWT_SECRET_KEY;
    const expire = expiresIn || process.env.JWT_AUTH_TOKEN_VALIDATION_LENGTH;
    return JWT.sign(data, key, { expiresIn: expire });
  };



}
