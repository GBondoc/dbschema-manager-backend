import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly repo: Repository<Project>,
  ) {}

  async create(
    dto: CreateProjectDto,
    ownerUserId: string,
  ) {
    const project = this.repo.create({
      ...dto,
      ownerUserId,
    });

    return this.repo.save(project);
  }

  findAll(ownerUserId: string) {
    return this.repo.find({
      where: {
        ownerUserId,
      },
    });
  }

  async findOne(
    id: string,
    ownerUserId: string,
  ) {
    const project = await this.repo.findOne({
      where: {
        id,
        ownerUserId,
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    ownerUserId: string,
  ) {
    const project = await this.findOne(id, ownerUserId);

    Object.assign(project, dto);

    return this.repo.save(project);
  }

  async remove(
    id: string,
    ownerUserId: string,
  ) {
    const project = await this.findOne(id, ownerUserId);

    return this.repo.softRemove(project);
  }
}