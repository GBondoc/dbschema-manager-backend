import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Table } from '../tables/table.entity';
import { ConstraintType } from './constraint-type.enum';
import { ConstraintColumn } from './constraint-column.entity';

@Entity({ name: 'constraints' })
export class Constraint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  tableId!: string;

  @Column({
    type: 'enum',
    enum: ConstraintType,
  })
  type!: ConstraintType;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  name!: string | null;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  referencedTableId!: string | null;

  @OneToMany(
    () => ConstraintColumn,
    (constraintColumn) =>
      constraintColumn.constraint,
  )
  columns!: ConstraintColumn[];
}