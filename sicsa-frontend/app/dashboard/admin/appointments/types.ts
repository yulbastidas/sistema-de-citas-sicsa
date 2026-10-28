export type SessionUser = {
  email?: string;
  role?: string | number;
  sub?: number;
};

export type PatientInfo = {
  id?: number;
  documento?: string;
  numeroDocumento?: string;
  nombre?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
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

export type AdminAppointmentForm = AppointmentBookingFormValue & { documento?: string };
import type { AppointmentBookingFormValue, BookingDoctor, BookingPatientSummary } from "@/app/components/appointment-booking/types";
export type { BookingDoctor, BookingPatientSummary };
