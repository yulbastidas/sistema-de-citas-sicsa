import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: number;

  @Column({ nullable: true })
  doctorId!: number;

  @Column({ nullable: true })
  specialtyId!: number;

  @Column()
  fecha!: string;

  @Column()
  hora!: string;

  @Column({ default: 'pendiente' })
  estado!: string;

  @Column({ type: 'text', nullable: true })
  motivoConsulta!: string;

  @Column({ nullable: true })
  edad!: number;

  @Column({ default: false })
  embarazada!: boolean;

  @Column({ default: false })
  discapacidad!: boolean;

  @Column({ default: false })
  dolorIntenso!: boolean;

  @Column({ default: false })
  sangrado!: boolean;

  @Column({ default: false })
  dificultadRespiratoria!: boolean;

  @Column({ default: false })
  fiebre!: boolean;

  @Column({ default: 'baja' })
  prioridad!: string;

  @Column({ default: 0 })
  scorePrioridad!: number;

  @Column({ type: 'text', nullable: true })
  explicacionPrioridad!: string;

  // 🔥 NUEVO (lo que faltaba del sistema real)

  @Column({ nullable: true })
  eps!: string;

  @Column({ nullable: true })
  epsId!: number;

  @Column({ nullable: true })
  departamento!: string;

  @Column({ nullable: true })
  municipio!: string;

  @Column({ nullable: true })
  appointmentClassId!: number;

  @Column({ type: 'text', nullable: true })
  observaciones!: string;
  @Column({ nullable: true })
  approvedByAdminId!: number;

  @Column({ type: 'datetime', nullable: true })
  approvedAt!: Date;
  @Column({ nullable: true })
  ordenMedicaUrl?: string;
}
