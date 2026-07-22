"use client";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  MapPin,
  Phone,
  UserRound,
  WalletCards,
  XCircle,
} from "lucide-react";
import type { AppointmentItem } from "../types";

type AdminAppointmentListProps = {
  filteredAppointments: AppointmentItem[];
  loading: boolean;
  onApprove: (id: number) => void;
  onCancel: (id: number) => void;
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

export function AdminAppointmentList({
  filteredAppointments,
  loading,
  onApprove,
  onCancel,
}: AdminAppointmentListProps) {
  if (loading) {
    return (
      <article className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <span className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

        <p className="mt-4 font-semibold text-slate-700">
          Cargando citas...
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Consultando la agenda administrativa.
        </p>
      </article>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <article className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
          <CalendarDays size={30} />
        </span>

        <h3 className="mt-5 text-lg font-bold text-slate-900">
          No hay citas para mostrar
        </h3>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          No se encontraron citas con los filtros seleccionados.
        </p>
      </article>
    );
  }

  return (
    <section className="space-y-4">
      {filteredAppointments.map((item) => {
        const status = (item.estado || "").toLowerCase();

        return (
          <article
            key={item.id}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <header className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <section className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <UserRound size={22} />
                  </span>

                  <section className="min-w-0">
                    <section className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                        {item.patient?.nombre || "Paciente"}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadgeClass(item.estado)}`}
                      >
                        {item.estado || "-"}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${getPriorityBadgeClass(item.prioridad)}`}
                      >
                        Prioridad: {item.prioridad || "-"}
                      </span>
                    </section>

                    <p className="mt-1 text-sm text-slate-500">
                      Cita #{item.id}
                    </p>
                  </section>
                </section>

                <section className="flex flex-wrap gap-2">
                  {status === "pendiente" && (
                    <button
                      type="button"
                      onClick={() => onApprove(item.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 size={17} />
                      Aprobar
                    </button>
                  )}

                  {status !== "cancelada" && (
                    <button
                      type="button"
                      onClick={() => onCancel(item.id)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                    >
                      <XCircle size={17} />
                      Cancelar
                    </button>
                  )}
                </section>
              </section>
            </header>

            <section className="p-5">
              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <CalendarDays
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Fecha
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {item.fecha || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Clock3
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hora
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {item.hora || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <UserRound
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Documento
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.patient?.documento || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Phone
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Teléfono
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.patient?.telefono || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Correo
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.patient?.email || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <WalletCards
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      EPS
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.patient?.eps || item.eps || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Departamento
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.departamento || "-"}
                    </p>
                  </section>
                </article>

                <article className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <MapPin
                    size={18}
                    className="mt-0.5 shrink-0 text-blue-600"
                  />

                  <section className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Municipio
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                      {item.municipio || "-"}
                    </p>
                  </section>
                </article>
              </section>

              <section className="mt-4 grid gap-3 xl:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <section className="flex items-center gap-2">
                    <FileText size={17} className="text-blue-600" />

                    <p className="text-sm font-bold text-slate-900">
                      Motivo de consulta
                    </p>
                  </section>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.motivoConsulta || "Sin detalle"}
                  </p>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-4">
                  <section className="flex items-center gap-2">
                    <FileText size={17} className="text-blue-600" />

                    <p className="text-sm font-bold text-slate-900">
                      Observaciones
                    </p>
                  </section>

                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    {item.observaciones || "Sin observaciones"}
                  </p>
                </article>
              </section>
            </section>
          </article>
        );
      })}
    </section>
  );
}