import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

// DTO zum Einloggen eines Benutzers
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
