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

export class CreateAppointmentDto {
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
  @MinLength(3, {
    message: 'El motivo de consulta debe tener al menos 3 caracteres',
  })
  @MaxLength(1500, {
    message: 'El motivo de consulta no puede superar 1500 caracteres',
  })
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
  @MaxLength(3000, {
    message: 'Las observaciones no pueden superar 3000 caracteres',
  })
  observaciones?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(2048)
  ordenMedicaUrl?: string;
}
