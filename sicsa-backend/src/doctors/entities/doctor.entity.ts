import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  nombre!: string;

  @Column()
  especialidadId!: number;

  @Column({ nullable: true })
  registroMedico!: string;

  @Column({ nullable: true })
  consultorio!: string;

  @Column({ default: true })
  activo!: boolean;
}
