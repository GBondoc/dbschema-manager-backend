import {
  BadRequestException,
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

import { CreateForeignKeyDto } from './dto/create-foreign-key.dto';
import { UpdateForeignKeyDto } from './dto/update-foreign-key.dto';

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

  // ----------------------------------------------------------------
  // ACCESS
  // ----------------------------------------------------------------

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

  // ----------------------------------------------------------------
  // FOREIGN KEY VALIDATION
  // ----------------------------------------------------------------

  private areColumnTypesCompatible(
    source: DbColumn,
    target: DbColumn,
  ): boolean {
    if (
      source.dataType !==
      target.dataType
    ) {
      return false;
    }

    if (
      source.dataType === 'VARCHAR' ||
      source.dataType === 'CHAR'
    ) {
      return (
        source.length ===
        target.length
      );
    }

    if (
      source.dataType === 'DECIMAL'
    ) {
      return (
        source.precision ===
          target.precision &&
        source.scale ===
          target.scale
      );
    }

    return true;
  }

  private async validateReferencedColumns(
    referencedTableId: string,
    referencedColumnIds: string[],
  ): Promise<void> {
    const primaryKey =
      await this.constraintRepo.findOne({
        where: {
          tableId:
            referencedTableId,
          type:
            ConstraintType.PRIMARY_KEY,
        },
      });

    if (primaryKey) {
      const primaryKeyColumns =
        await this.constraintColumnRepo.find({
          where: {
            constraintId:
              primaryKey.id,
          },
          order: {
            position: 'ASC',
          },
        });

      const primaryKeyColumnIds =
        primaryKeyColumns.map(
          (item) =>
            item.columnId,
        );

      const matchesPrimaryKey =
        primaryKeyColumnIds.length ===
          referencedColumnIds.length &&
        primaryKeyColumnIds.every(
          (columnId, index) =>
            columnId ===
            referencedColumnIds[index],
        );

      if (matchesPrimaryKey) {
        return;
      }
    }

    // Pentru moment, UNIQUE este proprietate
    // individuală a unei coloane.
    if (
      referencedColumnIds.length === 1
    ) {
      const column =
        await this.columnRepo.findOne({
          where: {
            id:
              referencedColumnIds[0],
            tableId:
              referencedTableId,
          },
        });

      if (column?.unique) {
        return;
      }
    }

    throw new BadRequestException(
      'Referenced columns must form the primary key or reference a UNIQUE column',
    );
  }

  private async validateForeignKeyDefinition(
    sourceTableId: string,
    referencedTableId: string,
    mappings: {
      columnId: string;
      referencedColumnId: string;
    }[],
  ): Promise<void> {
    const sourceIds =
      mappings.map(
        (mapping) =>
          mapping.columnId,
      );

    const referencedIds =
      mappings.map(
        (mapping) =>
          mapping.referencedColumnId,
      );

    if (
      new Set(sourceIds).size !==
      sourceIds.length
    ) {
      throw new BadRequestException(
        'A local column cannot appear more than once in the same foreign key',
      );
    }

    if (
      new Set(referencedIds).size !==
      referencedIds.length
    ) {
      throw new BadRequestException(
        'A referenced column cannot appear more than once in the same foreign key',
      );
    }

    const sourceColumns =
      await this.columnRepo.find({
        where: {
          id: In(sourceIds),
          tableId:
            sourceTableId,
        },
      });

    if (
      sourceColumns.length !==
      sourceIds.length
    ) {
      throw new NotFoundException(
        'One or more local columns were not found in the source table',
      );
    }

    const referencedColumns =
      await this.columnRepo.find({
        where: {
          id: In(referencedIds),
          tableId:
            referencedTableId,
        },
      });

    if (
      referencedColumns.length !==
      referencedIds.length
    ) {
      throw new NotFoundException(
        'One or more referenced columns were not found in the referenced table',
      );
    }

    for (const mapping of mappings) {
      const source =
        sourceColumns.find(
          (column) =>
            column.id ===
            mapping.columnId,
        );

      const target =
        referencedColumns.find(
          (column) =>
            column.id ===
            mapping.referencedColumnId,
        );

      if (!source || !target) {
        throw new NotFoundException(
          'Foreign key column mapping is invalid',
        );
      }

      if (
        !this.areColumnTypesCompatible(
          source,
          target,
        )
      ) {
        throw new BadRequestException(
          `Column ${source.name} is not compatible with ${target.name}`,
        );
      }
    }

    await this.validateReferencedColumns(
      referencedTableId,
      referencedIds,
    );
  }

  // ----------------------------------------------------------------
  // PRIMARY KEY
  // ----------------------------------------------------------------

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
        tableId:
          constraint.tableId,
        type:
          constraint.type,

        columns:
          columns.map(
            (item) => ({
              id:
                item.column.id,

              name:
                item.column.name,

              dataType:
                item.column.dataType,

              position:
                item.position,
            }),
          ),
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

    if (
      existingPrimaryKeys.length > 1
    ) {
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

              referencedTableId:
                null,
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
            (
              columnId,
              index,
            ) =>
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

  // ----------------------------------------------------------------
  // FOREIGN KEYS
  // ----------------------------------------------------------------

  async findForeignKeys(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.getTableAndAccess(
      projectId,
      tableId,
      userId,
    );

    const constraints =
      await this.constraintRepo.find({
        where: {
          tableId,

          type:
            ConstraintType.FOREIGN_KEY,
        },
      });

    return Promise.all(
      constraints.map(
        async (constraint) => {
          const mappings =
            await this.constraintColumnRepo.find({
              where: {
                constraintId:
                  constraint.id,
              },

              relations: {
                column: true,
              },

              order: {
                position:
                  'ASC',
              },
            });

          const referencedTable =
            constraint.referencedTableId
              ? await this.tableRepo.findOne({
                  where: {
                    id:
                      constraint.referencedTableId,

                    projectId,
                  },
                })
              : null;

          const referencedColumnIds =
            mappings
              .map(
                (mapping) =>
                  mapping.referencedColumnId,
              )
              .filter(
                (
                  id,
                ): id is string =>
                  id !== null,
              );

          const referencedColumns =
            referencedColumnIds.length > 0
              ? await this.columnRepo.find({
                  where: {
                    id: In(
                      referencedColumnIds,
                    ),
                  },
                })
              : [];

          return {
            id:
              constraint.id,

            tableId:
              constraint.tableId,

            type:
              constraint.type,

            name:
              constraint.name,

            referencedTable:
              referencedTable
                ? {
                    id:
                      referencedTable.id,

                    name:
                      referencedTable.name,
                  }
                : null,

            columns:
              mappings.map(
                (mapping) => {
                  const referencedColumn =
                    referencedColumns.find(
                      (column) =>
                        column.id ===
                        mapping.referencedColumnId,
                    );

                  return {
                    id:
                      mapping.id,

                    column: {
                      id:
                        mapping.column.id,

                      name:
                        mapping.column.name,
                    },

                    referencedColumn:
                      referencedColumn
                        ? {
                            id:
                              referencedColumn.id,

                            name:
                              referencedColumn.name,
                          }
                        : null,

                    position:
                      mapping.position,
                  };
                },
              ),
          };
        },
      ),
    );
  }

  async createForeignKey(
    projectId: string,
    tableId: string,
    userId: string,
    dto: CreateForeignKeyDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const referencedTable =
      await this.tableRepo.findOne({
        where: {
          id:
            dto.referencedTableId,

          projectId,
        },
      });

    if (!referencedTable) {
      throw new NotFoundException(
        'Referenced table was not found in this project',
      );
    }

    await this.validateForeignKeyDefinition(
      tableId,
      dto.referencedTableId,
      dto.columns,
    );

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

        const constraint =
          await constraintRepo.save(
            constraintRepo.create({
              tableId,

              type:
                ConstraintType.FOREIGN_KEY,

              name:
                dto.name?.trim() ||
                null,

              referencedTableId:
                dto.referencedTableId,
            }),
          );

        const mappings =
          dto.columns.map(
            (
              mapping,
              index,
            ) =>
              constraintColumnRepo.create({
                constraintId:
                  constraint.id,

                columnId:
                  mapping.columnId,

                referencedColumnId:
                  mapping.referencedColumnId,

                position:
                  index + 1,
              }),
          );

        await constraintColumnRepo.save(
          mappings,
        );
      },
    );

    return this.findForeignKeys(
      projectId,
      tableId,
      userId,
    );
  }

  async updateForeignKey(
    projectId: string,
    tableId: string,
    constraintId: string,
    userId: string,
    dto: UpdateForeignKeyDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const constraint =
      await this.constraintRepo.findOne({
        where: {
          id:
            constraintId,

          tableId,

          type:
            ConstraintType.FOREIGN_KEY,
        },
      });

    if (!constraint) {
      throw new NotFoundException(
        'Foreign key not found',
      );
    }

    const referencedTable =
      await this.tableRepo.findOne({
        where: {
          id:
            dto.referencedTableId,

          projectId,
        },
      });

    if (!referencedTable) {
      throw new NotFoundException(
        'Referenced table was not found in this project',
      );
    }

    await this.validateForeignKeyDefinition(
      tableId,
      dto.referencedTableId,
      dto.columns,
    );

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

        constraint.name =
          dto.name?.trim() ||
          null;

        constraint.referencedTableId =
          dto.referencedTableId;

        await constraintRepo.save(
          constraint,
        );

        await constraintColumnRepo.delete({
          constraintId:
            constraint.id,
        });

        const mappings =
          dto.columns.map(
            (
              mapping,
              index,
            ) =>
              constraintColumnRepo.create({
                constraintId:
                  constraint.id,

                columnId:
                  mapping.columnId,

                referencedColumnId:
                  mapping.referencedColumnId,

                position:
                  index + 1,
              }),
          );

        await constraintColumnRepo.save(
          mappings,
        );
      },
    );

    return this.findForeignKeys(
      projectId,
      tableId,
      userId,
    );
  }

  async removeForeignKey(
    projectId: string,
    tableId: string,
    constraintId: string,
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
          id:
            constraintId,

          tableId,

          type:
            ConstraintType.FOREIGN_KEY,
        },
      });

    if (!constraint) {
      throw new NotFoundException(
        'Foreign key not found',
      );
    }

    await this.constraintRepo.remove(
      constraint,
    );

    return {
      id:
        constraint.id,

      removed: true,
    };
  }
}