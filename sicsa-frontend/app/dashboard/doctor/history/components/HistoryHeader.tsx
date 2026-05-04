"use client";

import { ArrowLeft, CalendarDays, FileBadge2, FolderOpen } from "lucide-react";

type HistoryHeaderProps = {
  loading: boolean;
  totalHistory: number;
  totalWithReport: number;
};

export function HistoryHeader({
  loading,
  totalHistory,
  totalWithReport,
}: HistoryHeaderProps) {
  return (
    <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-8 py-8 text-white">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
              MÓDULO CLÍNICO
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Historial de atenciones
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">
              Consulta atenciones registradas, filtra por paciente o fecha y
              accede a los reportes en PDF.
            </p>
          </section>

          <a
            href="/dashboard/doctor"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Volver al panel
          </a>
        </section>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-6 py-5">
        <nav className="flex flex-wrap gap-3">
          <a
            href="/dashboard/doctor"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <CalendarDays size={16} />
            Agenda del día
          </a>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            <FolderOpen size={16} />
            Historial de atenciones
          </button>
        </nav>
      </section>

      <section className="grid gap-4 border-t border-slate-200 bg-slate-50 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Atenciones registradas
            </p>
            <CalendarDays size={18} className="text-slate-500" />
          </header>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : totalHistory}
          </p>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <header className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Reportes disponibles
            </p>
            <FileBadge2 size={18} className="text-slate-500" />
          </header>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "..." : totalWithReport}
          </p>
        </article>
      </section>
    </header>
  );
}
