import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import {
  DataSource,
  In,
  Repository,
} from 'typeorm';

import { Constraint } from './constraint.entity';
import { ConstraintColumn } from './constraint-column.entity';
import { ConstraintType } from './constraint-type.enum';

import { DbColumn } from '../columns/column.entity';
import { Table } from '../tables/table.entity';
import { Project } from '../projects/project.entity';

import {
  ProjectMember,
  ProjectMemberRole,
} from '../project-members/project-member.entity';

@Injectable()
export class ConstraintService {
  constructor(
    @InjectRepository(Constraint)
    private readonly constraintRepo:
      Repository<Constraint>,

    @InjectRepository(ConstraintColumn)
    private readonly constraintColumnRepo:
      Repository<ConstraintColumn>,

    @InjectRepository(DbColumn)
    private readonly columnRepo:
      Repository<DbColumn>,

    @InjectRepository(Table)
    private readonly tableRepo:
      Repository<Table>,

    @InjectRepository(Project)
    private readonly projectRepo:
      Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo:
      Repository<ProjectMember>,

    private readonly dataSource:
      DataSource,
  ) {}

  private async getTableAndAccess(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    const project =
      await this.projectRepo.findOne({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    const table =
      await this.tableRepo.findOne({
        where: {
          id: tableId,
          projectId,
        },
      });

    if (!table) {
      throw new NotFoundException(
        'Table not found',
      );
    }

    if (project.ownerUserId === userId) {
      return {
        table,
        accessRole: 'OWNER' as const,
      };
    }

    const membership =
      await this.projectMemberRepo.findOne({
        where: {
          projectId,
          userId,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return {
      table,
      accessRole: membership.role,
    };
  }

  private async requireWriteAccess(
    projectId: string,
    tableId: string,
    userId: string,
  ): Promise<void> {
    const result =
      await this.getTableAndAccess(
        projectId,
        tableId,
        userId,
      );

    if (
      result.accessRole ===
      ProjectMemberRole.VIEWER
    ) {
      throw new ForbiddenException(
        'Viewer cannot modify table constraints',
      );
    }
  }

  async findPrimaryKey(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.getTableAndAccess(
      projectId,
      tableId,
      userId,
    );

    const constraint =
      await this.constraintRepo.findOne({
        where: {
          tableId,
          type:
            ConstraintType.PRIMARY_KEY,
        },
      });

    if (!constraint) {
        return {
            primaryKey: null,
        };
    }

    const columns =
      await this.constraintColumnRepo.find({
        where: {
          constraintId:
            constraint.id,
        },
        relations: {
          column: true,
        },
        order: {
          position: 'ASC',
        },
      });

    return {
    primaryKey: {
        id: constraint.id,
        tableId: constraint.tableId,
        type: constraint.type,

        columns: columns.map((item) => ({
        id: item.column.id,
        name: item.column.name,
        dataType: item.column.dataType,
        position: item.position,
        })),
        },
    };
  }

  async setPrimaryKey(
    projectId: string,
    tableId: string,
    userId: string,
    columnIds: string[],
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const columns =
      await this.columnRepo.find({
        where: {
          id: In(columnIds),
          tableId,
        },
      });

    if (
      columns.length !==
      columnIds.length
    ) {
      throw new NotFoundException(
        'One or more columns were not found in this table',
      );
    }

    const existingPrimaryKeys =
      await this.constraintRepo.find({
        where: {
          tableId,
          type:
            ConstraintType.PRIMARY_KEY,
        },
      });

    if (existingPrimaryKeys.length > 1) {
      throw new ConflictException(
        'Table contains more than one primary key constraint',
      );
    }

    await this.dataSource.transaction(
      async (manager) => {
        const constraintRepo =
          manager.getRepository(
            Constraint,
          );

        const constraintColumnRepo =
          manager.getRepository(
            ConstraintColumn,
          );

        let constraint =
          await constraintRepo.findOne({
            where: {
              tableId,
              type:
                ConstraintType.PRIMARY_KEY,
            },
          });

        if (!constraint) {
          constraint =
            constraintRepo.create({
              tableId,
              type:
                ConstraintType.PRIMARY_KEY,
              name: null,
              referencedTableId: null,
            });

          constraint =
            await constraintRepo.save(
              constraint,
            );
        } else {
          await constraintColumnRepo.delete({
            constraintId:
              constraint.id,
          });
        }

        const entries =
          columnIds.map(
            (columnId, index) =>
              constraintColumnRepo.create({
                constraintId:
                  constraint.id,

                columnId,

                referencedColumnId:
                  null,

                position:
                  index + 1,
              }),
          );

        await constraintColumnRepo.save(
          entries,
        );
      },
    );

    return this.findPrimaryKey(
      projectId,
      tableId,
      userId,
    );
  }

  async removePrimaryKey(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const constraint =
      await this.constraintRepo.findOne({
        where: {
          tableId,
          type:
            ConstraintType.PRIMARY_KEY,
        },
      });

    if (!constraint) {
      throw new NotFoundException(
        'Primary key not found',
      );
    }

    await this.constraintRepo.remove(
      constraint,
    );

    return {
      id: constraint.id,
      removed: true,
    };
  }
}