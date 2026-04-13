import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthRefreshToken } from './auth-refresh-token.entity';
import { AuthRefreshTokensService } from './auth-refresh-tokens.service';

@Module({
    imports: [TypeOrmModule.forFeature([AuthRefreshToken])],
    providers: [AuthRefreshTokensService],
    exports: [AuthRefreshTokensService],
})
export class AuthRefreshTokensModule {}
