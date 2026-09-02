import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OtpPurpose } from './otp-purpose';

@Entity('otp_challenge')
@Index('UQ_otp_challenge_active_key', ['activeKey'], { unique: true })
@Index('IDX_otp_challenge_phone_purpose_created', [
  'phoneHash',
  'purpose',
  'createdAt',
])
@Index('IDX_otp_challenge_user_purpose_created', [
  'userId',
  'purpose',
  'createdAt',
])
export class OtpChallenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int' })
  userId!: number;

  @Column({ type: 'varchar', length: 40 })
  purpose!: OtpPurpose;

  @Column({ type: 'char', length: 64, select: false })
  phoneHash!: string;

  @Column({ type: 'varchar', length: 13, select: false })
  phoneE164!: string;

  @Column({ type: 'char', length: 64, select: false })
  ipHash!: string;

  @Column({ type: 'char', length: 64, nullable: true, select: false })
  activeKey!: string | null;

  @Column({ type: 'char', length: 64, select: false })
  codeHash!: string;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @Column({ type: 'datetime' })
  resendAvailableAt!: Date;

  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  attempts!: number;

  @Column({ type: 'datetime', nullable: true })
  consumedAt!: Date | null;

  @Column({ type: 'datetime', nullable: true })
  invalidatedAt!: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
