import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

@Entity('mfa_credentials')
@Unique('UQ_mfa_credentials_user', ['userId'])
export class MfaCredential {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'int' }) userId!: number;
  @Column({ type: 'text', select: false }) encryptedSecret!: string;
  @Column({ default: false }) enabled!: boolean;
  @Column({ type: 'datetime', nullable: true }) enrolledAt!: Date | null;
  @Column({ type: 'bigint', nullable: true }) lastUsedTotpStep!: string | null;
  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}
