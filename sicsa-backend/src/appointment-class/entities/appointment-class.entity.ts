import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('appointment_class')
export class AppointmentClass {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 150 })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;
}
