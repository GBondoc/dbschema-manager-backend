import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Table } from '../tables/table.entity';
import { ColumnDataType } from './column-data-type.enum';

@Entity({ name: 'columns' })
export class DbColumn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tableId!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: ColumnDataType,
  })
  dataType!: ColumnDataType;

  @Column({
    type: 'int',
    nullable: true,
  })
  length!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  precision!: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  scale!: number | null;

  @Column({
    default: true,
  })
  nullable!: boolean;

  @Column({
    default: false,
  })
  unique!: boolean;

  @Column({
    default: false,
  })
  autoIncrement!: boolean;

  @Column({
    type: 'text',
    nullable: true,
  })
  defaultValue!: string | null;

  @Column({
    type: 'int',
  })
  position!: number;

  @ManyToOne(
    () => Table,
    {
      onDelete: 'CASCADE',
    },
  )
  table!: Table;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt!: Date | null;
}