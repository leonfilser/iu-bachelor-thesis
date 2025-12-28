import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

// DTO zur Aktualisierung der eigenen Benutzerdaten
export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/, {
    message:
      'Das Passwort muss mindestens einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten',
  })
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}
