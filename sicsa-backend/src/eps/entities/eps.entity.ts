import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('eps')
export class Eps {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 150 })
  nombre!: string;

  @Column({ default: true })
  activo!: boolean;
}
