import { Injectable, ConflictException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { UsersService } from "src/users/users.service";
import { AuthRefreshTokensService } from "src/auth-refresh-tokens/auth-refresh-tokens.service";
import type { StringValue } from 'ms';
import { RedisService } from "src/redis/redis.service";

function generateRefreshToken(): string {
    return crypto.randomBytes(48).toString("base64url");
}
function uuid(): string {
    return crypto.randomUUID();
}

@Injectable()
export class AuthService {
    constructor(
        private readonly users: UsersService,
        private readonly refreshTokens: AuthRefreshTokensService,
        private readonly redis: RedisService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) {}

    async register(email: string, password: string, displayedName?: string) {
        email = email.toLowerCase().trim();

        const existing = await this.users.findByEmail(email);
        if (existing) throw new ConflictException("Email already in use");

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.users.create({
        email,
        hashedPassword,
        displayedName: displayedName?.trim() || null,
        });

        return this.issueTokensAndCreateSession(user.id, user.email);
    }

    async login(email: string, password: string) {
        email = email.toLowerCase().trim();

        const user = await this.users.findByEmail(email);
        if (!user) throw new UnauthorizedException("Invalid credentials");

        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) throw new UnauthorizedException("Invalid credentials");

        return this.issueTokensAndCreateSession(user.id, user.email);
    }

    private async issueTokensAndCreateSession(userId: string, email: string, sessionId?: string) {
        const accessSecret = this.config.get<string>("JWT_ACCESS_SECRET");
        const accessExp = this.config.get<string>("JWT_ACCESS_EXPIRES", "15m") as StringValue;
        const refreshExp = this.config.get<string>("JWT_REFRESH_EXPIRES", "7d");

        if (!accessSecret) throw new Error("JWT_ACCESS_SECRET missing in .env");

        const access_token = await this.jwt.signAsync(
            { sub: userId, email },
            { secret: accessSecret, expiresIn: accessExp },
        );

        const refresh_token = generateRefreshToken();
        const tokenHashed = await bcrypt.hash(refresh_token, 10);

        const sid = sessionId ?? uuid(); // dacă vine din refresh, păstrăm același sessionId
        const jwtId = uuid();
        const expiresAt = new Date(Date.now() + msFromExpires(refreshExp));

        await this.refreshTokens.create({
            userId,
            sessionId: sid,
            jwtId,
            tokenHashed,
            expiresAt,
            createdAt: new Date(),
            updatedAt: new Date(),
            deletedAt: null,
        });

        const ttlSeconds = Math.floor(msFromExpires(refreshExp) / 1000);
        await this.redis.client.set(
            `rt:${sid}`,
            JSON.stringify({ userId, tokenHashed, jwtId }),
            'EX',
            ttlSeconds,
        );

        return { access_token, refresh_token, sessionId: sid };
    }

    async refresh(sessionId: string, refreshToken: string) {
        const raw = await this.redis.client.get(`rt:${sessionId}`);
        if (!raw) throw new UnauthorizedException('Invalid session');

        const data = JSON.parse(raw) as { userId: string; tokenHashed: string; jwtId: string };

        const ok = await bcrypt.compare(refreshToken, data.tokenHashed);
        if (!ok) throw new UnauthorizedException('Invalid refresh token');

        // rotation: generezi refresh nou + hash nou
        const newRefresh = generateRefreshToken();
        const newHash = await bcrypt.hash(newRefresh, 10);
        const newJwtId = uuid();

        const refreshExp = this.config.get<string>('JWT_REFRESH_EXPIRES', '7d');
        const ttlSeconds = Math.floor(msFromExpires(refreshExp) / 1000);

        await this.redis.client.set(
        `rt:${sessionId}`,
        JSON.stringify({ userId: data.userId, tokenHashed: newHash, jwtId: newJwtId }),
        'EX',
        ttlSeconds,
        );

        const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET')!;
        const accessExp = this.config.get<string>('JWT_ACCESS_EXPIRES', '15m') as any;

        const user = await this.users.findById(data.userId);
        if (!user) { throw new UnauthorizedException('User not found'); }

        const access_token = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { secret: accessSecret, expiresIn: accessExp },
        );

        return { access_token, refresh_token: newRefresh, sessionId };
    }

    async logout(sessionId: string) {
        await this.redis.client.del(`rt:${sessionId}`);

        return { success: true };
    }
}

// helper simplu pt "15m", "7d"
function msFromExpires(expires: string): number {
    const m = expires.match(/^(\d+)([smhd])$/i);
    if (!m) throw new Error(`Invalid expires format: ${expires} (use 15m, 7d, 30d etc.)`);
    const n = Number(m[1]);
    const unit = m[2].toLowerCase();
    const mult: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    return n * mult[unit];
}
