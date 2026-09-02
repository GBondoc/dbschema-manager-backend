import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  conversationId!: string;

  @Column()
  role!: 'user' | 'assistant';

  @Column('text')
  content!: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  sql!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}