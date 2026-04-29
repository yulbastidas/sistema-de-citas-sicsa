export class CreateUserDto {
  email!: string;
  password!: string;
  role!: 'admin' | 'patient' | 'doctor';

  tipoDocumento?: string;
  numeroDocumento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  telefono?: string;
  eps?: string;
}
