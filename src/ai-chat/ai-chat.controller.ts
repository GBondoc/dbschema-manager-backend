import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

import { AiChatService } from './ai-chat.service';

import { ChatMessageDto } from './dto/chat-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';

import { CurrentUser } from '../auth/decorators/current-user.decorator';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller(
  'projects/:projectId/ai-chat',
)
@UseGuards(AuthGuard('jwt'))
export class AiChatController {
  constructor(
    private readonly aiChatService:
      AiChatService,
  ) {}

  @Post('conversations')
  createConversation(
    @Param('projectId')
    projectId: string,

    @Body()
    dto: CreateConversationDto,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.aiChatService.createConversation(
      projectId,
      user.id,
      dto.title,
    );
  }

  @Get('conversations')
  findConversations(
    @Param('projectId')
    projectId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.aiChatService.findConversations(
      projectId,
      user.id,
    );
  }

  @Get(
    'conversations/:conversationId/messages',
  )
  findMessages(
    @Param('projectId')
    projectId: string,

    @Param('conversationId')
    conversationId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.aiChatService.findMessages(
      projectId,
      conversationId,
      user.id,
    );
  }

  @Post(
    'conversations/:conversationId/messages',
  )
  chat(
    @Param('projectId')
    projectId: string,

    @Param('conversationId')
    conversationId: string,

    @Body()
    dto: ChatMessageDto,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.aiChatService.chat(
      projectId,
      conversationId,
      dto.message,
      user.id,
    );
  }

  @Patch(
    'conversations/:conversationId',
  )
  renameConversation(
    @Param('projectId')
    projectId: string,

    @Param('conversationId')
    conversationId: string,

    @CurrentUser()
    user: CurrentUserType,

    @Body('title')
    title: string,
  ) {
    return this.aiChatService.renameConversation(
      projectId,
      conversationId,
      user.id,
      title,
    );
  }

  @Delete(
    'conversations/:conversationId',
  )
  deleteConversation(
    @Param('projectId')
    projectId: string,

    @Param('conversationId')
    conversationId: string,

    @CurrentUser()
    user: CurrentUserType,
  ) {
    return this.aiChatService.deleteConversation(
      projectId,
      conversationId,
      user.id,
    );
  }
}