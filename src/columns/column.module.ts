import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DbColumn } from './column.entity';
import { Table } from '../tables/table.entity';
import { Project } from '../projects/project.entity';
import { ProjectMember } from '../project-members/project-member.entity';

import { ColumnService } from './column.service';
import { ColumnController } from './column.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DbColumn,
      Table,
      Project,
      ProjectMember,
    ]),
  ],
  providers: [
    ColumnService,
  ],
  controllers: [
    ColumnController,
  ],
})
export class ColumnModule {}