import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
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
} from '../../patients/dto/patient-validation';

export class RegisterDto {
  @Transform(({ value }) => normalizeEmail(value as unknown))
  @IsString({ message: 'El correo electrónico debe ser texto' })
  @IsNotEmpty({ message: 'El correo electrónico es obligatorio' })
  @MaxLength(150, {
    message: 'El correo electrónico no puede superar 150 caracteres',
  })
  @IsEmail({}, { message: 'Ingresa un correo electrónico válido' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'El tipo de documento debe ser texto' })
  @IsIn(DOCUMENT_TYPES, {
    message: 'El tipo de documento debe ser CC, TI, CE, RC o PASAPORTE',
  })
  tipoDocumento!: string;

  @Transform(({ value, obj }) =>
    normalizeDocumentNumber(
      value as unknown,
      (obj as { tipoDocumento?: unknown }).tipoDocumento,
    ),
  )
  @IsString({ message: 'El número de documento debe ser texto' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  @Validate(IsValidDocumentNumberConstraint)
  numeroDocumento!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'El primer nombre debe ser texto' })
  @MinLength(2, { message: 'El primer nombre debe tener mínimo 2 caracteres' })
  @MaxLength(60, { message: 'El primer nombre no puede superar 60 caracteres' })
  @Matches(NAME_PATTERN, {
    message:
      'El primer nombre solo puede contener letras, espacios, guiones o apóstrofes',
  })
  primerNombre!: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf((_, value) => value !== undefined && value !== '')
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
  primerApellido!: string;

  @Transform(({ value }) => trimString(value))
  @ValidateIf((_, value) => value !== undefined && value !== '')
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
  @IsString({ message: 'El celular debe ser texto' })
  @Matches(/^3\d{9}$/, {
    message:
      'Ingresa un celular colombiano válido de 10 dígitos que comience por 3',
  })
  telefono!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'La EPS debe ser texto' })
  @IsNotEmpty({ message: 'La EPS es obligatoria' })
  @MaxLength(150, { message: 'La EPS no puede superar 150 caracteres' })
  eps!: string;

  @IsInt({ message: 'Debes seleccionar una EPS válida' })
  @Min(1, { message: 'Debes seleccionar una EPS válida' })
  epsId!: number;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'El género debe ser texto' })
  @IsIn(GENDER_VALUES, {
    message:
      'El género debe ser Femenino, Masculino, Otro o Prefiero no decirlo',
  })
  genero!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'La fecha de nacimiento debe ser texto' })
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @Validate(IsCivilBirthDateConstraint)
  fechaNacimiento!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'El departamento debe ser texto' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  @MaxLength(100, {
    message: 'El departamento no puede superar 100 caracteres',
  })
  departamento!: string;

  @Transform(({ value }) => trimString(value))
  @IsString({ message: 'El municipio debe ser texto' })
  @IsNotEmpty({ message: 'El municipio es obligatorio' })
  @MaxLength(100, { message: 'El municipio no puede superar 100 caracteres' })
  municipio!: string;
}
