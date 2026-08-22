import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { ColumnDataType } from '../column-data-type.enum';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsEnum(ColumnDataType)
  dataType?: ColumnDataType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  length?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65)
  precision?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  scale?: number | null;

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
  defaultValue?: string | null;
}