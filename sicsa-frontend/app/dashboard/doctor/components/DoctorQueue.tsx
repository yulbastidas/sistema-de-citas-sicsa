"use client";

import {
  ClipboardList,
  FileBadge2,
  FileText,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AppointmentItem } from "../types";

type DoctorQueueProps = {
  loadingQueue: boolean;
  queueItems: AppointmentItem[];
  downloadingId: number | null;
  onOpenPdf: (id: number) => Promise<void>;
};

function getPriorityStyles(priority: string | number | undefined) {
  const value = String(priority || "").toLowerCase();

  if (value.includes("alta") || value === "3") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      marker: "bg-red-500",
    };
  }

  if (value.includes("media") || value === "2") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      marker: "bg-amber-500",
    };
  }

  if (value.includes("baja") || value === "1") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      marker: "bg-emerald-500",
    };
  }

  return {
    badge: "border-slate-200 bg-slate-50 text-slate-700",
    marker: "bg-slate-400",
  };
}

export function DoctorQueue({
  loadingQueue,
  queueItems,
  downloadingId,
  onOpenPdf,
}: DoctorQueueProps) {
  const router = useRouter();

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-4">
        <section className="flex items-start gap-3">
          <figure className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
            <ClipboardList size={20} />
          </figure>

          <section>
            <h2 className="text-lg font-bold text-slate-950">
              Cola priorizada
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Orden de atención según prioridad clínica y horario.
            </p>
          </section>
        </section>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {loadingQueue ? "..." : queueItems.length}
        </span>
      </header>

      {loadingQueue ? (
        <section className="p-6">
          <p className="text-sm font-medium text-slate-500">
            Cargando cola clínica...
          </p>
        </section>
      ) : queueItems.length === 0 ? (
        <section className="p-6">
          <article className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <figure className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <ClipboardList size={22} />
            </figure>

            <p className="mt-4 font-semibold text-slate-700">
              No hay pacientes en cola
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Los pacientes confirmados y priorizados aparecerán aquí.
            </p>
          </article>
        </section>
      ) : (
        <section className="divide-y divide-slate-200">
          {queueItems.map((item, index) => {
            const priorityStyles = getPriorityStyles(item.prioridad);

            return (
              <article
                key={item.id}
                className="relative p-4 transition hover:bg-violet-50/30 sm:p-5"
              >
                <span
                  className={`absolute bottom-5 left-0 top-5 w-1 rounded-r-full ${priorityStyles.marker}`}
                />

                <section className="flex flex-col gap-5">
                  <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <section className="flex items-start gap-3">
                      <figure className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
                        {index + 1}
                      </figure>

                      <section>
                        <h3 className="text-base font-bold text-slate-950">
                          {item.patient?.nombre || "Paciente"}
                        </h3>

                        <section className="mt-2 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityStyles.badge}`}
                          >
                            Prioridad {item.prioridad || "sin definir"}
                          </span>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                              item.medicalReport?.exists
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                            }`}
                          >
                            {item.medicalReport?.exists
                              ? "Reporte guardado"
                              : "Reporte pendiente"}
                          </span>
                        </section>
                      </section>
                    </section>

                    <section className="flex items-center gap-3">
                      <article className="text-right">
                        <p className="text-xs font-medium text-slate-500">
                          Hora
                        </p>
                        <p className="text-lg font-bold text-slate-950">
                          {item.hora || "-"}
                        </p>
                      </article>

                      <article className="rounded-xl bg-slate-100 px-3 py-2 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          Score
                        </p>
                        <p className="text-lg font-bold text-slate-950">
                          {item.scorePrioridad ?? "-"}
                        </p>
                      </article>
                    </section>
                  </header>

                  <section className="grid gap-3 sm:grid-cols-2">
                    <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <UserRound size={15} className="text-slate-400" />
                      Documento:
                      <span className="font-semibold text-slate-800">
                        {item.patient?.documento || "-"}
                      </span>
                    </p>

                    <p className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <Phone size={15} className="text-slate-400" />
                      {item.patient?.telefono || "Sin teléfono"}
                    </p>

                    <p className="inline-flex items-center gap-2 text-sm text-slate-600 sm:col-span-2">
                      <Mail size={15} className="text-slate-400" />
                      <span className="break-all">
                        {item.patient?.email || "Sin correo"}
                      </span>
                    </p>
                  </section>

                  <article className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Motivo de consulta
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {item.motivoConsulta || "Sin información registrada"}
                    </p>
                  </article>

                  <footer className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        router.push(
                          `/dashboard/doctor/report/${item.id}`,
                        );
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
                    >
                      <FileText size={16} />
                      Atender paciente
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        void onOpenPdf(item.id);
                      }}
                      disabled={
                        downloadingId === item.id ||
                        !item.medicalReport?.exists
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FileBadge2 size={16} />
                      {downloadingId === item.id
                        ? "Descargando..."
                        : "Descargar PDF"}
                    </button>
                  </footer>
                </section>
              </article>
            );
          })}
        </section>
      )}
    </section>
  );
}
