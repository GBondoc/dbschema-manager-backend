import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { ProjectInviteService } from "./project-invite.service";
import { CreateProjectInviteDto } from "./dto/create-project-invite.dto";

import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller()
@UseGuards(JwtAuthGuard)
export class ProjectInviteController {
  constructor(
    private readonly projectInviteService:
      ProjectInviteService,
  ) {}

  @Post("projects/:projectId/invites")
  createInvite(
    @Param("projectId") projectId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateProjectInviteDto,
  ) {
    return this.projectInviteService.createInvite(
      projectId,
      user.id,
      dto,
    );
  }

  @Get("project-invites/:token")
  getInvite(
    @Param("token") token: string,
  ) {
    return this.projectInviteService.getInvite(
      token,
    );
  }

  @Post("project-invites/:token/accept")
  acceptInvite(
    @Param("token") token: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectInviteService.acceptInvite(
      token,
      user.id,
    );
  }

  @Patch("projects/:projectId/invites/:inviteId/revoke")
    revokeInvite(
    @Param("projectId") projectId: string,
    @Param("inviteId") inviteId: string,
    @CurrentUser() user: CurrentUserType,
    ) {
    return this.projectInviteService.revokeInvite(
        projectId,
        inviteId,
        user.id,
    );
  }

  @Get('projects/:projectId/invites')
  findAllForProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.projectInviteService.findAllForProject(
      projectId,
      user.id,
    );
  }
}