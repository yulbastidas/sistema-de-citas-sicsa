import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  fecha!: string;

  @IsString()
  hora!: string;

  @IsString()
  motivoConsulta!: string;

  @IsInt()
  specialtyId!: number;

  @IsOptional()
  @IsInt()
  edad?: number;

  @IsOptional()
  @IsBoolean()
  embarazada?: boolean;

  @IsOptional()
  @IsBoolean()
  discapacidad?: boolean;

  @IsOptional()
  @IsBoolean()
  dolorIntenso?: boolean;

  @IsOptional()
  @IsBoolean()
  sangrado?: boolean;

  @IsOptional()
  @IsBoolean()
  dificultadRespiratoria?: boolean;

  @IsOptional()
  @IsBoolean()
  fiebre?: boolean;

  @IsOptional()
  @IsString()
  eps?: string;

  @IsOptional()
  @IsInt()
  epsId?: number;

  @IsOptional()
  @IsString()
  departamento?: string;

  @IsOptional()
  @IsString()
  municipio?: string;

  @IsOptional()
  @IsInt()
  appointmentClassId?: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
  @IsOptional()
  @IsString()
  ordenMedicaUrl?: string;
}
