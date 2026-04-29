"use client";

import {
  Activity,
  CalendarDays,
  ClipboardList,
  FileBadge2,
} from "lucide-react";

type DoctorStatsProps = {
  loadingAppointments: boolean;
  loadingQueue: boolean;
  totalConfirmed: number;
  totalQueue: number;
  highPriorityCount: number;
  savedReportsCount: number;
};

export function DoctorStats({
  loadingAppointments,
  loadingQueue,
  totalConfirmed,
  totalQueue,
  highPriorityCount,
  savedReportsCount,
}: DoctorStatsProps) {
  return (
    <section className="grid gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Citas confirmadas
          </p>
          <span className="rounded-2xl bg-cyan-50 p-2 text-cyan-700">
            <CalendarDays size={18} />
          </span>
        </header>

        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          {loadingAppointments ? "..." : totalConfirmed}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Pacientes listos para atención médica.
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Pacientes en cola
          </p>
          <span className="rounded-2xl bg-violet-50 p-2 text-violet-700">
            <ClipboardList size={18} />
          </span>
        </header>

        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          {loadingQueue ? "..." : totalQueue}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Cola clínica priorizada del día.
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">Prioridad alta</p>
          <span className="rounded-2xl bg-red-50 p-2 text-red-700">
            <Activity size={18} />
          </span>
        </header>

        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          {loadingQueue ? "..." : highPriorityCount}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Casos que requieren atención preferente.
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <header className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-500">
            Reportes guardados
          </p>
          <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
            <FileBadge2 size={18} />
          </span>
        </header>

        <p className="mt-4 text-4xl font-bold tracking-tight text-slate-900">
          {loadingAppointments ? "..." : savedReportsCount}
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Reportes clínicos ya diligenciados.
        </p>
      </article>
    </section>
  );
}
