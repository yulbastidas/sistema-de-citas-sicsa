"use client";

import Image from "next/image";
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
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <section className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <section className="flex min-w-0 items-center gap-4">
            <figure className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-100 bg-white shadow-sm sm:h-20 sm:w-20">
              <Image
                src="/hospital.jpg"
                alt="Logo del Hospital Clarita Santos"
                fill
                priority
                sizes="80px"
                className="object-contain p-1.5"
              />
            </figure>

            <section className="min-w-0">
              <section className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                  Hospital Clarita Santos
                </p>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
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

              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Historia clínica
              </h1>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Consulta externa · Registro clínico de la
                cita{" "}
                <span className="font-semibold text-slate-700">
                  #{appointmentId}
                </span>
              </p>

              <section className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    size={14}
                    className="text-cyan-700"
                  />
                  Documento clínico institucional
                </span>

                <span>
                  Progreso:{" "}
                  <strong className="text-slate-700">
                    {progress}%
                  </strong>
                </span>
              </section>
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
      </section>
    </header>
  );
}