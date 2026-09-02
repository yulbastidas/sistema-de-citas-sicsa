export type EpsItem = {
  id: number;
  nombre: string;
  activo?: boolean;
};

export type DepartmentItem = {
  id: number;
  name: string;
};

export type CityItem = {
  id: number;
  name: string;
};

export type PatientRegisterFormData = {
  email: string;
  tipoDocumento: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  eps: string;
  epsId: string;
  genero: string;
  fechaNacimiento: string;
  departamento: string;
  departamentoId: string;
  municipio: string;
  municipioId: string;
};

export type PatientRegisterErrors = Partial<
  Record<
    | "tipoDocumento"
    | "email"
    | "numeroDocumento"
    | "primerNombre"
    | "segundoNombre"
    | "primerApellido"
    | "segundoApellido"
    | "telefono"
    | "fechaNacimiento",
    string
  >
>;
