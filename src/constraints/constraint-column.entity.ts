import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Constraint } from './constraint.entity';
import { DbColumn } from '../columns/column.entity';

@Entity({
  name: 'constraint_columns',
})
@Unique([
  'constraintId',
  'columnId',
])
export class ConstraintColumn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'uuid',
  })
  constraintId!: string;

  @Column({
    type: 'uuid',
  })
  columnId!: string;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  referencedColumnId!: string | null;

  @Column({
    type: 'int',
  })
  position!: number;

  @ManyToOne(
    () => Constraint,
    (constraint) =>
      constraint.columns,
    {
      onDelete: 'CASCADE',
    },
  )
  constraint!: Constraint;

  @ManyToOne(
    () => DbColumn,
    {
      onDelete: 'CASCADE',
    },
  )
  column!: DbColumn;
}