import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: 'user' | 'assistant';

  @Column('text')
  content: string;

  @Column({ nullable: true })
  mode: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}