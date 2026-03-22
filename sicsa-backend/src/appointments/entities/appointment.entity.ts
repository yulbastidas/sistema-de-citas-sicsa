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

  @Column()
  estado: string; // pendiente, confirmada, cancelada
}
