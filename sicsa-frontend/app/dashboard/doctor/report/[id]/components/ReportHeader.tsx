"use client";

import {
  ArrowLeft,
  ClipboardPlus,
  FileCheck2,
  ShieldCheck,
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
  const progress =
    totalFields > 0
      ? Math.round(
        (completedFields / totalFields) * 100,
      )
      : 0;

  const isComplete =
    totalFields > 0 &&
    completedFields === totalFields;

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
      <section className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <section className="flex min-w-0 items-center gap-4">
            <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-inner">
              <ClipboardPlus size={27} />
            </figure>

            <section className="min-w-0">
              <section className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
                  Hospital Clarita Santos
                </p>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isComplete
                      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-300/20 bg-amber-400/10 text-amber-200"
                    }`}
                >
                  {isComplete ? (
                    <FileCheck2 size={13} />
                  ) : (
                    <ClipboardPlus size={13} />
                  )}

                  {isComplete
                    ? "Historia completa"
                    : "En diligenciamiento"}
                </span>
              </section>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Historia clínica
              </h1>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                Consulta externa · Registro clínico de la
                cita{" "}
                <span className="font-semibold text-white">
                  #{appointmentId}
                </span>
              </p>

              <section className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-200">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    size={14}
                    className="text-cyan-300"
                  />
                  Documento clínico institucional
                </span>

                <span>
                  Progreso:{" "}
                  <strong className="text-white">
                    {progress}%
                  </strong>
                </span>
              </section>
            </section>
          </section>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 lg:self-auto"
          >
            <ArrowLeft size={17} />
            Volver al panel
          </button>
        </section>
      </section>
    </header>
  );
}
