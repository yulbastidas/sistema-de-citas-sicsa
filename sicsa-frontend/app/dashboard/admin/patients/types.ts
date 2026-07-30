export type Patient = {
  id: number;
  userId?: number;
  tipoDocumento: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono: string;
  email: string;
  eps: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
  direccion?: string;
  tipoSangre?: string;
  factorRh?: string;
  alergias?: string;
  enfermedadesCronicas?: string;
  contactoEmergenciaNombre?: string;
  contactoEmergenciaTelefono?: string;
  contactoEmergenciaParentesco?: string;
};

export type PatientFormData = {
  tipoDocumento: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  email: string;
  eps: string;
  genero: string;
  fechaNacimiento: string;
  departamento: string;
  municipio: string;
  direccion: string;
  tipoSangre: string;
  factorRh: string;
  alergias: string;
  enfermedadesCronicas: string;
  contactoEmergenciaNombre: string;
  contactoEmergenciaTelefono: string;
  contactoEmergenciaParentesco: string;
};

export type PatientFieldDefinition = {
  field: keyof PatientFormData;
  label: string;
  placeholder: string;
  type?: "text" | "date" | "email" | "tel";
  multiline?: boolean;
};