import { IsString } from 'class-validator';

// DTO zur Erneuerung des JWT mittels Refresh Token
export class RefreshDto {
  @IsString()
  refreshToken: string;
}
