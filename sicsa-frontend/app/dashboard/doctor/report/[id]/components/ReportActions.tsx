"use client";

import { FileText, Save } from "lucide-react";

type ReportActionsProps = {
  saving: boolean;
  downloading: boolean;
  message: string;
  onDownloadPdf: () => void;
};

export function ReportActions({
  saving,
  downloading,
  message,
  onDownloadPdf,
}: ReportActionsProps) {
  return (
    <>
      <footer className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Guardando..." : "Guardar reporte"}
        </button>

        <button
          type="button"
          disabled={downloading}
          onClick={onDownloadPdf}
          className="flex items-center gap-2 rounded-2xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
        >
          <FileText size={16} />
          {downloading ? "Descargando..." : "Descargar PDF"}
        </button>
      </footer>

      {message ? (
        <section className="mt-5" aria-live="polite">
          <p className="text-sm text-slate-700">{message}</p>
        </section>
      ) : null}
    </>
  );
}
