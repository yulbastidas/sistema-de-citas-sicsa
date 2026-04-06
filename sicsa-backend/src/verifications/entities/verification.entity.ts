import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Verification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  patientId!: number;

  @Column({ type: 'varchar', length: 50 })
  documento!: string;

  @Column({ type: 'varchar', length: 100 })
  eps!: string;

  @Column({ type: 'varchar', length: 30, default: 'pendiente' })
  estado!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motivoRechazo!: string | null;

  @Column({ type: 'int', nullable: true })
  adminId!: number | null;

  @Column({ type: 'datetime', nullable: true })
  fechaExpiracion!: Date | null;
}
