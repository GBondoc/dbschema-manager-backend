import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ColumnDataType } from '../column-data-type.enum';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEnum(ColumnDataType)
  dataType!: ColumnDataType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  length?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65)
  precision?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  scale?: number;

  @IsOptional()
  @IsBoolean()
  nullable?: boolean;

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  @IsBoolean()
  autoIncrement?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;
}