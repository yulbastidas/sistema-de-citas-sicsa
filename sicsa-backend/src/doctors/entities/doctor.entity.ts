import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Specialty } from '../../specialties/entities/specialty.entity';

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

  @ManyToOne(() => Specialty, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({ name: 'especialidadId' })
  especialidad!: Specialty;

  @Column({ nullable: true })
  registroMedico!: string;

  @Column({ nullable: true })
  consultorio!: string;

  @Column({ default: true })
  activo!: boolean;
}