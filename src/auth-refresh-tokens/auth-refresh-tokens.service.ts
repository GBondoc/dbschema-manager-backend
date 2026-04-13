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

    findOneActiveBySessionId(sessionId: string) {
        return this.repo.findOne({
        where: {
            sessionId,
            deletedAt: IsNull(),
            expiresAt: MoreThan(new Date()),
        },
        order: { id: "DESC" },
        });
    }

    softDeleteById(id: string) {
        return this.repo.update({ id }, { deletedAt: new Date(), updatedAt: new Date() });
    }

    softDeleteBySessionId(sessionId: string) {
        return this.repo.update({ sessionId }, { deletedAt: new Date(), updatedAt: new Date() });
    }
}
