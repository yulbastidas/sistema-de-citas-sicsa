import type {
  PatientFieldDefinition,
  PatientFormData,
} from "./types";

export const EMPTY_PATIENT_FORM: PatientFormData = {
  tipoDocumento: "",
  numeroDocumento: "",
  primerNombre: "",
  segundoNombre: "",
  primerApellido: "",
  segundoApellido: "",
  telefono: "",
  email: "",
  eps: "",
  genero: "",
  fechaNacimiento: "",
  departamento: "",
  municipio: "",
  direccion: "",
  tipoSangre: "",
  factorRh: "",
  alergias: "",
  enfermedadesCronicas: "",
  contactoEmergenciaNombre: "",
  contactoEmergenciaTelefono: "",
  contactoEmergenciaParentesco: "",
};

export const PERSONAL_FIELDS: PatientFieldDefinition[] = [
  {
    field: "tipoDocumento",
    label: "Tipo de documento",
    placeholder: "CC, TI, CE...",
  },
  {
    field: "numeroDocumento",
    label: "Número de documento",
    placeholder: "Número de identificación",
  },
  {
    field: "primerNombre",
    label: "Primer nombre",
    placeholder: "Primer nombre",
  },
  {
    field: "segundoNombre",
    label: "Segundo nombre",
    placeholder: "Segundo nombre",
  },
  {
    field: "primerApellido",
    label: "Primer apellido",
    placeholder: "Primer apellido",
  },
  {
    field: "segundoApellido",
    label: "Segundo apellido",
    placeholder: "Segundo apellido",
  },
];

export const CONTACT_FIELDS: PatientFieldDefinition[] = [
  {
    field: "telefono",
    label: "Teléfono",
    placeholder: "Teléfono de contacto",
    type: "tel",
  },
  {
    field: "email",
    label: "Correo electrónico",
    placeholder: "Correo del paciente",
    type: "email",
  },
];

export const HEALTH_FIELDS: PatientFieldDefinition[] = [
  {
    field: "eps",
    label: "EPS",
    placeholder: "Entidad promotora de salud",
  },
  {
    field: "genero",
    label: "Género",
    placeholder: "Femenino, Masculino, Otro",
  },
  {
    field: "fechaNacimiento",
    label: "Fecha de nacimiento",
    placeholder: "Fecha de nacimiento",
    type: "date",
  },
  {
    field: "tipoSangre",
    label: "Tipo de sangre",
    placeholder: "Ejemplo: O, A, B o AB",
  },
  {
    field: "factorRh",
    label: "Factor RH",
    placeholder: "Positivo o negativo",
  },
  {
    field: "alergias",
    label: "Alergias",
    placeholder: "Alergias conocidas o Ninguna",
    multiline: true,
  },
  {
    field: "enfermedadesCronicas",
    label: "Enfermedades crónicas",
    placeholder: "Enfermedades crónicas o Ninguna",
    multiline: true,
  },
];

export const LOCATION_FIELDS: PatientFieldDefinition[] = [
  {
    field: "departamento",
    label: "Departamento",
    placeholder: "Departamento",
  },
  {
    field: "municipio",
    label: "Municipio",
    placeholder: "Municipio",
  },
  {
    field: "direccion",
    label: "Dirección",
    placeholder: "Dirección de residencia",
  },
];

export const EMERGENCY_FIELDS: PatientFieldDefinition[] = [
  {
    field: "contactoEmergenciaNombre",
    label: "Nombre del contacto",
    placeholder: "Nombre completo",
  },
  {
    field: "contactoEmergenciaTelefono",
    label: "Teléfono del contacto",
    placeholder: "Teléfono de emergencia",
    type: "tel",
  },
  {
    field: "contactoEmergenciaParentesco",
    label: "Parentesco",
    placeholder: "Madre, padre, hermano, pareja...",
  },
];