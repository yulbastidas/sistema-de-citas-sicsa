import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @Column()
  fecha: string;

  @Column()
  hora: string;

  @Column({ default: 'pendiente' })
  estado: string;

  @Column({ type: 'text', nullable: true })
  motivoConsulta: string;

  @Column({ nullable: true })
  edad: number;

  @Column({ default: false })
  embarazada: boolean;

  @Column({ default: false })
  discapacidad: boolean;

  @Column({ default: false })
  dolorIntenso: boolean;

  @Column({ default: false })
  sangrado: boolean;

  @Column({ default: false })
  dificultadRespiratoria: boolean;

  @Column({ default: false })
  fiebre: boolean;

  @Column({ default: 'baja' })
  prioridad: string;

  @Column({ default: 0 })
  scorePrioridad: number;

  @Column({ type: 'text', nullable: true })
  explicacionPrioridad: string;
}
