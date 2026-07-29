"use client";

import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Info,
  ShieldCheck,
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
      ? Math.round(
        (completedFields / totalFields) * 100,
      )
      : 0;

  const isComplete =
    totalFields > 0 &&
    completedFields === totalFields;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <section className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 via-white to-white px-5 py-4 sm:px-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
              Identificación del documento
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Historia clínica de consulta externa
            </h2>
          </section>

          <span className="inline-flex w-fit items-center gap-2 rounded-xl border border-cyan-200 bg-white px-3 py-2 text-sm font-bold text-cyan-800 shadow-sm">
            <ClipboardList size={16} />
            HC-{String(appointmentId).padStart(6, "0")}
          </span>
        </section>
      </section>

      <section className="grid lg:grid-cols-[1fr_320px]">
        <article className="p-5 sm:p-6">
          <header className="flex items-start gap-3">
            <figure className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
              <ClipboardList size={21} />
            </figure>

            <section>
              <section className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-cyan-700">
                  Registro clínico
                </p>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                >
                  {isComplete
                    ? "Listo para finalizar"
                    : "Información pendiente"}
                </span>
              </section>

              <h3 className="mt-1 text-xl font-bold text-slate-950">
                Cita médica #{appointmentId}
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                Registra de manera completa la valoración,
                los antecedentes, los signos vitales, el
                diagnóstico y el plan de manejo.
              </p>
            </section>
          </header>

          <section className="mt-5 grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tipo de atención
              </p>

              <p className="mt-1 text-sm font-bold text-slate-900">
                Consulta externa
              </p>
            </article>

            <article className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estado del documento
              </p>

              <p
                className={`mt-1 text-sm font-bold ${isComplete
                    ? "text-emerald-700"
                    : "text-amber-700"
                  }`}
              >
                {isComplete
                  ? "Completamente diligenciado"
                  : "En elaboración"}
              </p>
            </article>
          </section>

          <section className="mt-5 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <Info
              size={17}
              className="mt-0.5 shrink-0 text-blue-700"
            />

            <p className="text-sm leading-6 text-blue-800">
              La información registrada será almacenada como
              parte de la atención médica y se utilizará para
              generar el documento PDF institucional.
            </p>
          </section>

          <section className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <ShieldCheck
              size={17}
              className="mt-0.5 shrink-0 text-cyan-700"
            />

            <p className="text-xs leading-5 text-slate-500">
              Verifica que los datos sean claros, pertinentes
              y correspondan a la valoración realizada antes
              de guardar el reporte.
            </p>
          </section>
        </article>

        <aside className="border-t border-slate-200 bg-slate-50 p-5 lg:border-l lg:border-t-0">
          <section className="flex items-center justify-between gap-3">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Progreso del reporte
              </p>

              <p className="mt-1 text-3xl font-bold text-slate-950">
                {progress}%
              </p>
            </section>

            <figure
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${isComplete
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
                }`}
            >
              {isComplete ? (
                <CheckCircle2 size={24} />
              ) : (
                <FileText size={24} />
              )}
            </figure>
          </section>

          <section className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-200">
            <section
              className={`h-full rounded-full transition-all duration-500 ${isComplete
                  ? "bg-emerald-500"
                  : "bg-cyan-600"
                }`}
              style={{
                width: `${Math.min(progress, 100)}%`,
              }}
            />
          </section>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            <span className="font-semibold text-slate-800">
              {completedFields}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-800">
              {totalFields}
            </span>{" "}
            campos cuentan con información.
          </p>

          <section
            className={`mt-5 rounded-xl border px-4 py-3 ${isComplete
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
              }`}
          >
            <p
              className={`text-sm font-semibold ${isComplete
                  ? "text-emerald-800"
                  : "text-amber-800"
                }`}
            >
              {isComplete
                ? "El reporte está completo."
                : "Continúa diligenciando la información clínica."}
            </p>

            <p
              className={`mt-1 text-xs leading-5 ${isComplete
                  ? "text-emerald-700"
                  : "text-amber-700"
                }`}
            >
              {isComplete
                ? "Guarda los cambios antes de descargar el PDF definitivo."
                : "Los campos faltantes pueden completarse antes de guardar la atención."}
            </p>
          </section>
        </aside>
      </section>
    </section>
  );
}