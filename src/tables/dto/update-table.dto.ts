import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateTableDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}