import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { Project } from './project.entity';
import { ProjectMember } from '../project-members/project-member.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
  ) {}

  async create(
    dto: CreateProjectDto,
    ownerUserId: string,
  ) {
    const project = this.projectRepo.create({
      ...dto,
      ownerUserId,
    });

    return this.projectRepo.save(project);
  }

  async findAll(userId: string) {
    // Proiectele create de utilizator
    const ownedProjects = await this.projectRepo.find({
      where: {
        ownerUserId: userId,
      },
    });

    // Membership-urile utilizatorului
    const memberships = await this.projectMemberRepo.find({
      where: {
        userId,
      },
    });

    const sharedProjectIds = memberships.map(
      (membership) => membership.projectId,
    );

    let sharedProjects: Project[] = [];

    if (sharedProjectIds.length > 0) {
      sharedProjects = await this.projectRepo.find({
        where: {
          id: In(sharedProjectIds),
        },
      });
    }

    // Adăugăm rolul OWNER proiectelor proprii
    const ownedWithRole = ownedProjects.map(
      (project) => ({
        ...project,
        accessRole: 'OWNER' as const,
      }),
    );

    // Adăugăm EDITOR / VIEWER proiectelor partajate
    const sharedWithRole = sharedProjects.map(
      (project) => {
        const membership = memberships.find(
          (membership) =>
            membership.projectId === project.id,
        );

        return {
          ...project,
          accessRole: membership!.role,
        };
      },
    );

    return [
      ...ownedWithRole,
      ...sharedWithRole,
    ];
  }

  async findOne(
    id: string,
    userId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Este owner
    if (project.ownerUserId === userId) {
      return {
        ...project,
        accessRole: 'OWNER' as const,
      };
    }

    // Verificăm dacă este membru
    const membership =
      await this.projectMemberRepo.findOne({
        where: {
          projectId: id,
          userId,
        },
      });

    if (!membership) {
      throw new NotFoundException('Project not found');
    }

    return {
      ...project,
      accessRole: membership.role,
    };
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    userId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Doar owner-ul poate modifica
    // numele/descrierea proiectului.
    if (project.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can update the project',
      );
    }

    Object.assign(project, dto);

    return this.projectRepo.save(project);
  }

  async remove(
    id: string,
    userId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Doar owner-ul poate șterge proiectul.
    if (project.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can delete the project',
      );
    }

    const memberCount = await this.projectMemberRepo.count({
      where: {
        projectId: id,
      },
    });

    if (memberCount > 0) {
      throw new ConflictException(
        'Project cannot be deleted while it still has members',
      );
    }

    return this.projectRepo.softRemove(project);
  }
}