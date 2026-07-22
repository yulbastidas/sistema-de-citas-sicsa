"use client";

import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
} from "lucide-react";

type PatientSummaryCardProps = {
  appointmentId: number;
  completedFields: number;
  totalFields: number;
};

export function PatientSummaryCard({
  appointmentId,
  completedFields,
  totalFields,
}: PatientSummaryCardProps) {
  const progress =
    totalFields > 0
      ? Math.round((completedFields / totalFields) * 100)
      : 0;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section className="grid lg:grid-cols-[1fr_auto]">
        <article className="p-5 sm:p-6">
          <header className="flex items-start gap-3">
            <figure className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <ClipboardList size={21} />
            </figure>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
                Registro en edición
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Cita médica #{appointmentId}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Completa la información clínica disponible antes de guardar o
                generar el documento institucional.
              </p>
            </section>
          </header>

          <section className="mt-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Info size={17} className="mt-0.5 shrink-0 text-blue-700" />

            <p className="text-sm leading-6 text-blue-800">
              La información registrada será utilizada para guardar el reporte
              médico y generar el archivo PDF de la atención.
            </p>
          </section>
        </article>

        <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:w-80 lg:border-l lg:border-t-0">
          <section className="flex items-center justify-between gap-3">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Progreso del reporte
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {progress}%
              </p>
            </section>

            <figure
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                progress === 100
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {progress === 100 ? (
                <CheckCircle2 size={22} />
              ) : (
                <FileText size={22} />
              )}
            </figure>
          </section>

          <section className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
            <section
              className={`h-full rounded-full transition-all ${
                progress === 100 ? "bg-emerald-500" : "bg-cyan-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </section>

          <p className="mt-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-800">
              {completedFields}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-800">
              {totalFields}
            </span>{" "}
            campos diligenciados.
          </p>
        </aside>
      </section>
    </section>
  );
}