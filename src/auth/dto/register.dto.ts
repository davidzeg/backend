import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { RegisterRequest } from 'shared-types';

export class RegisterDto implements RegisterRequest {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;
}
