import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from "../user/user.module";
import { MailjetService } from "../../helpers/mailjet.service";
import { UtilityService } from "../../helpers/utility.service";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchemaDefinition } from "../user/user.schema";

@Module({
  imports: [MongooseModule.forFeature([UserSchemaDefinition]), UserModule],
  providers: [AuthService, MailjetService, UtilityService],
  controllers: [AuthController]
})
export class AuthModule {}
