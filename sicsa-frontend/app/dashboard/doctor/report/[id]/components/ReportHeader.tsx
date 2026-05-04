"use client";

import { ArrowLeft } from "lucide-react";

type ReportHeaderProps = {
  appointmentId: number;
  onBack: () => void;
};

export function ReportHeader({ appointmentId, onBack }: ReportHeaderProps) {
  return (
    <header className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <section>
          <h1 className="text-3xl font-bold text-slate-900">Reporte clínico</h1>
          <p className="mt-2 text-slate-600">
            Cita #{appointmentId}. Completa la información médica y luego guarda
            o descarga el PDF.
          </p>
        </section>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
      </section>
    </header>
  );
}
