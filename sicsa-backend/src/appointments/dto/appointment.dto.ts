import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  fecha: string;

  @IsString()
  hora: string;

  @IsString()
  motivoConsulta: string;

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
}
