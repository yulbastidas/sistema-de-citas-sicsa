"use client";

import {
  CalendarDays,
  Clock3,
  ClockIcon,
  HeartPulse,
  MapPin,
} from "lucide-react";
import type { AppointmentItem } from "../types";

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

export function PatientAppointmentList({
  appointments,
  loadingAppointments,
  onCancel,
}: PatientAppointmentListProps) {
  return (
    <section className="mt-6 rounded-[2rem] border border-cyan-100 bg-white/90 p-8 shadow-lg backdrop-blur">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
          <HeartPulse className="text-cyan-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Mis citas</h2>
          <p className="mt-1 text-slate-600">
            Consulta el estado de tus solicitudes y cancela una cita si aún está
            activa.
          </p>
        </section>
      </header>

      {loadingAppointments ? (
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-600">Cargando citas...</p>
        </article>
      ) : appointments.length === 0 ? (
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-600">Aún no tienes citas registradas.</p>
        </article>
      ) : (
        <section className="space-y-4">
          {appointments.map((item) => {
            const status = (item.estado || "").toLowerCase();

            return (
              <article
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
              >
                <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <section className="flex-1">
                    <section className="flex flex-wrap items-center gap-3">
                      <p className="text-xl font-bold text-slate-900">
                        Solicitud #{item.id}
                      </p>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(item.estado)}`}
                      >
                        {status === "lista_espera"
                          ? "En lista de espera"
                          : item.estado || "pendiente"}
                      </span>
                    </section>

                    <section className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-3">
                      <p className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-cyan-600" />
                        {item.fecha}
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock3 size={16} className="text-cyan-600" />
                        {status === "lista_espera"
                          ? "Hora por asignar"
                          : item.hora}
                      </p>
                      <p className="flex items-center gap-2">
                        <MapPin size={16} className="text-cyan-600" />
                        {item.municipio || "Municipio no registrado"}
                      </p>
                      <p>EPS: {item.eps || "No registrada"}</p>
                      <p>Departamento: {item.departamento || "-"}</p>
                    </section>

                    {status === "lista_espera" && (
                      <section className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-4">
                        <section className="flex items-center gap-2">
                          <ClockIcon className="text-violet-600" size={16} />
                          <p className="text-sm font-semibold text-violet-800">
                            Estás en lista de espera
                          </p>
                        </section>
                        <p className="mt-1 text-sm text-violet-700">
                          Cuando alguien cancele un horario para este día, se te
                          asignará automáticamente según tu prioridad y
                          recibirás una notificación por correo.
                        </p>
                      </section>
                    )}

                    <article className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Motivo de consulta
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.motivoConsulta || "Sin detalle"}
                      </p>
                    </article>

                    <article className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-medium text-slate-500">
                        Observaciones
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {item.observaciones || "Sin observaciones"}
                      </p>
                    </article>
                  </section>

                  <aside className="w-full max-w-[220px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-900">
                      Acción disponible
                    </p>
                    <section className="mt-4 flex flex-wrap gap-2">
                      {status !== "cancelada" && (
                        <button
                          onClick={() => onCancel(item.id)}
                          className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                        >
                          Cancelar
                        </button>
                      )}
                    </section>
                  </aside>
                </header>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}
