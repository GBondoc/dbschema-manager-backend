import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from './chat-message.entity';
import { Conversation } from './conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, Conversation])],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}