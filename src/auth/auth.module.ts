import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

import { AuthRefreshTokensModule } from '../auth-refresh-tokens/auth-refresh-tokens.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        AuthRefreshTokensModule,
        RedisModule,
        JwtModule.register({}), // folosim signAsync manual în service
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
