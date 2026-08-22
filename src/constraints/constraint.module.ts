import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Constraint } from './constraint.entity';
import { ConstraintColumn } from './constraint-column.entity';

import { DbColumn } from '../columns/column.entity';
import { Table } from '../tables/table.entity';
import { Project } from '../projects/project.entity';
import { ProjectMember } from '../project-members/project-member.entity';

import { ConstraintService } from './constraint.service';
import { ConstraintController } from './constraint.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Constraint,
      ConstraintColumn,
      DbColumn,
      Table,
      Project,
      ProjectMember,
    ]),
  ],
  providers: [
    ConstraintService,
  ],
  controllers: [
    ConstraintController,
  ],
})
export class ConstraintModule {}