import { getToken } from "./session";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://74.161.42.39:3000";

export type ReportFilters = {
  startDate?: string;
  endDate?: string;
  specialtyId?: number;
  doctorId?: number;
  patientId?: number;
  status?: string;
  priority?: string;
  eps?: string;
  municipality?: string;
};

export type ReportSummary = {
  totalAppointments: number;
  totalPatients: number;
  attended: number;
  cancelled: number;
  noShow: number;
  confirmed: number;
  pending: number;
  appointmentsThisMonth: number;
  noShowRate: number;
};

export type AppointmentsByStatus = {
  status: string;
  total: number;
};

export type AppointmentsBySpecialty = {
  specialtyId: number | null;
  specialty: string;
  total: number;
};

export type AppointmentsByDoctor = {
  doctorId: number | null;
  doctor: string;
  total: number;
};

export type AppointmentsByMonth = {
  month: string;
  total: number;
};

export type AppointmentsByHour = {
  hour: string;
  total: number;
};

export type NoShowsBySpecialty = {
  specialtyId: number | null;
  specialty: string;
  total: number;
};

export type DashboardReportResponse = {
  filters: ReportFilters;

  summary: ReportSummary;

  charts: {
    appointmentsByStatus: AppointmentsByStatus[];
    appointmentsBySpecialty: AppointmentsBySpecialty[];
    appointmentsByDoctor: AppointmentsByDoctor[];
    appointmentsByMonth: AppointmentsByMonth[];
    appointmentsByHour: AppointmentsByHour[];
    noShowsBySpecialty: NoShowsBySpecialty[];
  };
};

export type NoShowRecord = {
  appointmentId: number;
  date: string;
  time: string;
  status: string;
  priority: string;
  eps: string | null;
  municipality: string | null;
  patientId: number;
  patientName: string;
  documentNumber: string;
  phone: string;
  email: string;
  doctorName: string;
  specialtyName: string;
};

export type NoShowsResponse = {
  total: number;
  filters: ReportFilters;
  data: NoShowRecord[];
};

function buildQueryParams(filters: ReportFilters): string {
  const params = new URLSearchParams();

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  if (filters.specialtyId) {
    params.set(
      "specialtyId",
      String(filters.specialtyId),
    );
  }

  if (filters.doctorId) {
    params.set("doctorId", String(filters.doctorId));
  }

  if (filters.patientId) {
    params.set("patientId", String(filters.patientId));
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  if (filters.priority) {
    params.set("priority", filters.priority);
  }

  if (filters.eps) {
    params.set("eps", filters.eps);
  }

  if (filters.municipality) {
    params.set(
      "municipality",
      filters.municipality,
    );
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

async function authorizedRequest<T>(
  endpoint: string,
): Promise<T> {
  const token = getToken();

  if (!token) {
    throw new Error(
      "No existe una sesión activa. Inicia sesión nuevamente.",
    );
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    throw new Error(
      "La sesión expiró. Inicia sesión nuevamente.",
    );
  }

  if (response.status === 403) {
    throw new Error(
      "No tienes permiso para consultar los reportes.",
    );
  }

  if (!response.ok) {
    let message =
      "No fue posible consultar la información.";

    try {
      const errorResponse = await response.json();

      if (typeof errorResponse?.message === "string") {
        message = errorResponse.message;
      }

      if (Array.isArray(errorResponse?.message)) {
        message = errorResponse.message.join(", ");
      }
    } catch {}

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getDashboardReport(
  filters: ReportFilters = {},
): Promise<DashboardReportResponse> {
  const queryParams = buildQueryParams(filters);

  return authorizedRequest<DashboardReportResponse>(
    `/reports/dashboard${queryParams}`,
  );
}

export async function getNoShowsReport(
  filters: ReportFilters = {},
): Promise<NoShowsResponse> {
  const queryParams = buildQueryParams(filters);

  return authorizedRequest<NoShowsResponse>(
    `/reports/no-shows${queryParams}`,
  );
}