import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginRequest } from 'shared-types';

export class LoginDto implements LoginRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
