import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ProjectInvite } from "./project-invite.entity";
import { Project } from "../projects/project.entity";
import { ProjectMember } from "./project-member.entity";

import { ProjectInviteService } from "./project-invite.service";
import { ProjectInviteController } from "./project-invite.controller";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectInvite,
      Project,
      ProjectMember,
    ]),
  ],
  providers: [
    ProjectInviteService,
  ],
  controllers: [
    ProjectInviteController,
  ],
  exports: [
    ProjectInviteService,
  ],
})
export class ProjectInviteModule {}