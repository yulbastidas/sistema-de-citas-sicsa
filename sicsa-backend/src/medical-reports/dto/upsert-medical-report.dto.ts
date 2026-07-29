import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpsertMedicalReportDto {
  @IsInt()
  appointmentId!: number;

  /**
   * Información general.
   */
  @IsOptional()
  @IsString()
  motivoConsulta?: string;

  @IsOptional()
  @IsString()
  enfermedadActual?: string;

  /**
   * Campos antiguos conservados por compatibilidad.
   */
  @IsOptional()
  @IsString()
  antecedentes?: string;

  @IsOptional()
  @IsString()
  signosVitales?: string;

  /**
   * Antecedentes clínicos estructurados.
   */
  @IsOptional()
  @IsString()
  antecedentesPersonales?: string;

  @IsOptional()
  @IsString()
  antecedentesFamiliares?: string;

  @IsOptional()
  @IsString()
  antecedentesQuirurgicos?: string;

  @IsOptional()
  @IsString()
  antecedentesAlergicos?: string;

  @IsOptional()
  @IsString()
  antecedentesFarmacologicos?: string;

  /**
   * Signos vitales estructurados.
   */
  @IsOptional()
  @IsString()
  presionArterial?: string;

  @IsOptional()
  @IsString()
  frecuenciaCardiaca?: string;

  @IsOptional()
  @IsString()
  frecuenciaRespiratoria?: string;

  @IsOptional()
  @IsString()
  temperatura?: string;

  @IsOptional()
  @IsString()
  saturacionOxigeno?: string;

  @IsOptional()
  @IsString()
  peso?: string;

  @IsOptional()
  @IsString()
  talla?: string;

  @IsOptional()
  @IsString()
  imc?: string;

  /**
   * Valoración médica.
   */
  @IsOptional()
  @IsString()
  examenFisico?: string;

  @IsOptional()
  @IsString()
  diagnostico?: string;

  @IsOptional()
  @IsString()
  codigoCie10?: string;

  /**
   * Conducta y plan médico.
   */
  @IsOptional()
  @IsString()
  tratamiento?: string;

  @IsOptional()
  @IsString()
  recomendaciones?: string;

  @IsOptional()
  @IsString()
  remision?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsString()
  firmaDoctor?: string;
}