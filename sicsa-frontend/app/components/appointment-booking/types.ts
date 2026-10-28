export type AppointmentBookingFormValue = {
  specialtyId: string;
  doctorId: string;
  fecha: string;
  hora: string;
  motivoConsulta: string;
  eps: string;
  epsId: string;
  departamento: string;
  municipio: string;
  appointmentClassId: string;
  observaciones: string;
  edad: string;
  embarazada: boolean;
  discapacidad: boolean;
  dolorIntenso: boolean;
  sangrado: boolean;
  dificultadRespiratoria: boolean;
  fiebre: boolean;
  selectedSymptoms: string[];
  painLevel: "" | "none" | "mild" | "moderate" | "severe";
  symptomOnset: "" | "today" | "2-3-days" | "less-than-week" | "week-or-more";
};

export type BookingPatientSummary = {
  id?: number;
  documento: string;
  nombre: string;
  eps: string;
  fechaNacimiento?: string;
  edad?: number;
  departamento?: string;
  municipio?: string;
};

export type BookingCatalogItem = {
  id: number;
  nombre?: string;
};

export type BookingDoctor = BookingCatalogItem & {
  consultorio?: string;
  registroMedico?: string;
};

export type BookingPriorityResult = {
  prioridad?: string;
  scorePrioridad?: number;
  explicacionPrioridad?: string;
  estado?: string;
};

export const EMPTY_BOOKING_FORM: AppointmentBookingFormValue = {
  specialtyId: "",
  doctorId: "",
  fecha: "",
  hora: "",
  motivoConsulta: "",
  eps: "",
  epsId: "",
  departamento: "",
  municipio: "",
  appointmentClassId: "",
  observaciones: "",
  edad: "",
  embarazada: false,
  discapacidad: false,
  dolorIntenso: false,
  sangrado: false,
  dificultadRespiratoria: false,
  fiebre: false,
  selectedSymptoms: [],
  painLevel: "",
  symptomOnset: "",
};

export function calculateAge(fechaNacimiento?: string): number | undefined {
  if (!fechaNacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) return undefined;
  const [year, month, day] = fechaNacimiento.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) age -= 1;
  return age >= 0 && age <= 120 ? age : undefined;
}

export function validateBookingForm(
  form: AppointmentBookingFormValue,
  patient: BookingPatientSummary | null,
  requireHour = true,
): string | null {
  if (!patient?.documento) return "Selecciona un paciente registrado";
  if (!patient.eps) return "El paciente debe tener una EPS registrada";
  if (!form.specialtyId) return "Selecciona la especialidad";
  if (!form.doctorId) return "Selecciona el médico";
  if (!form.appointmentClassId) return "Selecciona la clase de cita";
  if (!form.fecha) return "Selecciona la fecha";
  if (requireHour && !form.hora) return "Selecciona un horario disponible";
  if (form.motivoConsulta.trim().length < 3) return "Describe el motivo de consulta con al menos 3 caracteres";
  return null;
}

export function getWaitlistBaseHour(fecha: string) {
  const [year, month, day] = fecha.split("-").map(Number);
  const weekDay = new Date(year, month - 1, day).getDay();
  return weekDay === 6 ? "07:00" : "08:00";
}
