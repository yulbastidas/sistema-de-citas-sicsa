export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

export type HistoryAppointmentItem = {
  id: number;
  fecha?: string;
  hora?: string;
  estado?: string;
  motivoConsulta?: string;
  patient?: {
    nombre?: string;
    documento?: string;
    email?: string;
    eps?: string;
  } | null;
  medicalReport?: {
    exists?: boolean;
    id?: number | null;
  };
};
