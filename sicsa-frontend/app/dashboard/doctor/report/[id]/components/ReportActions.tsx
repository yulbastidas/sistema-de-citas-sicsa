"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  LoaderCircle,
  Save,
  ShieldCheck,
} from "lucide-react";

type ReportActionsProps = {
  saving: boolean;
  downloading: boolean;
  message: string;
  completedFields: number;
  totalFields: number;
  onDownloadPdf: () => void;
};

function isSuccessMessage(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("correctamente") ||
    normalized.includes("guardado") ||
    normalized.includes("éxito")
  );
}

export function ReportActions({
  saving,
  downloading,
  message,
  completedFields,
  totalFields,
  onDownloadPdf,
}: ReportActionsProps) {
  const hasCompletedFields = completedFields > 0;

  const reportIsComplete =
    totalFields > 0 && completedFields === totalFields;

  const success = isSuccessMessage(message);

  const progress =
    totalFields > 0
      ? Math.round((completedFields / totalFields) * 100)
      : 0;

  return (
    <section className="sticky bottom-4 z-20 mt-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur">
        <section className="h-1 bg-slate-100">
          <section
            className={`h-full transition-all duration-500 ${reportIsComplete
                ? "bg-emerald-500"
                : "bg-cyan-600"
              }`}
            style={{
              width: `${Math.min(progress, 100)}%`,
            }}
          />
        </section>

        <section className="p-4 sm:p-5">
          <section className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <section className="flex min-w-0 items-start gap-3">
              <figure
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${reportIsComplete
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                  }`}
              >
                {reportIsComplete ? (
                  <FileCheck2 size={21} />
                ) : (
                  <Save size={21} />
                )}
              </figure>

              <section className="min-w-0">
                <section className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-950">
                    {reportIsComplete
                      ? "Reporte clínico diligenciado"
                      : "Reporte clínico en edición"}
                  </p>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${reportIsComplete
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                  >
                    {progress}% completado
                  </span>
                </section>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {completedFields}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-slate-700">
                    {totalFields}
                  </span>{" "}
                  campos contienen información.
                </p>

                <p className="mt-1 flex items-start gap-1.5 text-xs leading-5 text-slate-500">
                  <ShieldCheck
                    size={13}
                    className="mt-1 shrink-0 text-cyan-700"
                  />

                  Guarda los cambios antes de generar el PDF
                  actualizado.
                </p>
              </section>
            </section>

            <section className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving || !hasCompletedFields}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 focus:outline-none focus:ring-4 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {saving ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={17} />
                )}

                {saving
                  ? "Guardando reporte..."
                  : "Guardar reporte"}
              </button>

              <button
                type="button"
                disabled={downloading}
                onClick={onDownloadPdf}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Download size={17} />
                )}

                {downloading
                  ? "Generando PDF..."
                  : "Descargar PDF"}
              </button>
            </section>
          </section>

          {message ? (
            <section
              aria-live="polite"
              className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 ${success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
                }`}
            >
              {success ? (
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0"
                />
              ) : (
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />
              )}

              <p className="text-sm font-medium">{message}</p>
            </section>
          ) : null}
        </section>
      </section>
    </section>
  );
}