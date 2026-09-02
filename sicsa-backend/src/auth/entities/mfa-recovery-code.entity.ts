import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mfa_recovery_codes')
@Index('IDX_mfa_recovery_user_unused', ['userId', 'usedAt'])
export class MfaRecoveryCode {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'int' }) userId!: number;
  @Column({ length: 255, select: false }) codeHash!: string;
  @Column({ type: 'datetime', nullable: true }) usedAt!: Date | null;
  @CreateDateColumn() createdAt!: Date;
}
