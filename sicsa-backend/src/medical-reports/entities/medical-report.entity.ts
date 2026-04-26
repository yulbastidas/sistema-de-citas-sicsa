import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Appointment } from '../../appointments/entities/appointment.entity';

@Entity('medical_reports')
export class MedicalReport {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  appointmentId!: number;

  @OneToOne(() => Appointment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  @Column({ type: 'text', nullable: true })
  enfermedadActual!: string;

  @Column({ type: 'text', nullable: true })
  antecedentes!: string;

  @Column({ type: 'text', nullable: true })
  signosVitales!: string;

  @Column({ type: 'text', nullable: true })
  examenFisico!: string;

  @Column({ type: 'text', nullable: true })
  diagnostico!: string;

  @Column({ type: 'text', nullable: true })
  tratamiento!: string;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @Column({ type: 'text', nullable: true })
  firmaDoctor!: string;
}
