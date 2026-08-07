import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.repo.findOne({
      where: { email },
    });
  }

  create(data: Partial<User>) {
    const user = this.repo.create(data);

    return this.repo.save(user);
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  async findPublicById(id: string) {
    const user = await this.repo.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        displayedName: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }
}