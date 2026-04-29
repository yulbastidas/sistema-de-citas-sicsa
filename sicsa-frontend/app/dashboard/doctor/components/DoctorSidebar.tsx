"use client";

import { Clock3, Sparkles } from "lucide-react";
import { AppointmentItem, SessionUser } from "../types";

type DoctorSidebarProps = {
  user: SessionUser | null;
  loadingAppointments: boolean;
  totalConfirmed: number;
  savedReportsCount: number;
  nextAppointment: AppointmentItem | null;
};

export function DoctorSidebar({
  user,
  loadingAppointments,
  totalConfirmed,
  savedReportsCount,
  nextAppointment,
}: DoctorSidebarProps) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-start justify-between gap-4">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Resumen del turno
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Próxima atención
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vista rápida del siguiente paciente confirmado.
            </p>
          </section>

          <figure className="rounded-3xl bg-slate-100 p-3 text-slate-700">
            <Clock3 size={22} />
          </figure>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Hora</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loadingAppointments
                ? "..."
                : nextAppointment?.hora || "Sin horario"}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-500">Paciente</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {loadingAppointments
                ? "Cargando..."
                : nextAppointment?.patient?.nombre || "Sin próxima cita"}
            </p>
          </article>
        </section>
      </article>

      <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <header className="flex items-start justify-between gap-4">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-700">
              Estado general
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Actividad del día
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Control visual del flujo clínico actual.
            </p>
          </section>

          <figure className="rounded-3xl bg-slate-100 p-3 text-slate-700">
            <Sparkles size={22} />
          </figure>
        </header>

        <section className="mt-6 space-y-4">
          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">
              Pendientes de reporte
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {loadingAppointments ? "..." : totalConfirmed - savedReportsCount}
            </p>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-500">
              Correo de sesión
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-800">
              {user?.email || "No disponible"}
            </p>
          </article>
        </section>
      </article>
    </section>
  );
}
