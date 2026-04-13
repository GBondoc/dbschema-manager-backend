import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from './chat-message.entity';

@Injectable()
export class AiChatService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) {}

  async chat(message: string, userId: string) {
    await this.chatMessageRepository.save({
      role: 'user',
      content: message,
      mode: 'explanation',
      userId,
    });

    const prompt = this.buildPrompt(message);
    const response = await this.callLLM(prompt);
    const formatted = this.formatResponse(response);

    await this.chatMessageRepository.save({
      role: 'assistant',
      content: formatted.explanation ?? '',
      mode: formatted.mode,
      userId,
    });

    return formatted;
  }

  private buildPrompt(message: string) {
    return `
You are a database tutor AI for 12th grade students.

You help students:
- understand database concepts
- learn SQL
- get simple and correct examples

Rules:
- explain clearly
- if relevant, provide SQL
- keep answers beginner-friendly
- return ONLY valid JSON

User question:
${message}

Return ONLY this JSON format:
{
  "mode": "explanation",
  "explanation": "...",
  "sql": "..."
}
`;
  }

  private async callLLM(prompt: string) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('OPENAI_API_KEY is missing');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a friendly database tutor. Always return valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `LLM request failed: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new InternalServerErrorException('Empty response from LLM');
    }

    try {
      return JSON.parse(content);
    } catch {
      return {
        mode: 'explanation',
        explanation: content,
        sql: null,
      };
    }
  }

  private formatResponse(response: any) {
    return {
      mode: response.mode ?? 'explanation',
      explanation: response.explanation ?? null,
      sql: response.sql ?? null,
    };
  }
}