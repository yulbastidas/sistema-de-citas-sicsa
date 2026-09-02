import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

export class CreateAdminAppointmentDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  documento!: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener formato YYYY-MM-DD',
  })
  fecha!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'La hora debe tener formato HH:mm',
  })
  hora!: string;

  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'El motivo de consulta es obligatorio' })
  @MinLength(3)
  @MaxLength(1500)
  motivoConsulta!: string;

  @IsInt()
  @IsPositive()
  specialtyId!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120)
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
  @Trim()
  @IsString()
  @MaxLength(150)
  eps?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  epsId?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  departamento?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(100)
  municipio?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  appointmentClassId?: number;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(3000)
  observaciones?: string;

  // Requerido solo cuando appointmentClassId sea 4 (radiología)
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2048)
  ordenMedicaUrl?: string;
}
