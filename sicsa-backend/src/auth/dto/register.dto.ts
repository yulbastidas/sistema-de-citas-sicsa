import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

// --- VALIDADOR PERSONALIZADO PARA LA FECHA ---
@ValidatorConstraint({ name: 'isRealBirthDate', async: false })
export class IsRealBirthDateConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    const birthDate = new Date(value);
    const today = new Date();
    // Si la fecha es inválida, no pasa
    if (isNaN(birthDate.getTime())) return false;

    // No puede ser una fecha futura
    if (birthDate > today) return false;

    // No puede tener más de 120 años
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    if (birthDate < minDate) return false;

    return true;
  }

  defaultMessage() {
    return 'La fecha de nacimiento no es válida (no puede ser futura ni mayor a 120 años)';
  }
}

export class RegisterDto {
  @IsEmail({}, { message: 'Correo electrónico no válido' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString({ message: 'Tipo de documento inválido' })
  @IsNotEmpty({ message: 'El tipo de documento es obligatorio' })
  tipoDocumento!: string;

  @IsString({ message: 'Número de documento inválido' })
  @IsNotEmpty({ message: 'El número de documento es obligatorio' })
  numeroDocumento!: string;

  @IsString({ message: 'El primer nombre es obligatorio' })
  @IsNotEmpty({ message: 'El primer nombre es obligatorio' })
  primerNombre!: string;

  @IsOptional()
  @IsString({ message: 'El segundo nombre debe ser texto' })
  segundoNombre?: string;

  @IsString({ message: 'El primer apellido es obligatorio' })
  @IsNotEmpty({ message: 'El primer apellido es obligatorio' })
  primerApellido!: string;

  @IsOptional()
  @IsString({ message: 'El segundo apellido debe ser texto' })
  segundoApellido?: string;

  @IsString({ message: 'El teléfono es obligatorio' })
  @IsNotEmpty({ message: 'El teléfono es obligatorio' })
  telefono!: string;

  @IsString({ message: 'La EPS es obligatoria' })
  @IsNotEmpty({ message: 'La EPS es obligatoria' })
  eps!: string;

  @IsOptional()
  @IsInt({ message: 'epsId debe ser numérico' })
  epsId?: number;

  @IsString({ message: 'El género es obligatorio' })
  @IsNotEmpty({ message: 'El género es obligatorio' })
  genero!: string;

  // --- VALIDACIÓN APLICADA AQUÍ ---
  @IsNotEmpty({ message: 'La fecha de nacimiento es obligatoria' })
  @IsString({ message: 'La fecha de nacimiento debe ser un texto válido' })
  @Validate(IsRealBirthDateConstraint)
  fechaNacimiento!: string;

  @IsString({ message: 'El departamento es obligatorio' })
  @IsNotEmpty({ message: 'El departamento es obligatorio' })
  departamento!: string;

  @IsString({ message: 'El municipio es obligatorio' })
  @IsNotEmpty({ message: 'El municipio es obligatorio' })
  municipio!: string;
}
