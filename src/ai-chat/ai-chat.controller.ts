import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

type CurrentUserType = {
  id: string;
  email: string;
};

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('chat')
  async chat(
    @Body() dto: ChatMessageDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return this.aiChatService.chat(dto.message, user.id);
  }
}