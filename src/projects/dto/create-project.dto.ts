import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum DatabaseDialect {
  MYSQL = 'MYSQL',
}

export class CreateProjectDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(DatabaseDialect)
  dialect!: DatabaseDialect;
}