"use client";

import {
  CalendarDays,
  Clock3,
  ClockIcon,
  FileText,
  HeartPulse,
  MapPin,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

import type { AppointmentItem } from "../types";
import { isAppointmentCancellable } from "../../../../../utils/appointment-date";

type PatientAppointmentListProps = {
  appointments: AppointmentItem[];
  loadingAppointments: boolean;
  onCancel: (id: number) => void;
};

function getStatusBadgeClass(status: string | undefined): string {
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

  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusLabel(status: string | undefined): string {
  const value = (status || "").toLowerCase();

  if (value === "lista_espera") {
    return "Lista de espera";
  }

  if (!status) {
    return "Pendiente";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAppointmentDate(dateValue: string): string {
  if (!dateValue) {
    return "Fecha no registrada";
  }

  const date = new Date(`${dateValue}T00:00:00`);

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
  return (
    <section className="mt-6 overflow-hidden rounded-[2rem] border border-sky-100 bg-white shadow-xl">
      <header className="border-b border-slate-100 bg-gradient-to-r from-white via-sky-50/50 to-cyan-50/70 px-6 py-6 sm:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <section className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-md shadow-blue-100">
              <HeartPulse className="text-white" size={23} />
            </span>

            <section>
              <h2 className="text-2xl font-bold text-slate-900">Mis citas</h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Consulta el estado de tus solicitudes, revisa sus detalles y
                cancela las citas que aún se encuentren activas.
              </p>
            </section>
          </section>

          <section className="flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <CalendarDays className="text-blue-600" size={18} />
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
        </section>
      </header>

      <section className="p-6 sm:p-8">
        {loadingAppointments ? (
          <article className="flex min-h-[220px] items-center justify-center rounded-[1.75rem] border border-slate-200 bg-slate-50/70">
            <section className="text-center">
              <span className="mx-auto flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl bg-blue-100">
                <CalendarDays className="text-blue-600" size={25} />
              </span>

              <p className="mt-4 font-semibold text-slate-800">
                Cargando tus citas
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Estamos consultando tus solicitudes registradas.
              </p>
            </section>
          </article>
        ) : appointments.length === 0 ? (
          <article className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-cyan-50/70 px-6 py-12">
            <span className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-blue-100/60 blur-2xl" />

            <span className="absolute -bottom-12 -left-10 h-36 w-36 rounded-full bg-cyan-100/60 blur-2xl" />

            <section className="relative mx-auto max-w-xl text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-100">
                <CalendarDays className="text-white" size={28} />
              </span>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                Aún no tienes citas registradas
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                Cuando solicites una cita, podrás consultar aquí su fecha,
                horario, estado, motivo y demás información.
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
          <section className="grid gap-5">
            {appointments.map((item) => {
              const status = (item.estado || "").toLowerCase();
              const isWaitlist = status === "lista_espera";

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <section className="h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400" />

                  <section className="p-5 sm:p-6">
                    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <section className="flex min-w-0 items-start gap-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
                          <Stethoscope className="text-blue-600" size={22} />
                        </span>

                        <section className="min-w-0">
                          <section className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-900">
                              Cita #{item.id}
                            </h3>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                                item.estado,
                              )}`}
                            >
                              {getStatusLabel(item.estado)}
                            </span>
                          </section>

                          <p className="mt-1 text-sm capitalize text-slate-500">
                            {formatAppointmentDate(item.fecha)}
                          </p>
                        </section>
                      </section>

                      {isAppointmentCancellable(item) && (
                        <button onClick={() => onCancel(item.id)}>
                          Cancelar cita
                        </button>
                      )}
                    </header>

                    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <section className="flex items-center gap-2">
                          <CalendarDays className="text-blue-600" size={17} />

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Fecha
                          </p>
                        </section>

                        <p className="mt-2 text-sm font-bold capitalize text-slate-900">
                          {formatAppointmentDate(item.fecha)}
                        </p>
                      </article>

                      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <section className="flex items-center gap-2">
                          <Clock3 className="text-cyan-600" size={17} />

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Hora
                          </p>
                        </section>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {isWaitlist ? "Por asignar" : item.hora || "-"}
                        </p>
                      </article>

                      <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <section className="flex items-center gap-2">
                          <MapPin className="text-emerald-600" size={17} />

                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Ubicación
                          </p>
                        </section>

                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {item.municipio || "No registrado"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.departamento || "Departamento no registrado"}
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
                          {item.eps || "No registrada"}
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
                              Estás en lista de espera
                            </p>

                            <p className="mt-1 text-sm leading-6 text-violet-700">
                              Cuando se libere un horario para esta fecha, el
                              sistema podrá asignarlo automáticamente según tu
                              prioridad.
                            </p>
                          </section>
                        </section>
                      </section>
                    )}

                    <section className="mt-5 grid gap-4 lg:grid-cols-2">
                      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <section className="flex items-center gap-2">
                          <Stethoscope className="text-blue-600" size={17} />

                          <p className="text-sm font-bold text-slate-900">
                            Motivo de consulta
                          </p>
                        </section>

                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                          {item.motivoConsulta || "Sin detalle registrado"}
                        </p>
                      </article>

                      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <section className="flex items-center gap-2">
                          <FileText className="text-cyan-600" size={17} />

                          <p className="text-sm font-bold text-slate-900">
                            Observaciones
                          </p>
                        </section>

                        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                          {item.observaciones || "Sin observaciones adicionales"}
                        </p>
                      </article>
                    </section>
                  </section>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </section>
  );
}