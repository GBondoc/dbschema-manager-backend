import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

import { AuthRefreshTokensModule } from '../auth-refresh-tokens/auth-refresh-tokens.module';
import { UsersModule } from 'src/users/users.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    UsersModule,
    AuthRefreshTokensModule,
    RedisModule,
    JwtModule.register({}),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}