import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;
}