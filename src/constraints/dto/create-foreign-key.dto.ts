import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class ForeignKeyColumnDto {
  @IsUUID('4')
  columnId!: string;

  @IsUUID('4')
  referencedColumnId!: string;
}

export class CreateForeignKeyDto {
  @IsUUID('4')
  referencedTableId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ForeignKeyColumnDto)
  columns!: ForeignKeyColumnDto[];
}