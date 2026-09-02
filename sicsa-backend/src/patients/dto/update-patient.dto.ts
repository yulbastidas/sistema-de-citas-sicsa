import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import {
  DOCUMENT_TYPES,
  GENDER_VALUES,
  IsCivilBirthDateConstraint,
  IsValidDocumentNumberConstraint,
  NAME_PATTERN,
  normalizeDocumentNumber,
  normalizeEmail,
  trimString,
} from './patient-validation';

const hasText = (_object: unknown, value: unknown) =>
  value !== undefined && value !== null && value !== '';

export class UpdateMyPatientDto {
  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El celular debe ser texto' })
  @Matches(/^3\d{9}$/, {
    message:
      'Ingresa un celular colombiano válido de 10 dígitos que comience por 3',
  })
  telefono?: string;

  @Transform(({ value }) => normalizeEmail(value as unknown))
  @ValidateIf(hasText)
  @IsString({ message: 'El correo electrónico debe ser texto' })
  @MaxLength(150, {
    message: 'El correo electrónico no puede superar 150 caracteres',
  })
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido' })
  email?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El departamento debe ser texto' })
  @MaxLength(100, {
    message: 'El departamento no puede superar 100 caracteres',
  })
  departamento?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El municipio debe ser texto' })
  @MaxLength(100, { message: 'El municipio no puede superar 100 caracteres' })
  municipio?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'La dirección debe ser texto' })
  @MaxLength(255, { message: 'La dirección no puede superar 255 caracteres' })
  direccion?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El tipo de sangre debe ser texto' })
  @MaxLength(10, {
    message: 'El tipo de sangre no puede superar 10 caracteres',
  })
  tipoSangre?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El factor RH debe ser texto' })
  @MaxLength(20, { message: 'El factor RH no puede superar 20 caracteres' })
  factorRh?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'Las alergias deben ser texto' })
  @MaxLength(2000, {
    message: 'Las alergias no pueden superar 2000 caracteres',
  })
  alergias?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'Las enfermedades crónicas deben ser texto' })
  @MaxLength(2000, {
    message: 'Las enfermedades crónicas no pueden superar 2000 caracteres',
  })
  enfermedadesCronicas?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El nombre del contacto debe ser texto' })
  @MinLength(2, {
    message: 'El nombre del contacto debe tener mínimo 2 caracteres',
  })
  @MaxLength(120, {
    message: 'El nombre del contacto no puede superar 120 caracteres',
  })
  @Matches(NAME_PATTERN, {
    message:
      'El nombre del contacto solo puede contener letras, espacios, guiones o apóstrofes',
  })
  contactoEmergenciaNombre?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El teléfono del contacto debe ser texto' })
  @Matches(/^[0-9 +()-]{7,20}$/, {
    message: 'Ingresa un teléfono de contacto válido',
  })
  contactoEmergenciaTelefono?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El parentesco debe ser texto' })
  @MaxLength(60, { message: 'El parentesco no puede superar 60 caracteres' })
  contactoEmergenciaParentesco?: string;
}

export class UpdatePatientByAdminDto extends UpdateMyPatientDto {
  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @IsIn(DOCUMENT_TYPES, {
    message: 'El tipo de documento debe ser CC, TI, CE, RC o PASAPORTE',
  })
  tipoDocumento?: string;

  @Transform(({ value, obj }) =>
    normalizeDocumentNumber(
      value as unknown,
      (obj as { tipoDocumento?: unknown }).tipoDocumento,
    ),
  )
  @ValidateIf(hasText)
  @IsString({ message: 'El número de documento debe ser texto' })
  @Validate(IsValidDocumentNumberConstraint)
  numeroDocumento?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El primer nombre debe ser texto' })
  @MinLength(2, { message: 'El primer nombre debe tener mínimo 2 caracteres' })
  @MaxLength(60, { message: 'El primer nombre no puede superar 60 caracteres' })
  @Matches(NAME_PATTERN, {
    message:
      'El primer nombre solo puede contener letras, espacios, guiones o apóstrofes',
  })
  primerNombre?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El segundo nombre debe ser texto' })
  @MinLength(2, { message: 'El segundo nombre debe tener mínimo 2 caracteres' })
  @MaxLength(60, {
    message: 'El segundo nombre no puede superar 60 caracteres',
  })
  @Matches(NAME_PATTERN, {
    message:
      'El segundo nombre solo puede contener letras, espacios, guiones o apóstrofes',
  })
  segundoNombre?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El primer apellido debe ser texto' })
  @MinLength(2, {
    message: 'El primer apellido debe tener mínimo 2 caracteres',
  })
  @MaxLength(60, {
    message: 'El primer apellido no puede superar 60 caracteres',
  })
  @Matches(NAME_PATTERN, {
    message:
      'El primer apellido solo puede contener letras, espacios, guiones o apóstrofes',
  })
  primerApellido?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El segundo apellido debe ser texto' })
  @MinLength(2, {
    message: 'El segundo apellido debe tener mínimo 2 caracteres',
  })
  @MaxLength(60, {
    message: 'El segundo apellido no puede superar 60 caracteres',
  })
  @Matches(NAME_PATTERN, {
    message:
      'El segundo apellido solo puede contener letras, espacios, guiones o apóstrofes',
  })
  segundoApellido?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'La EPS debe ser texto' })
  @MaxLength(150, { message: 'La EPS no puede superar 150 caracteres' })
  eps?: string;

  @ValidateIf((_object, value) => value !== undefined)
  @IsInt({ message: 'epsId debe ser un número entero' })
  @Min(1, { message: 'epsId debe ser mayor que cero' })
  epsId?: number;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'El género debe ser texto' })
  @IsIn(GENDER_VALUES, {
    message:
      'El género debe ser Femenino, Masculino, Otro o Prefiero no decirlo',
  })
  genero?: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf(hasText)
  @IsString({ message: 'La fecha de nacimiento debe ser texto' })
  @Validate(IsCivilBirthDateConstraint)
  fechaNacimiento?: string;
}
