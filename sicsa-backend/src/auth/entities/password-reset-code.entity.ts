import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('password_reset_codes')
export class PasswordResetCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Index()
  @Column({ length: 150 })
  email!: string;

  @Column({ length: 255 })
  codeHash!: string;

  @Column({ default: false })
  used!: boolean;

  @Column({ type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}