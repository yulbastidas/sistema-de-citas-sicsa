export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
  nombre?: string;
  departamento?: string;
  municipio?: string;
  eps?: string;
  epsId?: number | string;
};

export type VerificationResponse = {
  id?: number;
  estado?: string;
  status?: string;
  departamento?: string;
  municipio?: string;
  eps?: string | { id?: number; nombre?: string };
  epsId?: number | string;
} | null;

export type AppointmentItem = {
  id: number;
  fecha: string;
  hora: string;
  estado?: string;
  motivoConsulta?: string;
  eps?: string;
  departamento?: string;
  municipio?: string;
  observaciones?: string;
};

export type SpecialtyItem = {
  id: number;
  nombre?: string;
  descripcion?: string;
};

export type EpsItem = {
  id: number;
  nombre?: string;
};

export type AppointmentClassItem = {
  id: number;
  nombre?: string;
};

export type VerificationState =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "expired";

export type AppointmentForm = AppointmentBookingFormValue;
import type { AppointmentBookingFormValue, BookingDoctor, BookingPatientSummary } from "@/app/components/appointment-booking/types";
export type { BookingDoctor, BookingPatientSummary };
