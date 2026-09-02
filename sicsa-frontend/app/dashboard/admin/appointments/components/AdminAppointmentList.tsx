"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";

import { isAppointmentCancellable } from "@/utils/appointment-date";

import type { AppointmentItem } from "../types";

type AdminAppointmentListProps = {
  filteredAppointments: AppointmentItem[];
  loading: boolean;
  onApprove: (id: number) => void;
  onCancel: (id: number) => void;
};

const APPOINTMENTS_PER_PAGE = 5;

function getPriorityBadgeClass(
  priority: string | number | undefined,
): string {
  const value = String(priority || "").toLowerCase();

  if (value.includes("alta") || value === "3") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("media") || value === "2") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value.includes("baja") || value === "1") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusBadgeClass(
  status: string | undefined,
): string {
  const value = (status || "").toLowerCase();

  if (value === "confirmada" || value === "aprobada") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "pendiente") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  if (value === "cancelada") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  if (value === "atendida") {
    return "border border-sky-200 bg-sky-50 text-sky-700";
  }

  if (value === "lista_espera") {
    return "border border-violet-200 bg-violet-50 text-violet-700";
  }

  if (value === "no asistida" || value === "no_asistida") {
    return "border border-slate-300 bg-slate-100 text-slate-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusLabel(
  status: string | undefined,
): string {
  const value = (status || "").toLowerCase();

  if (value === "lista_espera") {
    return "Lista de espera";
  }

  if (value === "no_asistida") {
    return "No asistida";
  }

  if (!status) {
    return "Pendiente";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function AdminAppointmentList({
  filteredAppointments,
  loading,
  onApprove,
  onCancel,
}: AdminAppointmentListProps) {
  const [pagination, setPagination] = useState({
    appointments: filteredAppointments,
    page: 1,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredAppointments.length /
      APPOINTMENTS_PER_PAGE,
    ),
  );

  const currentPage =
    pagination.appointments === filteredAppointments
      ? Math.min(pagination.page, totalPages)
      : 1;

  const paginatedAppointments = useMemo(() => {
    const startIndex =
      (currentPage - 1) * APPOINTMENTS_PER_PAGE;

    const endIndex =
      startIndex + APPOINTMENTS_PER_PAGE;

    return filteredAppointments.slice(
      startIndex,
      endIndex,
    );
  }, [filteredAppointments, currentPage]);

  const firstVisibleAppointment =
    filteredAppointments.length === 0
      ? 0
      : (currentPage - 1) *
      APPOINTMENTS_PER_PAGE +
      1;

  const lastVisibleAppointment = Math.min(
    currentPage * APPOINTMENTS_PER_PAGE,
    filteredAppointments.length,
  );

  const goToPreviousPage = () => {
    setPagination({
      appointments: filteredAppointments,
      page: Math.max(currentPage - 1, 1),
    });
  };

  const goToNextPage = () => {
    setPagination({
      appointments: filteredAppointments,
      page: Math.min(currentPage + 1, totalPages),
    });
  };

  const goToPage = (page: number) => {
    setPagination({
      appointments: filteredAppointments,
      page,
    });
  };

  if (loading) {
    return (
      <article className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 font-semibold text-slate-700">
          Cargando citas...
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Consultando la agenda administrativa.
        </p>
      </article>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <article className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
          <CalendarDays size={30} />
        </span>

        <h3 className="mt-5 text-lg font-bold text-slate-900">
          No hay citas para mostrar
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          No se encontraron citas con los filtros
          seleccionados.
        </p>
      </article>
    );
  }

  return (
    <section>
      <section className="space-y-3">
        {paginatedAppointments.map((item) => {
          const status = (
            item.estado || ""
          ).toLowerCase();
          const canCancel = isAppointmentCancellable({
            fecha: item.fecha || "",
            hora: item.hora || "",
            estado: item.estado,
          });

          return (
            <details
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md open:border-blue-200 open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 bg-slate-50/80 px-4 py-3.5 outline-none transition-colors duration-200 hover:bg-blue-50/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5 [&::-webkit-details-marker]:hidden">
                <section className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <section className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <UserRound size={22} />
                    </span>

                    <section className="min-w-0">
                      <section className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900 sm:text-lg">
                          {item.patient?.nombre ||
                            "Paciente"}
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(
                            item.estado,
                          )}`}
                        >
                          {getStatusLabel(item.estado)}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityBadgeClass(
                            item.prioridad,
                          )}`}
                        >
                          Prioridad:{" "}
                          {item.prioridad || "-"}
                        </span>
                      </section>

                      <p className="mt-1 text-sm text-slate-500">
                        Cita #{item.id}
                      </p>
                    </section>
                  </section>

                  <section className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-[280px]">
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <CalendarDays size={16} className="shrink-0 text-blue-600" />
                      {item.fecha || "-"}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-slate-700">
                      <Clock3 size={16} className="shrink-0 text-cyan-600" />
                      {item.hora || "-"}
                    </span>
                  </section>
                </section>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 group-open:rotate-180 group-open:border-blue-300 group-open:bg-blue-50 group-open:text-blue-700">
                  <ChevronDown size={19} strokeWidth={2.4} />
                </span>
              </summary>

              <section className="h-px bg-gradient-to-r from-blue-500 via-cyan-400 to-transparent" />

              <section className="p-4 sm:p-5">
                {(status === "pendiente" || canCancel) && (
                  <section className="mb-4 flex flex-wrap justify-end gap-2">
                    {status === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => onApprove(item.id)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={17} />
                        Aprobar
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => onCancel(item.id)}
                        className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                      >
                        <XCircle size={17} />
                        Cancelar
                      </button>
                    )}
                  </section>
                )}

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <CalendarDays
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Fecha
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {item.fecha || "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Clock3
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Hora
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {item.hora || "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <UserRound
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Documento
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.patient?.documento ||
                          "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Phone
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Teléfono
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.patient?.telefono ||
                          "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <Mail
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Correo
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.patient?.email || "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <WalletCards
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        EPS
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.patient?.eps ||
                          item.eps ||
                          "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Departamento
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.departamento || "-"}
                      </p>
                    </section>
                  </article>

                  <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <MapPin
                      size={18}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />

                    <section className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Municipio
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                        {item.municipio || "-"}
                      </p>
                    </section>
                  </article>
                </section>

                <section className="mt-4 grid gap-3 xl:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <section className="flex items-center gap-2">
                      <FileText
                        size={17}
                        className="text-blue-600"
                      />

                      <p className="text-sm font-bold text-slate-900">
                        Motivo de consulta
                      </p>
                    </section>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.motivoConsulta ||
                        "Sin detalle"}
                    </p>
                  </article>

                  <article className="rounded-xl border border-slate-200 bg-white p-4">
                    <section className="flex items-center gap-2">
                      <FileText
                        size={17}
                        className="text-blue-600"
                      />

                      <p className="text-sm font-bold text-slate-900">
                        Observaciones
                      </p>
                    </section>

                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.observaciones ||
                        "Sin observaciones"}
                    </p>
                  </article>
                </section>
              </section>
            </details>
          );
        })}
      </section>

      {/* Paginación únicamente de la agenda */}
      <footer className="mt-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <section>
          <p className="text-sm font-semibold text-slate-700">
            Mostrando {firstVisibleAppointment} a{" "}
            {lastVisibleAppointment} de{" "}
            {filteredAppointments.length} citas
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Página {currentPage} de {totalPages}
          </p>
        </section>

        <nav
          aria-label="Paginación de citas"
          className="flex flex-wrap items-center gap-2"
        >
          <button
            type="button"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
          >
            <ChevronLeft size={17} />
            <span className="hidden sm:inline">
              Anterior
            </span>
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => index + 1,
          ).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => goToPage(page)}
              aria-current={
                currentPage === page
                  ? "page"
                  : undefined
              }
              className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${currentPage === page
                  ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                  : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
          >
            <span className="hidden sm:inline">
              Siguiente
            </span>
            <ChevronRight size={17} />
          </button>
        </nav>
      </footer>
    </section>
  );
}
