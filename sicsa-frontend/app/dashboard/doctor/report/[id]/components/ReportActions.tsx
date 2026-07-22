"use client";

import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileCheck2,
  Save,
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
  const reportIsComplete = completedFields === totalFields;
  const success = isSuccessMessage(message);

  return (
    <section className="sticky bottom-4 z-20 mt-6">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:p-5">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <section className="flex items-start gap-3">
            <figure
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                reportIsComplete
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {reportIsComplete ? (
                <FileCheck2 size={20} />
              ) : (
                <Save size={20} />
              )}
            </figure>

            <section>
              <p className="text-sm font-bold text-slate-900">
                {reportIsComplete
                  ? "Reporte completamente diligenciado"
                  : "Reporte clínico en edición"}
              </p>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                {completedFields} de {totalFields} campos con información.
                Guarda los cambios antes de descargar el PDF actualizado.
              </p>
            </section>
          </section>

          <section className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving || !hasCompletedFields}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save size={17} />

              {saving ? "Guardando..." : "Guardar reporte"}
            </button>

            <button
              type="button"
              disabled={downloading}
              onClick={onDownloadPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={17} />

              {downloading ? "Descargando..." : "Descargar PDF"}
            </button>
          </section>
        </section>

        {message ? (
          <section
            aria-live="polite"
            className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 ${
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {success ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
            )}

            <p className="text-sm font-medium">{message}</p>
          </section>
        ) : null}
      </section>
    </section>
  );
}