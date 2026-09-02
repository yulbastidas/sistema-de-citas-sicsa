import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  role!: 'admin' | 'patient' | 'doctor';

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ default: false })
  canViewReports!: boolean;

  @Column({ type: 'int', default: 0 })
  tokenVersion!: number;
}
