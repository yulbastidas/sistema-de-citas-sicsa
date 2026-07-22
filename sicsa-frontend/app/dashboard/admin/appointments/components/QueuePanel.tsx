"use client";

import {
  CalendarDays,
  Clock3,
  FileText,
  ListOrdered,
  Phone,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
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
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-5 sm:px-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <section className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <ListOrdered size={22} />
            </span>

            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Cola priorizada del día
              </h2>

              <p className="mt-1 text-sm leading-5 text-slate-600">
                Orden de atención clínica según prioridad y horario.
              </p>
            </section>
          </section>

          <article className="relative w-full lg:w-auto">
            <CalendarDays
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 lg:w-auto"
            />
          </article>
        </section>
      </header>

      <section className="p-5 sm:p-6">
        {loadingQueue ? (
          <article className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 font-semibold text-slate-700">
              Cargando cola priorizada...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Consultando las citas de la fecha seleccionada.
            </p>
          </article>
        ) : queueItems.length === 0 ? (
          <article className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <CalendarDays size={30} />
            </span>

            <h3 className="mt-5 text-lg font-bold text-slate-900">
              No hay citas programadas
            </h3>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              No se encontraron citas para la fecha seleccionada. Puedes elegir
              otra fecha o registrar una nueva cita desde el formulario.
            </p>
          </article>
        ) : (
          <section className="space-y-3">
            {queueItems.map((item, index) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition hover:border-blue-200 hover:bg-white hover:shadow-md"
              >
                <section className="flex">
                  <aside className="flex w-14 shrink-0 flex-col items-center bg-slate-900 px-2 py-4 text-white">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                      Turno
                    </span>

                    <span className="mt-2 text-2xl font-bold">
                      {index + 1}
                    </span>
                  </aside>

                  <section className="min-w-0 flex-1 p-4">
                    <header className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <section className="min-w-0 flex-1">
                        <section className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-bold text-slate-900">
                            {item.patient?.nombre || "Paciente"}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityBadgeClass(item.prioridad)}`}
                          >
                            Prioridad: {item.prioridad || "-"}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(item.estado)}`}
                          >
                            {item.estado || "-"}
                          </span>
                        </section>

                        <section className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <article className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock3
                              size={16}
                              className="shrink-0 text-blue-600"
                            />
                            <span>{item.hora || "-"}</span>
                          </article>

                          <article className="flex items-center gap-2 text-sm text-slate-600">
                            <UserRound
                              size={16}
                              className="shrink-0 text-blue-600"
                            />
                            <span className="truncate">
                              {item.patient?.documento || "-"}
                            </span>
                          </article>

                          <article className="flex items-center gap-2 text-sm text-slate-600">
                            <WalletCards
                              size={16}
                              className="shrink-0 text-blue-600"
                            />
                            <span className="truncate">
                              {item.patient?.eps || "-"}
                            </span>
                          </article>

                          <article className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone
                              size={16}
                              className="shrink-0 text-blue-600"
                            />
                            <span className="truncate">
                              {item.patient?.telefono || "-"}
                            </span>
                          </article>
                        </section>

                        <article className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
                          <section className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-500" />

                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                              Motivo de consulta
                            </p>
                          </section>

                          <p className="mt-2 text-sm leading-5 text-slate-700">
                            {item.motivoConsulta || "Sin detalle"}
                          </p>
                        </article>
                      </section>

                      <aside className="flex min-w-[110px] items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 xl:flex-col xl:justify-center xl:text-center">
                        <section>
                          <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                            Score
                          </p>

                          <p className="mt-1 text-2xl font-extrabold text-slate-900">
                            {item.scorePrioridad ?? "-"}
                          </p>
                        </section>

                        <ShieldCheck
                          className="text-blue-500 xl:mt-2"
                          size={22}
                        />
                      </aside>
                    </header>
                  </section>
                </section>
              </article>
            ))}
          </section>
        )}
      </section>
    </section>
  );
}