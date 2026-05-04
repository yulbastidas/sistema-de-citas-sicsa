"use client";

import { CalendarDays } from "lucide-react";
import type { QueueItem } from "../types";

type QueuePanelProps = {
  queueItems: QueueItem[];
  loadingQueue: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
};

function getPriorityBadgeClass(priority: string | number | undefined): string {
  const value = String(priority || "").toLowerCase();

  if (value.includes("alta") || value === "3") {
    return "border border-red-200 bg-red-50 text-red-700";
  }
  if (value.includes("media") || value === "2") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("baja") || value === "1") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusBadgeClass(status: string | undefined): string {
  const value = (status || "").toLowerCase();

  if (value === "confirmada" || value === "aprobada") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (value === "pendiente") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value === "cancelada") {
    return "border border-red-200 bg-red-50 text-red-700";
  }
  if (value === "atendida") {
    return "border border-blue-200 bg-blue-50 text-blue-700";
  }
  return "border border-slate-200 bg-slate-50 text-slate-700";
}

export function QueuePanel({
  queueItems,
  loadingQueue,
  selectedDate,
  onDateChange,
}: QueuePanelProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Cola priorizada del día
          </h2>
          <p className="mt-1 text-slate-600">
            Orden de atención clínica según prioridad y horario.
          </p>
        </section>

        <article className="relative">
          <CalendarDays
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
          />
        </article>
      </header>

      {loadingQueue ? (
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-600">Cargando cola...</p>
        </article>
      ) : queueItems.length === 0 ? (
        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-slate-600">
            No hay citas para la fecha seleccionada.
          </p>
        </article>
      ) : (
        <section className="space-y-4">
          {queueItems.map((item, index) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <section className="flex-1">
                  <section className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold text-slate-900">
                      #{index + 1} {item.patient?.nombre || "Paciente"}
                    </p>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(item.prioridad)}`}
                    >
                      Prioridad: {item.prioridad || "-"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(item.estado)}`}
                    >
                      {item.estado || "-"}
                    </span>
                  </section>

                  <section className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <p>Hora: {item.hora || "-"}</p>
                    <p>Documento: {item.patient?.documento || "-"}</p>
                    <p>EPS: {item.patient?.eps || "-"}</p>
                    <p>Teléfono: {item.patient?.telefono || "-"}</p>
                  </section>

                  <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-medium text-slate-500">
                      Motivo de consulta
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {item.motivoConsulta || "Sin detalle"}
                    </p>
                  </article>
                </section>

                <aside className="min-w-[120px] rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Score
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {item.scorePrioridad ?? "-"}
                  </p>
                </aside>
              </header>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
