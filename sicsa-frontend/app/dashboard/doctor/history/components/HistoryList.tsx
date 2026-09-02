"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileBadge2,
  FileText,
  UserRound,
} from "lucide-react";
import { HistoryAppointmentItem } from "../types";
import { useRouter } from "next/navigation";
import { useState } from "react";

const HISTORY_PER_PAGE = 15;

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
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAppointments.length / HISTORY_PER_PAGE),
  );
  const visiblePage = Math.min(currentPage, totalPages);
  const firstIndex = (visiblePage - 1) * HISTORY_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(
    firstIndex,
    firstIndex + HISTORY_PER_PAGE,
  );
  const firstVisible = filteredAppointments.length === 0 ? 0 : firstIndex + 1;
  const lastVisible = Math.min(
    firstIndex + HISTORY_PER_PAGE,
    filteredAppointments.length,
  );

  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Listado histórico
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Citas del doctor con atención registrada o con reporte clínico
          guardado.
        </p>
      </header>

      <section className="p-4 sm:p-5">
      {loading ? (
        <p className="py-8 text-center text-slate-600">Cargando historial...</p>
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
        <section className="space-y-2.5">
          {paginatedAppointments.map((item) => (
            <details
              key={item.id}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:border-cyan-200 hover:shadow-md open:border-cyan-200"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 bg-slate-50/70 px-4 py-3.5 outline-none transition hover:bg-cyan-50/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-600 sm:px-5 [&::-webkit-details-marker]:hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  <UserRound size={18} />
                </span>

                <section className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(160px,1.2fr)_minmax(150px,0.9fr)_minmax(110px,0.7fr)_90px] sm:items-center">
                  <section className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-900">
                    {item.patient?.nombre || "Paciente"}
                  </h3>

                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    Cita #{item.id}
                  </p>
                  </section>

                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                    {item.medicalReport?.exists
                      ? "Reporte guardado"
                      : "Atención registrada"}
                  </span>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <CalendarDays size={15} className="text-cyan-700" />
                    {item.fecha || "-"}
                  </span>

                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Clock3 size={15} className="text-cyan-700" />
                    {item.hora || "-"}
                  </span>
                </section>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 group-open:rotate-180 group-open:border-cyan-300 group-open:bg-cyan-50 group-open:text-cyan-700">
                  <ChevronDown size={18} />
                </span>
              </summary>

              <section className="h-px bg-gradient-to-r from-cyan-600 via-blue-400 to-transparent" />

              <section className="grid gap-3 p-4 lg:grid-cols-[1fr_auto] sm:p-5">
                <section className="space-y-4">
                  <article className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:grid-cols-2">
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

                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Motivo de consulta
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {item.motivoConsulta || "Sin detalle"}
                    </p>
                  </article>
                </section>

                <aside className="space-y-4 lg:w-64">
                  <article className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Acciones rápidas
                    </p>

                    <section className="mt-3 grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          router.push(`/dashboard/doctor/report/${item.id}`);
                        }}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
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
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
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
            </details>
          ))}
        </section>
      )}

      {!loading && !errorMessage && filteredAppointments.length > 0 && (
        <footer className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <section>
            <p className="text-sm font-semibold text-slate-700">
              Mostrando {firstVisible} a {lastVisible} de {filteredAppointments.length} registros
            </p>
            {totalPages > 1 && (
              <p className="mt-0.5 text-xs text-slate-500">
                Página {visiblePage} de {totalPages}
              </p>
            )}
          </section>

          {totalPages > 1 && (
            <nav aria-label="Paginación del historial clínico" className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={visiblePage === 1}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} /> Anterior
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-current={visiblePage === page ? "page" : undefined}
                  className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-sm font-bold transition ${visiblePage === page ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50"}`}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={visiblePage === totalPages}
                className="flex h-9 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente <ChevronRight size={16} />
              </button>
            </nav>
          )}
        </footer>
      )}
      </section>
    </section>
  );
}
