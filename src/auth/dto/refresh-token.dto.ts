import { IsString } from 'class-validator';
import { RefreshTokenRequest } from 'shared-types';

export class RefreshTokenDto implements RefreshTokenRequest {
  @IsString()
  refreshToken: string;
}
