import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Table } from './table.entity';
import { Project } from '../projects/project.entity';
import { ProjectMember } from '../project-members/project-member.entity';

import { TableService } from './table.service';
import { TableController } from './table.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Table,
      Project,
      ProjectMember,
    ]),
  ],
  providers: [TableService],
  controllers: [TableController],
})
export class TableModule {}