import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ChatMessage } from './chat-message.entity';
import { Conversation } from './conversation.entity';

import { Project } from '../projects/project.entity';

import {
  ProjectMember,
} from '../project-members/project-member.entity';

import { TUTOR_SYSTEM_PROMPT } from './prompts/tutor.prompt';

import {
  SchemaContextTool,
} from './tools/schema-context.tool';

type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type TutorResponse = {
  explanation: string;
  sql: string | null;
};

@Injectable()
export class AiChatService {
  constructor(
    private readonly configService:
      ConfigService,

    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository:
      Repository<ChatMessage>,

    @InjectRepository(Conversation)
    private readonly conversationRepository:
      Repository<Conversation>,

    @InjectRepository(Project)
    private readonly projectRepository:
      Repository<Project>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepository:
      Repository<ProjectMember>,

    private readonly schemaContextTool:
      SchemaContextTool,
  ) {}

  private async requireProjectAccess(
    projectId: string,
    userId: string,
  ): Promise<Project> {
    const project =
      await this.projectRepository.findOne({
        where: {
          id: projectId,
        },
      });

    if (!project) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    if (
      project.ownerUserId === userId
    ) {
      return project;
    }

    const membership =
      await this.projectMemberRepository.findOne({
        where: {
          projectId,
          userId,
        },
      });

    if (!membership) {
      throw new NotFoundException(
        'Project not found',
      );
    }

    return project;
  }

  private async requireConversationAccess(
    projectId: string,
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation =
      await this.conversationRepository.findOne({
        where: {
          id: conversationId,
          projectId,
        },
      });

    if (!conversation) {
      throw new NotFoundException(
        'Conversation not found',
      );
    }

    if (
      conversation.userId !== userId
    ) {
      throw new ForbiddenException(
        'You do not have access to this conversation',
      );
    }

    return conversation;
  }

  async createConversation(
    projectId: string,
    userId: string,
    title?: string,
  ) {
    await this.requireProjectAccess(
      projectId,
      userId,
    );

    const conversation =
      this.conversationRepository.create({
        projectId,
        userId,
        title:
          title?.trim() || null,
      });

    return this.conversationRepository.save(
      conversation,
    );
  }

  async findConversations(
    projectId: string,
    userId: string,
  ) {
    await this.requireProjectAccess(
      projectId,
      userId,
    );

    return this.conversationRepository.find({
      where: {
        projectId,
        userId,
      },
      order: {
        updatedAt: 'DESC',
      },
    });
  }

  async findMessages(
    projectId: string,
    conversationId: string,
    userId: string,
  ) {
    await this.requireProjectAccess(
      projectId,
      userId,
    );

    await this.requireConversationAccess(
      projectId,
      conversationId,
      userId,
    );

    return this.chatMessageRepository.find({
      where: {
        conversationId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async chat(
    projectId: string,
    conversationId: string,
    message: string,
    userId: string,
  ) {
    await this.requireProjectAccess(
      projectId,
      userId,
    );

    const conversation =
      await this.requireConversationAccess(
        projectId,
        conversationId,
        userId,
      );

    const schemaContext =
      await this.schemaContextTool.build(
        projectId,
      );

    const history =
      await this.chatMessageRepository.find({
        where: {
          conversationId,
        },
        order: {
          createdAt: 'ASC',
        },
      });

    const userMessage =
      this.chatMessageRepository.create({
        conversationId,
        role: 'user',
        content: message.trim(),
        sql: null,
      });

    await this.chatMessageRepository.save(
      userMessage,
    );

    if (!conversation.title) {
      const title =
        message.trim().length > 60
          ? `${message.trim().slice(0, 57)}...`
          : message.trim();

      conversation.title = title;
    }

    const llmMessages: LlmMessage[] = [
      {
        role: 'system',
        content: TUTOR_SYSTEM_PROMPT,
      },

      ...history.map(
        (historyMessage): LlmMessage => ({
          role: historyMessage.role,
          content:
            this.buildHistoryContent(
              historyMessage,
            ),
        }),
      ),

      {
        role: 'system',
        content: `CURRENT PROJECT SCHEMA:

      ${schemaContext}

      IMPORTANT:
      This is the current state of the student's project.
      For any fact about the current database structure, this schema overrides conflicting or outdated information from the conversation history.`,
      },

      {
        role: 'user',
        content: message.trim(),
      },
    ];

    let tutorResponse: TutorResponse;

    try {
      tutorResponse =
        await this.callLLM(
          llmMessages,
        );
    } catch (error) {
      await this.chatMessageRepository.delete(
        userMessage.id,
      );

      throw error;
    }

    const assistantMessage =
      this.chatMessageRepository.create({
        conversationId,
        role: 'assistant',
        content:
          tutorResponse.explanation,
        sql:
          tutorResponse.sql,
      });

    await this.chatMessageRepository.save(
      assistantMessage,
    );

    if (!conversation.title) {
      const trimmedMessage = message.trim();

      conversation.title =
        trimmedMessage.length > 60
          ? `${trimmedMessage.slice(0, 57)}...`
          : trimmedMessage;
    }

    conversation.updatedAt = new Date();

    await this.conversationRepository.save(
      conversation,
    );

    conversation.updatedAt =
      new Date();

    await this.conversationRepository.save(
      conversation,
    );

    return {
      conversationId:
        conversation.id,

      message: assistantMessage,
    };
  }

  private buildHistoryContent(
    message: ChatMessage,
  ): string {
    if (
      message.role === 'assistant' &&
      message.sql
    ) {
      return `${message.content}

SQL:
${message.sql}`;
    }

    return message.content;
  }

  private async callLLM(
    messages: LlmMessage[],
  ): Promise<TutorResponse> {
    const apiKey =
      this.configService.get<string>(
        'OPENAI_API_KEY',
      );

    const model =
      this.configService.get<string>(
        'OPENAI_MODEL',
      ) ?? 'gpt-5.4-mini';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'OPENAI_API_KEY is missing',
      );
    }

    const response =
      await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${apiKey}`,

            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            model,

            temperature: 0.2,

            messages,

            response_format: {
              type: 'json_schema',

              json_schema: {
                name:
                  'database_tutor_response',

                strict: true,

                schema: {
                  type: 'object',

                  properties: {
                    explanation: {
                      type: 'string',
                    },

                    sql: {
                      type: [
                        'string',
                        'null',
                      ],
                    },
                  },

                  required: [
                    'explanation',
                    'sql',
                  ],

                  additionalProperties:
                    false,
                },
              },
            },
          }),
        },
      );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new InternalServerErrorException(
        `LLM request failed: ${response.status} ${errorText}`,
      );
    }

    const data =
      await response.json();

    const content =
      data?.choices?.[0]?.message
        ?.content;

    if (!content) {
      throw new InternalServerErrorException(
        'Empty response from LLM',
      );
    }

    try {
      const parsed =
        JSON.parse(
          content,
        ) as TutorResponse;

      return {
        explanation:
          parsed.explanation,

        sql:
          parsed.sql ?? null,
      };
    } catch {
      throw new InternalServerErrorException(
        'Invalid structured response from LLM',
      );
    }
  }

  async renameConversation(
    projectId: string,
    conversationId: string,
    userId: string,
    title: string,
  ) {
    const conversation =
      await this.requireConversationAccess(
        projectId,
        conversationId,
        userId,
      );

    const trimmedTitle =
      title.trim();

    if (!trimmedTitle) {
      throw new BadRequestException(
        'Conversation title cannot be empty',
      );
    }

    conversation.title =
      trimmedTitle.slice(0, 100);

    return this.conversationRepository.save(
      conversation,
    );
  }

  async deleteConversation(
    projectId: string,
    conversationId: string,
    userId: string,
  ) {
    const conversation =
      await this.requireConversationAccess(
        projectId,
        conversationId,
        userId,
      );

    await this.conversationRepository.remove(
      conversation,
    );

    return {
      success: true,
    };
  }
}