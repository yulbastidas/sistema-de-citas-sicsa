import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Specialty {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @Column({ default: true })
  activa!: boolean;
}
