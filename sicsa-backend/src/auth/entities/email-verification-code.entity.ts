import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class EmailVerificationCode {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  email!: string;

  @Column()
  code!: string;

  @Column({ default: false })
  used!: boolean;

  @Column({ type: 'datetime' })
  expiresAt!: Date;
}
