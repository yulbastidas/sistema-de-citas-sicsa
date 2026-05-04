"use client";

import {
  CalendarDays,
  Clock3,
  FileBadge2,
  FileText,
  UserRound,
} from "lucide-react";
import { HistoryAppointmentItem } from "../types";
import { useRouter } from "next/navigation";

type HistoryListProps = {
  loading: boolean;
  errorMessage: string;
  filteredAppointments: HistoryAppointmentItem[];
  downloadingId: number | null;
  onDownloadPdf: (id: number) => Promise<void>;
};

export function HistoryList({
  loading,
  errorMessage,
  filteredAppointments,
  downloadingId,
  onDownloadPdf,
}: HistoryListProps) {
  const router = useRouter();

  return (
    <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <header className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Listado histórico
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Citas del doctor con atención registrada o con reporte clínico
          guardado.
        </p>
      </header>

      {loading ? (
        <p className="text-slate-600">Cargando historial...</p>
      ) : errorMessage ? (
        <article className="rounded-3xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">
            No se pudo cargar el historial.
          </p>
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
        </article>
      ) : filteredAppointments.length === 0 ? (
        <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            No hay resultados para los filtros seleccionados.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Ajusta el nombre del paciente o la fecha para ampliar la búsqueda.
          </p>
        </article>
      ) : (
        <section className="space-y-5">
          {filteredAppointments.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
            >
              <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <section className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.patient?.nombre || "Paciente"}
                  </h3>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    {item.medicalReport?.exists
                      ? "Reporte guardado"
                      : "Atención registrada"}
                  </span>
                </section>

                <p className="text-sm font-medium text-slate-500">
                  Cita #{item.id}
                </p>
              </header>

              <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.9fr]">
                <section className="space-y-4">
                  <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                    <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <CalendarDays size={15} className="text-slate-400" />
                      <span>
                        <span className="font-semibold text-slate-900">
                          Fecha:
                        </span>{" "}
                        {item.fecha || "-"}
                      </span>
                    </p>

                    <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <Clock3 size={15} className="text-slate-400" />
                      <span>
                        <span className="font-semibold text-slate-900">
                          Hora:
                        </span>{" "}
                        {item.hora || "-"}
                      </span>
                    </p>

                    <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <UserRound size={15} className="text-slate-400" />
                      <span>
                        <span className="font-semibold text-slate-900">
                          Documento:
                        </span>{" "}
                        {item.patient?.documento || "-"}
                      </span>
                    </p>

                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        Estado:
                      </span>{" "}
                      {item.estado || "-"}
                    </p>

                    <p className="text-sm text-slate-700 md:col-span-2">
                      <span className="font-semibold text-slate-900">EPS:</span>{" "}
                      {item.patient?.eps || "-"}
                    </p>

                    <p className="break-all text-sm text-slate-700 md:col-span-2">
                      <span className="font-semibold text-slate-900">
                        Correo:
                      </span>{" "}
                      {item.patient?.email || "-"}
                    </p>
                  </article>

                  <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Motivo de consulta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.motivoConsulta || "Sin detalle"}
                    </p>
                  </article>
                </section>

                <aside className="space-y-4">
                  <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Acciones rápidas
                    </p>

                    <section className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/dashboard/doctor/report/${item.id}`);
                        }}
                        className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        <FileText size={16} />
                        Ver reporte
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void onDownloadPdf(item.id);
                        }}
                        disabled={
                          downloadingId === item.id ||
                          !item.medicalReport?.exists
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                      >
                        <FileBadge2 size={16} />
                        {downloadingId === item.id
                          ? "Descargando PDF..."
                          : "Descargar PDF"}
                      </button>
                    </section>
                  </article>
                </aside>
              </section>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}