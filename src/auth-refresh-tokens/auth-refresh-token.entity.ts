import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'AuthRefreshTokens' })
export class AuthRefreshToken {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userId: number;

    @Column({ type: 'uuid' })
    sessionId: string;

    @Column()
    tokenHashed: string;

    @Column({ type: 'uuid' })
    jwtId: string;

    @Column({ type: 'timestamp' })
    expiresAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    updatedAt: Date;

    @Column({ type: 'timestamp', nullable: true })
    deletedAt: Date | null;
}
