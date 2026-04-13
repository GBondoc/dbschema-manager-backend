import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, MoreThan } from "typeorm";
import { AuthRefreshToken } from "./auth-refresh-token.entity";

@Injectable()
export class AuthRefreshTokensService {
    constructor(
        @InjectRepository(AuthRefreshToken)
        private readonly repo: Repository<AuthRefreshToken>,
    ) {}

    create(data: Partial<AuthRefreshToken>) {
        const row = this.repo.create(data);
        return this.repo.save(row);
    }

    // luăm sesiunile active ale unui user (puține în mod normal)
    findActiveByUserId(userId: number) {
        return this.repo.find({
        where: {
            userId,
            deletedAt: IsNull(),
            expiresAt: MoreThan(new Date()),
        },
        order: { id: 'DESC' },
        take: 25,
        });
    }

    softDeleteById(id: number) {
        return this.repo.update({ id }, { deletedAt: new Date() });
    }

    softDeleteBySessionId(sessionId: string) {
        return this.repo.update({ sessionId }, { deletedAt: new Date() });
    }

    softDeleteAllForUser(userId: number) {
        return this.repo.update({ userId }, { deletedAt: new Date() });
    }
}