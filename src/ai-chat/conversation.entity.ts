import { CreateDateColumn, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}