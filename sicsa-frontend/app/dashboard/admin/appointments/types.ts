export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

export type PatientInfo = {
  documento?: string;
  nombre?: string;
  telefono?: string;
  email?: string;
  eps?: string;
} | null;

export type AppointmentItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  prioridad?: string | number;
  scorePrioridad?: number;
  patient?: PatientInfo;
  observaciones?: string;
  municipio?: string;
  departamento?: string;
  eps?: string;
};

export type QueueItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  prioridad?: string | number;
  scorePrioridad?: number;
  patient?: PatientInfo;
};

export type SpecialtyItem = {
  id: number;
  nombre?: string;
};

export type EpsItem = {
  id: number;
  nombre?: string;
};

export type AppointmentClassItem = {
  id: number;
  nombre?: string;
};

export type AdminAppointmentForm = {
  documento: string;
  specialtyId: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  edad: string;
  eps: string;
  epsId: string;
  departamento: string;
  municipio: string;
  appointmentClassId: string;
  observaciones: string;
  embarazada: boolean;
  discapacidad: boolean;
  dolorIntenso: boolean;
  sangrado: boolean;
  dificultadRespiratoria: boolean;
  fiebre: boolean;
};
