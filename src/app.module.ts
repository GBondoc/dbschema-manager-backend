import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { AiChatModule } from './ai-chat/ai-chat.module';
import { ProjectModule } from './projects/project.module';
import { ProjectInviteModule } from './project-members/project-invite.module';
import { ProjectMemberModule } from './project-members/project-member.module';
import { TableModule } from './tables/table.module';
import { ColumnModule } from './columns/column.module';
import { ConstraintModule } from './constraints/constraint.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: Number(config.get('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASS'),
        database: config.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: config.get('DB_SYNC') === 'true',
      }),
    }),
    AuthModule,
    RedisModule,
    AiChatModule,
    ProjectModule,
    ProjectInviteModule,
    ProjectMemberModule,
    TableModule,
    ColumnModule,
    ConstraintModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}