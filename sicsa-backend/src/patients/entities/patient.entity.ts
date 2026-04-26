import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  tipoDocumento!: string;

  @Column()
  numeroDocumento!: string;

  @Column()
  primerNombre!: string;

  @Column({ nullable: true })
  segundoNombre!: string;

  @Column()
  primerApellido!: string;

  @Column({ nullable: true })
  segundoApellido!: string;

  @Column()
  telefono!: string;

  @Column()
  email!: string;

  @Column()
  eps!: string;

  @Column({ nullable: true })
  epsId!: number;

  @Column({ nullable: true })
  genero!: string;

  @Column({ nullable: true })
  fechaNacimiento!: string;

  @Column({ nullable: true })
  departamento!: string;

  @Column({ nullable: true })
  municipio!: string;
}
