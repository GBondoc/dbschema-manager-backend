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

import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller('projects/:projectId/tables')
@UseGuards(JwtAuthGuard)
export class TableController {
  constructor(
    private readonly tableService: TableService,
  ) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateTableDto,
  ) {
    return this.tableService.create(
      projectId,
      user.id,
      dto,
    );
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tableService.findAll(
      projectId,
      user.id,
    );
  }

  @Get(':tableId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tableService.findOne(
      projectId,
      tableId,
      user.id,
    );
  }

  @Patch(':tableId')
  update(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserType,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tableService.update(
      projectId,
      tableId,
      user.id,
      dto,
    );
  }

  @Delete(':tableId')
  remove(
    @Param('projectId') projectId: string,
    @Param('tableId') tableId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.tableService.remove(
      projectId,
      tableId,
      user.id,
    );
  }
}