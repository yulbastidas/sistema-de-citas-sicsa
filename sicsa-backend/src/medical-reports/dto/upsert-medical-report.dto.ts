import { Transform } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

const CLINICAL_TEXT_MAX_LENGTH = 10000;
const VITAL_SIGN_MAX_LENGTH = 20;

export class UpsertMedicalReportDto {
  @IsInt()
  @IsPositive()
  appointmentId!: number;

  /**
   * Información general.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  motivoConsulta?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  enfermedadActual?: string;

  /**
   * Campos antiguos conservados por compatibilidad.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentes?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  signosVitales?: string;

  /**
   * Antecedentes clínicos estructurados.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentesPersonales?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentesFamiliares?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentesQuirurgicos?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentesAlergicos?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  antecedentesFarmacologicos?: string;

  /**
   * Signos vitales estructurados.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  presionArterial?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  frecuenciaCardiaca?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  frecuenciaRespiratoria?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  temperatura?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  saturacionOxigeno?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  peso?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  talla?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(VITAL_SIGN_MAX_LENGTH)
  imc?: string;

  /**
   * Valoración médica.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  examenFisico?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  diagnostico?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(30)
  codigoCie10?: string;

  /**
   * Conducta y plan médico.
   */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  tratamiento?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  recomendaciones?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  remision?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(CLINICAL_TEXT_MAX_LENGTH)
  observaciones?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  firmaDoctor?: string;
}
