"use client";

import { CheckCircle2, XCircle } from "lucide-react";
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
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-600">Cargando citas...</p>
      </article>
    );
  }

  if (filteredAppointments.length === 0) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-slate-600">No hay citas para mostrar.</p>
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
            className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <section className="flex-1">
                <section className="flex flex-wrap items-center gap-3">
                  <p className="text-2xl font-bold text-slate-900">
                    {item.patient?.nombre || "Paciente"}
                  </p>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(item.estado)}`}
                  >
                    {item.estado || "-"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(item.prioridad)}`}
                  >
                    Prioridad: {item.prioridad || "-"}
                  </span>
                </section>

                <section className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-4">
                  <p>
                    <span className="font-medium text-slate-800">Fecha:</span>{" "}
                    {item.fecha || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Hora:</span>{" "}
                    {item.hora || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">
                      Documento:
                    </span>{" "}
                    {item.patient?.documento || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">
                      Teléfono:
                    </span>{" "}
                    {item.patient?.telefono || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">Correo:</span>{" "}
                    {item.patient?.email || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">EPS:</span>{" "}
                    {item.patient?.eps || item.eps || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">
                      Departamento:
                    </span>{" "}
                    {item.departamento || "-"}
                  </p>
                  <p>
                    <span className="font-medium text-slate-800">
                      Municipio:
                    </span>{" "}
                    {item.municipio || "-"}
                  </p>
                </section>

                <article className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Motivo de consulta
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {item.motivoConsulta || "Sin detalle"}
                  </p>
                </article>

                <article className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-500">
                    Observaciones
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    {item.observaciones || "Sin observaciones"}
                  </p>
                </article>
              </section>

              <aside className="w-full max-w-[260px] rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">
                  Acciones rápidas
                </p>

                <section className="mt-4 flex flex-wrap gap-2">
                  {status === "pendiente" && (
                    <button
                      onClick={() => onApprove(item.id)}
                      className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <CheckCircle2 size={16} />
                      Aprobar
                    </button>
                  )}

                  {status !== "cancelada" && (
                    <button
                      onClick={() => onCancel(item.id)}
                      className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                    >
                      <XCircle size={16} />
                      Cancelar
                    </button>
                  )}
                </section>
              </aside>
            </header>
          </article>
        );
      })}
    </section>
  );
}
