import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ColumnService } from './column.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller(
  'projects/:projectId/tables/:tableId/columns',
)
@UseGuards(JwtAuthGuard)
export class ColumnController {
  constructor(
    private readonly columnService:
      ColumnService,
  ) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateColumnDto,
  ) {
    return this.columnService.create(
      projectId,
      tableId,
      user.id,
      dto,
    );
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.columnService.findAll(
      projectId,
      tableId,
      user.id,
    );
  }

  @Get(':columnId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.columnService.findOne(
      projectId,
      tableId,
      columnId,
      user.id,
    );
  }

  @Patch(':columnId')
  update(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.columnService.update(
      projectId,
      tableId,
      columnId,
      user.id,
      dto,
    );
  }

  @Delete(':columnId')
  remove(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.columnService.remove(
      projectId,
      tableId,
      columnId,
      user.id,
    );
  }
}