import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { DbColumn } from './column.entity';
import { ColumnDataType } from './column-data-type.enum';

import { Table } from '../tables/table.entity';
import { Project } from '../projects/project.entity';

import {
  ProjectMember,
  ProjectMemberRole,
} from '../project-members/project-member.entity';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@Injectable()
export class ColumnService {
  constructor(
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
  ) {
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
        'Viewer cannot modify table columns',
      );
    }

    return result.table;
  }

  private validateTypeOptions(
    dataType: ColumnDataType,
    length: number | null,
    precision: number | null,
    scale: number | null,
    autoIncrement: boolean,
  ): void {
    const usesLength =
      dataType === ColumnDataType.VARCHAR ||
      dataType === ColumnDataType.CHAR;

    if (!usesLength && length !== null) {
      throw new ConflictException(
        'Length is only available for VARCHAR and CHAR',
      );
    }

    if (
      dataType !== ColumnDataType.DECIMAL &&
      (
        precision !== null ||
        scale !== null
      )
    ) {
      throw new ConflictException(
        'Precision and scale are only available for DECIMAL',
      );
    }

    if (
      dataType === ColumnDataType.DECIMAL &&
      precision !== null &&
      scale !== null &&
      scale > precision
    ) {
      throw new ConflictException(
        'Scale cannot be greater than precision',
      );
    }

    if (
      autoIncrement &&
      dataType !== ColumnDataType.INT &&
      dataType !== ColumnDataType.BIGINT
    ) {
      throw new ConflictException(
        'AUTO_INCREMENT is only available for integer columns',
      );
    }
  }

  async create(
    projectId: string,
    tableId: string,
    userId: string,
    dto: CreateColumnDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const name = dto.name.trim();

    const existing =
      await this.columnRepo.findOne({
        where: {
          tableId,
          name,
        },
      });

    if (existing) {
      throw new ConflictException(
        'A column with this name already exists in the table',
      );
    }

    const length =
      dto.length ?? null;

    const precision =
      dto.precision ?? null;

    const scale =
      dto.scale ?? null;

    const autoIncrement =
      dto.autoIncrement ?? false;

    this.validateTypeOptions(
      dto.dataType,
      length,
      precision,
      scale,
      autoIncrement,
    );

    const lastColumn =
      await this.columnRepo.findOne({
        where: {
          tableId,
        },
        order: {
          position: 'DESC',
        },
      });

    const position =
      (lastColumn?.position ?? 0) + 1;

    const column =
      this.columnRepo.create({
        tableId,
        name,
        dataType: dto.dataType,

        length,
        precision,
        scale,

        nullable:
          dto.nullable ?? true,

        unique:
          dto.unique ?? false,

        autoIncrement,

        defaultValue:
          dto.defaultValue?.trim() ||
          null,

        position,
      });

    return this.columnRepo.save(column);
  }

  async findAll(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.getTableAndAccess(
      projectId,
      tableId,
      userId,
    );

    return this.columnRepo.find({
      where: {
        tableId,
      },
      order: {
        position: 'ASC',
      },
    });
  }

  async findOne(
    projectId: string,
    tableId: string,
    columnId: string,
    userId: string,
  ) {
    await this.getTableAndAccess(
      projectId,
      tableId,
      userId,
    );

    const column =
      await this.columnRepo.findOne({
        where: {
          id: columnId,
          tableId,
        },
      });

    if (!column) {
      throw new NotFoundException(
        'Column not found',
      );
    }

    return column;
  }

  async update(
    projectId: string,
    tableId: string,
    columnId: string,
    userId: string,
    dto: UpdateColumnDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const column =
      await this.columnRepo.findOne({
        where: {
          id: columnId,
          tableId,
        },
      });

    if (!column) {
      throw new NotFoundException(
        'Column not found',
      );
    }

    if (dto.name !== undefined) {
      const newName =
        dto.name.trim();

      const duplicate =
        await this.columnRepo.findOne({
          where: {
            tableId,
            name: newName,
          },
        });

      if (
        duplicate &&
        duplicate.id !== column.id
      ) {
        throw new ConflictException(
          'A column with this name already exists in the table',
        );
      }

      column.name = newName;
    }

    if (dto.dataType !== undefined) {
      column.dataType = dto.dataType;
    }

    if (dto.length !== undefined) {
      column.length = dto.length;
    }

    if (dto.precision !== undefined) {
      column.precision =
        dto.precision;
    }

    if (dto.scale !== undefined) {
      column.scale = dto.scale;
    }

    if (dto.nullable !== undefined) {
      column.nullable =
        dto.nullable;
    }

    if (dto.unique !== undefined) {
      column.unique =
        dto.unique;
    }

    if (
      dto.autoIncrement !== undefined
    ) {
      column.autoIncrement =
        dto.autoIncrement;
    }

    if (
      dto.defaultValue !== undefined
    ) {
      column.defaultValue =
        dto.defaultValue?.trim() ||
        null;
    }

    this.validateTypeOptions(
      column.dataType,
      column.length,
      column.precision,
      column.scale,
      column.autoIncrement,
    );

    return this.columnRepo.save(column);
  }

  async remove(
    projectId: string,
    tableId: string,
    columnId: string,
    userId: string,
  ) {
    await this.requireWriteAccess(
      projectId,
      tableId,
      userId,
    );

    const column =
      await this.columnRepo.findOne({
        where: {
          id: columnId,
          tableId,
        },
      });

    if (!column) {
      throw new NotFoundException(
        'Column not found',
      );
    }

    await this.columnRepo.softRemove(
      column,
    );

    return {
      id: column.id,
      removed: true,
    };
  }
}