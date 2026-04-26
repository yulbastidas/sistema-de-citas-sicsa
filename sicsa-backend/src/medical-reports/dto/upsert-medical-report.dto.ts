import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpsertMedicalReportDto {
  @IsInt()
  appointmentId!: number;

  @IsOptional()
  @IsString()
  enfermedadActual?: string;

  @IsOptional()
  @IsString()
  antecedentes?: string;

  @IsOptional()
  @IsString()
  signosVitales?: string;

  @IsOptional()
  @IsString()
  examenFisico?: string;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsOptional()
  @IsString()
  tratamiento?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  firmaDoctor?: string;
}
