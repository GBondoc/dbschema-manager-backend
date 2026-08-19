import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { ProjectMember } from "./project-member.entity";

import { InjectRepository } from "@nestjs/typeorm";
import {
  MoreThan,
  Repository,
} from 'typeorm';

import { randomBytes } from "crypto";

import { ProjectInvite } from "./project-invite.entity";
import { Project } from "../projects/project.entity";

import { CreateProjectInviteDto } from "./dto/create-project-invite.dto";

@Injectable()
export class ProjectInviteService {
  constructor(
    @InjectRepository(ProjectInvite)
    private readonly inviteRepo: Repository<ProjectInvite>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly memberRepo: Repository<ProjectMember>,
  ) {}

  async createInvite(
    projectId: string,
    userId: string,
    dto: CreateProjectInviteDto,
  ) {
    const project = await this.projectRepo.findOne({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.ownerUserId !== userId) {
      throw new ForbiddenException(
        "Only the project owner can create invitations",
      );
    }

    const token = randomBytes(32).toString("hex");

    const expiresAt = new Date(
      Date.now() + dto.expiresInMinutes * 60 * 1000,
    );

    const invite = this.inviteRepo.create({
      projectId,
      createdByUserId: userId,
      token,
      role: dto.role,
      expiresAt,
      revoked: false,
    });

    const savedInvite =
      await this.inviteRepo.save(invite);

    return {
        id: savedInvite.id,
        token: savedInvite.token,
        role: savedInvite.role,
        expiresAt: savedInvite.expiresAt,
        revoked: savedInvite.revoked,
        createdAt: savedInvite.createdAt,
    };
  }

  async getInvite(token: string) {
    const invite = await this.inviteRepo.findOne({
        where: {
        token,
        },
    });

    if (!invite) {
        throw new NotFoundException(
        "Invitation not found",
        );
    }

    if (invite.revoked) {
        throw new BadRequestException(
        "Invitation has been revoked",
        );
    }

    if (invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException(
        "Invitation has expired",
        );
    }

    const project = await this.projectRepo.findOne({
        where: {
        id: invite.projectId,
        },
    });

    if (!project) {
        throw new NotFoundException(
        "Project not found",
        );
    }

    return {
        projectId: project.id,
        projectName: project.name,
        role: invite.role,
        expiresAt: invite.expiresAt,
    };
  }

  async acceptInvite(
    token: string,
    userId: string,
    ) {
    const invite = await this.inviteRepo.findOne({
        where: {
        token,
        },
    });

    if (!invite) {
        throw new NotFoundException(
        "Invitation not found",
        );
    }

    if (invite.revoked) {
        throw new BadRequestException(
        "Invitation has been revoked",
        );
    }

    if (invite.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException(
        "Invitation has expired",
        );
    }

    const project = await this.projectRepo.findOne({
        where: {
        id: invite.projectId,
        },
    });

    if (!project) {
        throw new NotFoundException(
        "Project not found",
        );
    }

    // Owner-ul nu se poate invita în propriul proiect.
    if (project.ownerUserId === userId) {
        throw new ConflictException(
        "Project owner is already a member",
        );
    }

    // Userul poate fi deja membru.
    const existingMember =
        await this.memberRepo.findOne({
        where: {
            projectId: project.id,
            userId,
        },
        });

    if (existingMember) {
        throw new ConflictException(
        "User is already a project member",
        );
    }

    const member = this.memberRepo.create({
        projectId: project.id,
        userId,
        role: invite.role,
    });

    const savedMember =
        await this.memberRepo.save(member);

    return {
        projectId: project.id,
        projectName: project.name,
        role: savedMember.role,
    };
  }

  async revokeInvite(
    projectId: string,
    inviteId: string,
    userId: string,
    ) {
    const project = await this.projectRepo.findOne({
        where: {
        id: projectId,
        },
    });

    if (!project) {
        throw new NotFoundException(
        "Project not found",
        );
    }

    if (project.ownerUserId !== userId) {
        throw new ForbiddenException(
        "Only the project owner can revoke invitations",
        );
    }

    const invite = await this.inviteRepo.findOne({
        where: {
        id: inviteId,
        projectId,
        },
    });

    if (!invite) {
        throw new NotFoundException(
        "Invitation not found",
        );
    }

    invite.revoked = true;

    await this.inviteRepo.save(invite);

    return {
        id: invite.id,
        revoked: true,
    };
  }

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
        throw new NotFoundException(
        'Project not found',
        );
    }

    if (project.ownerUserId !== userId) {
        throw new ForbiddenException(
        'Only the project owner can view invitations',
        );
    }

    const invites = await this.inviteRepo.find({
        where: {
            projectId,
            revoked: false,
            expiresAt: MoreThan(new Date()),
        },
        order: {
            createdAt: 'DESC',
        },
    });

    return invites.map((invite) => ({
        id: invite.id,
        token: invite.token,
        role: invite.role,
        expiresAt: invite.expiresAt,
        revoked: invite.revoked,
        createdAt: invite.createdAt,
    }));
    }
}