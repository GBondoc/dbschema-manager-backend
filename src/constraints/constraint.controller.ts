import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ConstraintService } from './constraint.service';
import { SetPrimaryKeyDto } from './dto/set-primary-key.dto';

import { Patch, Post } from '@nestjs/common';

import { CreateForeignKeyDto } from './dto/create-foreign-key.dto';
import { UpdateForeignKeyDto } from './dto/update-foreign-key.dto';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller(
  'projects/:projectId/tables/:tableId/constraints',
)
@UseGuards(JwtAuthGuard)
export class ConstraintController {
  constructor(
    private readonly constraintService:
      ConstraintService,
  ) {}

  @Get('primary-key')
  findPrimaryKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.constraintService.findPrimaryKey(
      projectId,
      tableId,
      user.id,
    );
  }

  @Put('primary-key')
  setPrimaryKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @CurrentUser()
    user: CurrentUserType,

    @Body()
    dto: SetPrimaryKeyDto,
  ) {
    return this.constraintService.setPrimaryKey(
      projectId,
      tableId,
      user.id,
      dto.columnIds,
    );
  }

  @Delete('primary-key')
  removePrimaryKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.constraintService.removePrimaryKey(
      projectId,
      tableId,
      user.id,
    );
  }

  @Get('foreign-keys')
  findForeignKeys(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.constraintService.findForeignKeys(
      projectId,
      tableId,
      user.id,
    );
  }

  @Post('foreign-keys')
  createForeignKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @CurrentUser()
    user: CurrentUserType,

    @Body()
    dto: CreateForeignKeyDto,
  ) {
    return this.constraintService.createForeignKey(
      projectId,
      tableId,
      user.id,
      dto,
    );
  }

  @Patch('foreign-keys/:constraintId')
  updateForeignKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @Param('constraintId')
    constraintId: string,

    @CurrentUser()
    user: CurrentUserType,

    @Body()
    dto: UpdateForeignKeyDto,
  ) {
    return this.constraintService.updateForeignKey(
      projectId,
      tableId,
      constraintId,
      user.id,
      dto,
    );
  }

  @Delete('foreign-keys/:constraintId')
  removeForeignKey(
    @Param('projectId')
    projectId: string,

    @Param('tableId')
    tableId: string,

    @Param('constraintId')
    constraintId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.constraintService.removeForeignKey(
      projectId,
      tableId,
      constraintId,
      user.id,
    );
  }
}