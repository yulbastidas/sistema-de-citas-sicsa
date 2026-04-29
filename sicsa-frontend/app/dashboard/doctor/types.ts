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
  medicalReport?: {
    exists?: boolean;
    id?: number | null;
  };
};
