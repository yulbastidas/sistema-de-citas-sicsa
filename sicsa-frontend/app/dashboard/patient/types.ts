export type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
  documento?: string;
  eps?: string;
  epsId?: number | string;
};

export type VerificationResponse = {
  id?: number;
  estado?: string;
  status?: string;
  motivoRechazo?: string | null;
  documento?: string;
  eps?: string;
  epsId?: number | string;
} | null;

export type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado?: string;
  motivoConsulta?: string;
};

export type VerificationForm = {
  documento: string;
  eps: string;
  epsId: string;
};