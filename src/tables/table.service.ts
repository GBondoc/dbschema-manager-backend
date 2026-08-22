import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Table } from './table.entity';
import { Project } from '../projects/project.entity';
import {
  ProjectMember,
  ProjectMemberRole,
} from '../project-members/project-member.entity';

import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo:
      Repository<ProjectMember>,
  ) {}

  private async getProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<
    'OWNER' | ProjectMemberRole
  > {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    if (project.ownerUserId === userId) {
      return 'OWNER';
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

    return membership.role;
  }

  private async requireWriteAccess(
    projectId: string,
    userId: string,
  ): Promise<void> {
    const access = await this.getProjectAccess(
      projectId,
      userId,
    );

    if (access === ProjectMemberRole.VIEWER) {
      throw new ForbiddenException(
        'Viewer cannot modify project tables',
      );
    }
  }

  async create(
    projectId: string,
    userId: string,
    dto: CreateTableDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      userId,
    );

    const table = this.tableRepo.create({
      projectId,
      name: dto.name.trim(),
    });

    return this.tableRepo.save(table);
  }

  async findAll(
    projectId: string,
    userId: string,
  ) {
    await this.getProjectAccess(
      projectId,
      userId,
    );

    return this.tableRepo.find({
      where: {
        projectId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async findOne(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.getProjectAccess(
      projectId,
      userId,
    );

    const table = await this.tableRepo.findOne({
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

    return table;
  }

  async update(
    projectId: string,
    tableId: string,
    userId: string,
    dto: UpdateTableDto,
  ) {
    await this.requireWriteAccess(
      projectId,
      userId,
    );

    const table = await this.tableRepo.findOne({
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

    if (dto.name !== undefined) {
      table.name = dto.name.trim();
    }

    return this.tableRepo.save(table);
  }

  async remove(
    projectId: string,
    tableId: string,
    userId: string,
  ) {
    await this.requireWriteAccess(
      projectId,
      userId,
    );

    const table = await this.tableRepo.findOne({
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

    await this.tableRepo.softRemove(table);

    return {
      id: table.id,
      removed: true,
    };
  }
}