import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ProjectMemberService } from './project-member.service';

import { UpdateProjectMemberDto } from './dto/update-project-member.dto';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectMemberController {
  constructor(
    private readonly projectMemberService:
      ProjectMemberService,
  ) {}

  @Get(':projectId/members')
  findAllForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectMemberService.findAllForProject(
      projectId,
      user.id,
    );
  }

  @Patch(':projectId/members/:memberId')
  updateRole(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateProjectMemberDto,
  ) {
    return this.projectMemberService.updateRole(
      projectId,
      memberId,
      user.id,
      dto.role,
    );
  }

  @Delete(':projectId/members/me')
  leaveProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectMemberService.leaveProject(
      projectId,
      user.id,
    );
  }

  @Delete(':projectId/members/:memberId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectMemberService.removeMember(
      projectId,
      memberId,
      user.id,
    );
  }
}