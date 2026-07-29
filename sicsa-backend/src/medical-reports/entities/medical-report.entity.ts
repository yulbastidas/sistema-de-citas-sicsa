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

  @OneToOne(() => Appointment, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'appointmentId' })
  appointment!: Appointment;

  /**
   * Información general de la consulta.
   */
  @Column({ type: 'text', nullable: true })
  motivoConsulta!: string;

  @Column({ type: 'text', nullable: true })
  enfermedadActual!: string;

  /**
   * Campos antiguos.
   *
   * Se conservan para mantener compatibilidad con reportes
   * que ya fueron guardados anteriormente.
   */
  @Column({ type: 'text', nullable: true })
  antecedentes!: string;

  @Column({ type: 'text', nullable: true })
  signosVitales!: string;

  /**
   * Antecedentes clínicos estructurados.
   */
  @Column({ type: 'text', nullable: true })
  antecedentesPersonales!: string;

  @Column({ type: 'text', nullable: true })
  antecedentesFamiliares!: string;

  @Column({ type: 'text', nullable: true })
  antecedentesQuirurgicos!: string;

  @Column({ type: 'text', nullable: true })
  antecedentesAlergicos!: string;

  @Column({ type: 'text', nullable: true })
  antecedentesFarmacologicos!: string;

  /**
   * Signos vitales estructurados.
   */
  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  presionArterial!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  frecuenciaCardiaca!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  frecuenciaRespiratoria!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  temperatura!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  saturacionOxigeno!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  peso!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  talla!: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  imc!: string;

  /**
   * Valoración médica.
   */
  @Column({ type: 'text', nullable: true })
  examenFisico!: string;

  @Column({ type: 'text', nullable: true })
  diagnostico!: string;

  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  codigoCie10!: string;

  /**
   * Conducta y plan médico.
   */
  @Column({ type: 'text', nullable: true })
  tratamiento!: string;

  @Column({ type: 'text', nullable: true })
  recomendaciones!: string;

  @Column({ type: 'text', nullable: true })
  remision!: string;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;

  @Column({ type: 'text', nullable: true })
  firmaDoctor!: string;
}