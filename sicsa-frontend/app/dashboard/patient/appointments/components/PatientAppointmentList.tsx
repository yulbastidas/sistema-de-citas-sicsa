"use client";

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClockIcon,
  FileText,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Stethoscope,
  XCircle,
} from "lucide-react";

import type { AppointmentItem } from "../types";
import { isAppointmentCancellable } from "../../../../../utils/appointment-date";

type PatientAppointmentListProps = {
  appointments: AppointmentItem[];
  loadingAppointments: boolean;
  onCancel: (id: number) => void;
};

const APPOINTMENTS_PER_PAGE = 5;

function getStatusBadgeClass(
  status: string | undefined,
): string {
  const value = (status || "").toLowerCase();

  if (
    value === "confirmada" ||
    value === "aprobada"
  ) {
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

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusLabel(
  status: string | undefined,
): string {
  const value = (status || "").toLowerCase();

  if (value === "lista_espera") {
    return "Lista de espera";
  }

  if (!status) {
    return "Pendiente";
  }

  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function formatAppointmentDate(
  dateValue: string,
): string {
  if (!dateValue) {
    return "Fecha no registrada";
  }

  const date = new Date(
    `${dateValue}T00:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return dateValue;
  }

  return date.toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PatientAppointmentList({
  appointments,
  loadingAppointments,
  onCancel,
}: PatientAppointmentListProps) {
  const [pagination, setPagination] = useState({
    appointmentCount: appointments.length,
    page: 1,
  });

  const totalPages = Math.max(
    1,
    Math.ceil(
      appointments.length /
      APPOINTMENTS_PER_PAGE,
    ),
  );

  const currentPage =
    pagination.appointmentCount === appointments.length
      ? Math.min(pagination.page, totalPages)
      : 1;

  const paginatedAppointments =
    useMemo(() => {
      const startIndex =
        (currentPage - 1) *
        APPOINTMENTS_PER_PAGE;

      const endIndex =
        startIndex +
        APPOINTMENTS_PER_PAGE;

      return appointments.slice(
        startIndex,
        endIndex,
      );
    }, [appointments, currentPage]);

  const firstVisibleAppointment =
    appointments.length === 0
      ? 0
      : (currentPage - 1) *
      APPOINTMENTS_PER_PAGE +
      1;

  const lastVisibleAppointment = Math.min(
    currentPage * APPOINTMENTS_PER_PAGE,
    appointments.length,
  );

  const goToPreviousPage = () => {
    setPagination({
      appointmentCount: appointments.length,
      page: Math.max(currentPage - 1, 1),
    });
  };

  const goToNextPage = () => {
    setPagination({
      appointmentCount: appointments.length,
      page: Math.min(currentPage + 1, totalPages),
    });
  };

  const goToPage = (page: number) => {
    setPagination({
      appointmentCount: appointments.length,
      page,
    });
  };

  return (
    <details
      open
      className="group/section mt-5 overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl"
    >
      <summary className="cursor-pointer list-none border-b border-slate-100 bg-gradient-to-r from-white via-sky-50/50 to-cyan-50/70 px-6 py-5 outline-none marker:hidden transition-colors hover:bg-sky-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-7 [&::-webkit-details-marker]:hidden">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-100">
              <HeartPulse
                className="text-white"
                size={23}
              />
            </span>

            <section>
              <h2 className="text-2xl font-bold text-slate-900">
                Mis citas
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Consulta el estado de tus
                solicitudes, revisa sus detalles
                y cancela las citas que aún se
                encuentren activas.
              </p>
            </section>
          </section>

          <section className="flex items-center gap-3">
            <section className="flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <CalendarDays
                  className="text-blue-600"
                  size={18}
                />
              </span>

              <section>
                <p className="text-xs font-medium text-slate-500">
                  Citas registradas
                </p>

                <p className="text-xl font-bold text-slate-900">
                  {appointments.length}
                </p>
              </section>
            </section>

            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 shadow-sm transition-transform duration-200 group-open/section:rotate-180">
              <ChevronDown size={21} strokeWidth={2.4} />
            </span>
          </section>
        </section>
      </summary>

      <section className="p-5 sm:p-6">
        {loadingAppointments ? (
          <article className="flex min-h-[220px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-slate-50/70">
            <section className="text-center">
              <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-blue-100">
                <CalendarDays
                  className="text-blue-600"
                  size={25}
                />
              </span>

              <p className="mt-4 font-semibold text-slate-800">
                Cargando tus citas
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Estamos consultando tus
                solicitudes registradas.
              </p>
            </section>
          </article>
        ) : appointments.length === 0 ? (
          <article className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/70 px-6 py-12">
            <span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-100/60 blur-2xl" />

            <span className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-cyan-100/60 blur-2xl" />

            <section className="relative mx-auto max-w-xl text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-100">
                <CalendarDays
                  className="text-white"
                  size={28}
                />
              </span>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Aún no tienes citas registradas
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Cuando solicites una cita,
                podrás consultar aquí su fecha,
                horario, estado, motivo y demás
                información.
              </p>

              <section className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-3">
                <article className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <CalendarDays
                    className="mx-auto text-blue-600"
                    size={20}
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Fecha y hora
                  </p>
                </article>

                <article className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <ShieldCheck
                    className="mx-auto text-emerald-600"
                    size={20}
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Estado de la cita
                  </p>
                </article>

                <article className="rounded-2xl border border-white bg-white/80 p-4 shadow-sm">
                  <FileText
                    className="mx-auto text-cyan-600"
                    size={20}
                  />

                  <p className="mt-2 text-xs font-semibold text-slate-700">
                    Detalles clínicos
                  </p>
                </article>
              </section>
            </section>
          </article>
        ) : (
          <>
            <section className="grid gap-2.5">
              {paginatedAppointments.map(
                (item) => {
                  const status = (
                    item.estado || ""
                  ).toLowerCase();

                  const isWaitlist =
                    status ===
                    "lista_espera";

                  return (
                    <details
                      key={item.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-slate-50/40 hover:shadow-md open:border-blue-200 open:bg-white open:shadow-md"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 outline-none marker:hidden transition-colors duration-200 hover:bg-blue-50/40 focus-visible:bg-blue-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 sm:px-5 [&::-webkit-details-marker]:hidden">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                          <Stethoscope className="text-blue-600" size={18} />
                        </span>

                        <section className="grid min-w-0 flex-1 gap-3 sm:grid-cols-[minmax(110px,0.7fr)_minmax(170px,1.35fr)_minmax(95px,0.6fr)] sm:items-center">
                          <section className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-900">Cita #{item.id}</h3>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(item.estado)}`}>
                              {getStatusLabel(item.estado)}
                            </span>
                          </section>

                          <span className="flex items-center gap-2 text-sm font-semibold capitalize text-slate-700">
                            <CalendarDays className="shrink-0 text-blue-600" size={16} />
                            {formatAppointmentDate(item.fecha)}
                          </span>

                          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <Clock3 className="shrink-0 text-cyan-600" size={16} />
                            {isWaitlist ? "Por asignar" : item.hora || "-"}
                          </span>
                        </section>

                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-50 group-hover:text-blue-700 group-open:rotate-180 group-open:border-blue-200 group-open:bg-blue-50 group-open:text-blue-700">
                          <ChevronDown size={19} strokeWidth={2.4} />
                        </span>
                      </summary>

                      <section className="h-px bg-gradient-to-r from-blue-500 via-cyan-400 to-transparent" />

                      <section className="p-4 transition-opacity duration-200 sm:p-5">
                        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <section className="flex min-w-0 items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                              <Stethoscope
                                className="text-blue-600"
                                size={22}
                              />
                            </span>

                            <section className="min-w-0">
                              <section className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-bold text-slate-900">
                                  Cita #
                                  {item.id}
                                </h3>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                    item.estado,
                                  )}`}
                                >
                                  {getStatusLabel(
                                    item.estado,
                                  )}
                                </span>
                              </section>

                              <p className="mt-1 text-sm capitalize text-slate-500">
                                {formatAppointmentDate(
                                  item.fecha,
                                )}
                              </p>
                            </section>
                          </section>

                          {isAppointmentCancellable(
                            item,
                          ) && (
                              <button
                                type="button"
                                onClick={() =>
                                  onCancel(
                                    item.id,
                                  )
                                }
                                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                              >
                                <XCircle
                                  size={17}
                                />
                                Cancelar cita
                              </button>
                            )}
                        </header>

                        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <section className="flex items-center gap-2">
                              <CalendarDays
                                className="text-blue-600"
                                size={17}
                              />

                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Fecha
                              </p>
                            </section>

                            <p className="mt-2 text-sm font-bold capitalize text-slate-900">
                              {formatAppointmentDate(
                                item.fecha,
                              )}
                            </p>
                          </article>

                          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <section className="flex items-center gap-2">
                              <Clock3
                                className="text-cyan-600"
                                size={17}
                              />

                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Hora
                              </p>
                            </section>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                              {isWaitlist
                                ? "Por asignar"
                                : item.hora ||
                                "-"}
                            </p>
                          </article>

                          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <section className="flex items-center gap-2">
                              <MapPin
                                className="text-emerald-600"
                                size={17}
                              />

                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Ubicación
                              </p>
                            </section>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                              {item.municipio ||
                                "No registrado"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {item.departamento ||
                                "Departamento no registrado"}
                            </p>
                          </article>

                          <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                            <section className="flex items-center gap-2">
                              <ShieldCheck
                                className="text-violet-600"
                                size={17}
                              />

                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                EPS
                              </p>
                            </section>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                              {item.eps ||
                                "No registrada"}
                            </p>
                          </article>
                        </section>

                        {isWaitlist && (
                          <section className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                            <section className="flex items-start gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100">
                                <ClockIcon
                                  className="text-violet-700"
                                  size={18}
                                />
                              </span>

                              <section>
                                <p className="text-sm font-bold text-violet-800">
                                  Estás en
                                  lista de
                                  espera
                                </p>

                                <p className="mt-1 text-sm leading-6 text-violet-700">
                                  Cuando se
                                  libere un
                                  horario para
                                  esta fecha,
                                  el sistema
                                  podrá
                                  asignarlo
                                  automáticamente
                                  según tu
                                  prioridad.
                                </p>
                              </section>
                            </section>
                          </section>
                        )}

                        <section className="mt-4 grid gap-3 lg:grid-cols-2">
                          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <section className="flex items-center gap-2">
                              <Stethoscope
                                className="text-blue-600"
                                size={17}
                              />

                              <p className="text-sm font-bold text-slate-900">
                                Motivo de
                                consulta
                              </p>
                            </section>

                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                              {item.motivoConsulta ||
                                "Sin detalle registrado"}
                            </p>
                          </article>

                          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                            <section className="flex items-center gap-2">
                              <FileText
                                className="text-cyan-600"
                                size={17}
                              />

                              <p className="text-sm font-bold text-slate-900">
                                Observaciones
                              </p>
                            </section>

                            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                              {item.observaciones ||
                                "Sin observaciones adicionales"}
                            </p>
                          </article>
                        </section>
                      </section>
                    </details>
                  );
                },
              )}
            </section>

            {/* Paginación de las citas del paciente */}
            <footer className="mt-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <section>
                <p className="text-sm font-semibold text-slate-700">
                  Mostrando{" "}
                  {firstVisibleAppointment} a{" "}
                  {lastVisibleAppointment} de{" "}
                  {appointments.length} citas
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Página {currentPage} de{" "}
                  {totalPages}
                </p>
              </section>

              <nav
                aria-label="Paginación de mis citas"
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  type="button"
                  onClick={
                    goToPreviousPage
                  }
                  disabled={
                    currentPage === 1
                  }
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  <ChevronLeft
                    size={17}
                  />

                  <span className="hidden sm:inline">
                    Anterior
                  </span>
                </button>

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (_, index) =>
                    index + 1,
                ).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() =>
                      goToPage(page)
                    }
                    aria-current={
                      currentPage ===
                        page
                        ? "page"
                        : undefined
                    }
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-bold transition ${currentPage ===
                        page
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
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700"
                >
                  <span className="hidden sm:inline">
                    Siguiente
                  </span>

                  <ChevronRight
                    size={17}
                  />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
    </details>
  );
}
