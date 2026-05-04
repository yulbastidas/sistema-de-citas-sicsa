"use client";

import { ClipboardList, FileBadge2, FileText, Mail, Phone } from "lucide-react";
import { AppointmentItem } from "../types";
import { useRouter } from "next/navigation";

type DoctorQueueProps = {
  loadingQueue: boolean;
  queueItems: AppointmentItem[];
  downloadingId: number | null;
  onOpenPdf: (id: number) => Promise<void>;
};

function getPriorityBadgeClass(priority: string | number | undefined) {
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

function getReportBadgeClass(exists: boolean | undefined) {
  if (exists) {
    return "border border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

export function DoctorQueue({
  loadingQueue,
  queueItems,
  downloadingId,
  onOpenPdf,
}: DoctorQueueProps) {
  const router = useRouter();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
      <header className="mb-6 flex items-start gap-3">
        <figure className="rounded-2xl bg-violet-50 p-3 text-violet-700">
          <ClipboardList size={22} />
        </figure>

        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Cola priorizada del día
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Orden clínico de atención según prioridad y horario.
          </p>
        </section>
      </header>

      {loadingQueue ? (
        <p className="text-slate-600">Cargando cola...</p>
      ) : queueItems.length === 0 ? (
        <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            No hay pacientes en la cola de hoy.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Cuando existan citas confirmadas del día aparecerán aquí.
          </p>
        </article>
      ) : (
        <section className="space-y-5">
          {queueItems.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
            >
              <header className="border-b border-slate-200 bg-white px-5 py-4">
                <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <section className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold text-slate-900">
                      #{index + 1} {item.patient?.nombre || "Paciente"}
                    </h3>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getPriorityBadgeClass(item.prioridad)}`}
                    >
                      Prioridad: {item.prioridad || "-"}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getReportBadgeClass(item.medicalReport?.exists)}`}
                    >
                      {item.medicalReport?.exists
                        ? "Reporte guardado"
                        : "Sin reporte"}
                    </span>
                  </section>

                  <aside className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Score
                    </p>
                    <p className="mt-1 text-3xl font-bold text-slate-900">
                      {item.scorePrioridad ?? "-"}
                    </p>
                  </aside>
                </section>
              </header>

              <section className="grid gap-5 p-5 xl:grid-cols-[1fr_0.9fr]">
                <section className="space-y-4">
                  <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        Hora:
                      </span>{" "}
                      {item.hora || "-"}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        Documento:
                      </span>{" "}
                      {item.patient?.documento || "-"}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">EPS:</span>{" "}
                      {item.patient?.eps || "-"}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">
                        Teléfono:
                      </span>{" "}
                      {item.patient?.telefono || "-"}
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

                <section className="space-y-4">
                  <article className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-500">
                      Contacto rápido
                    </p>

                    <section className="mt-3 space-y-3">
                      <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <Phone size={15} className="text-slate-400" />
                        {item.patient?.telefono || "Sin teléfono"}
                      </p>

                      <p className="inline-flex items-center gap-2 break-all text-sm text-slate-700">
                        <Mail size={15} className="text-slate-400" />
                        {item.patient?.email || "Sin correo"}
                      </p>
                    </section>
                  </article>

                  <footer className="flex flex-wrap gap-3">
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
                        void onOpenPdf(item.id);
                      }}
                      disabled={
                        downloadingId === item.id || !item.medicalReport?.exists
                      }
                      className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                    >
                      <FileBadge2 size={16} />
                      {downloadingId === item.id
                        ? "Descargando PDF..."
                        : "Descargar PDF"}
                    </button>
                  </footer>
                </section>
              </section>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}