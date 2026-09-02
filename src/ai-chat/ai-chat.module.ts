import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { Conversation } from './conversation.entity';
import { SchemaContextTool } from './tools/schema-context.tool';
import { ConstraintColumn } from 'src/constraints/constraint-column.entity';
import { Project } from 'src/projects/project.entity';
import { ProjectMember } from 'src/project-members/project-member.entity';
import { Table } from '../tables/table.entity';
import { DbColumn } from 'src/columns/column.entity';
import { Constraint } from 'src/constraints/constraint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
  ChatMessage,
  Conversation,
  Project,
  ProjectMember,
  Table,
  DbColumn,
  Constraint,
  ConstraintColumn,
])
  ],
  controllers: [AiChatController],
    providers: [
    AiChatService,
    SchemaContextTool,
  ],
})
export class AiChatModule {}