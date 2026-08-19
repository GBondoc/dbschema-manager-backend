import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { ProjectMember, ProjectMemberRole } from './project-member.entity';

@Injectable()
export class ProjectMemberService {
  constructor(
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAllForProject(
    projectId: string,
    userId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isOwner =
      project.ownerUserId === userId;

    let membership: ProjectMember | null = null;

    if (!isOwner) {
      membership =
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
    }

    const owner = await this.userRepo.findOne({
      where: {
        id: project.ownerUserId,
      },
    });

    if (!owner) {
      throw new NotFoundException(
        'Project owner not found',
      );
    }

    const members =
      await this.projectMemberRepo.find({
        where: {
          projectId,
        },
        relations: {
          user: true,
        },
      });

    return [
      {
        id: null,
        userId: owner.id,
        displayedName: owner.displayedName,
        role: 'OWNER' as const,
      },

      ...members.map((member) => ({
        id: member.id,
        userId: member.userId,
        displayedName: member.user.displayedName,
        role: member.role,
      })),
    ];
  }

  async updateRole(
    projectId: string,
    memberId: string,
    userId: string,
    role: ProjectMemberRole,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can change member roles',
      );
    }

    const member = await this.projectMemberRepo.findOne({
      where: {
        id: memberId,
        projectId,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    member.role = role;

    const updatedMember =
      await this.projectMemberRepo.save(member);

    return {
      id: updatedMember.id,
      userId: updatedMember.userId,
      role: updatedMember.role,
    };
  }

  async removeMember(
    projectId: string,
    memberId: string,
    userId: string,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerUserId !== userId) {
      throw new ForbiddenException(
        'Only the project owner can remove members',
      );
    }

    const member = await this.projectMemberRepo.findOne({
      where: {
        id: memberId,
        projectId,
      },
    });

    if (!member) {
      throw new NotFoundException('Project member not found');
    }

    await this.projectMemberRepo.remove(member);

    return {
      id: member.id,
      removed: true,
    };
  }

}