import {
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class RefreshTokenDto {
  @IsUUID()
  sessionId!: string;

  @IsString()
  @MaxLength(512)
  refresh_token!: string;
}