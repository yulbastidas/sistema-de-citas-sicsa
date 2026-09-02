import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mfa_challenges')
@Index('IDX_mfa_challenge_token', ['tokenHash'], { unique: true })
@Index('IDX_mfa_challenge_user', ['userId', 'usedAt'])
export class MfaChallenge {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'int' }) userId!: number;
  @Column({ length: 64 }) tokenHash!: string;
  @Column({ length: 20 }) purpose!: 'enroll' | 'login';
  @Column({ type: 'datetime' }) expiresAt!: Date;
  @Column({ type: 'datetime', nullable: true }) usedAt!: Date | null;
  @Column({ type: 'int', default: 0 }) attempts!: number;
  @CreateDateColumn() createdAt!: Date;
}
