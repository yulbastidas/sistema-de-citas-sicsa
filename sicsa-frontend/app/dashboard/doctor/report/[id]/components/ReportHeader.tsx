"use client";

import {
  ArrowLeft,
  ClipboardPlus,
  FileCheck2,
  Stethoscope,
} from "lucide-react";

type ReportHeaderProps = {
  appointmentId: number;
  completedFields: number;
  totalFields: number;
  onBack: () => void;
};

export function ReportHeader({
  appointmentId,
  completedFields,
  totalFields,
  onBack,
}: ReportHeaderProps) {
  const isComplete = completedFields === totalFields;

  return (
    <header className="border-b border-slate-200 bg-white">
      <section className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <section className="flex min-w-0 items-center gap-4">
          <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-sm">
            <Stethoscope size={28} />
          </figure>

          <section className="min-w-0">
            <section className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                Atención médica
              </p>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  isComplete
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {isComplete ? (
                  <FileCheck2 size={13} />
                ) : (
                  <ClipboardPlus size={13} />
                )}

                {isComplete ? "Formulario completo" : "En diligenciamiento"}
              </span>
            </section>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Reporte clínico
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Registra la valoración, diagnóstico y conducta médica de la cita{" "}
              <span className="font-semibold text-slate-700">
                #{appointmentId}
              </span>
              .
            </p>
          </section>
        </section>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800 lg:self-auto"
        >
          <ArrowLeft size={17} />
          Volver al panel
        </button>
      </section>
    </header>
  );
}