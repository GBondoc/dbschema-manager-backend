import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProjectMember } from './project-member.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';

import { ProjectMemberService } from './project-member.service';
import { ProjectMemberController } from './project-member.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProjectMember,
      Project,
      User,
    ]),
  ],
  providers: [
    ProjectMemberService,
  ],
  controllers: [
    ProjectMemberController,
  ],
  exports: [
    ProjectMemberService,
  ],
})
export class ProjectMemberModule {}