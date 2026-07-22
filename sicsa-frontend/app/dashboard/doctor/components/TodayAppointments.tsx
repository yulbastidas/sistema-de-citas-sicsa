"use client";

import {
  CalendarDays,
  ChevronRight,
  FileBadge2,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AppointmentItem } from "../types";

type TodayAppointmentsProps = {
  loadingAppointments: boolean;
  appointments: AppointmentItem[];
  downloadingId: number | null;
  onOpenPdf: (id: number) => Promise<void>;
};

export function TodayAppointments({
  loadingAppointments,
  appointments,
  downloadingId,
  onOpenPdf,
}: TodayAppointmentsProps) {
  const router = useRouter();

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
        <section className="flex items-start gap-3">
          <figure className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
            <CalendarDays size={20} />
          </figure>

          <section>
            <h2 className="text-lg font-bold text-slate-950">
              Agenda confirmada
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Citas disponibles para atención durante la jornada.
            </p>
          </section>
        </section>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {loadingAppointments ? "..." : appointments.length}
        </span>
      </header>

      {loadingAppointments ? (
        <section className="p-6">
          <p className="text-sm font-medium text-slate-500">
            Cargando agenda...
          </p>
        </section>
      ) : appointments.length === 0 ? (
        <section className="p-6">
          <article className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="font-semibold text-slate-700">
              No hay citas confirmadas
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Las citas aprobadas aparecerán automáticamente.
            </p>
          </article>
        </section>
      ) : (
        <section className="divide-y divide-slate-200">
          {appointments.map((item) => (
            <article
              key={item.id}
              className="p-5 transition hover:bg-slate-50 sm:p-6"
            >
              <header className="flex items-start justify-between gap-4">
                <section className="min-w-0">
                  <h3 className="truncate font-bold text-slate-950">
                    {item.patient?.nombre || "Paciente"}
                  </h3>

                  <section className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-cyan-800">
                      {item.hora || "Sin hora"}
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="text-sm text-slate-500">
                      Cita #{item.id}
                    </span>

                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                        item.medicalReport?.exists
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {item.medicalReport?.exists
                        ? "Reporte listo"
                        : "Sin reporte"}
                    </span>
                  </section>
                </section>

                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/dashboard/doctor/report/${item.id}`,
                    );
                  }}
                  aria-label={`Abrir reporte de ${item.patient?.nombre || "paciente"}`}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700"
                >
                  <ChevronRight size={18} />
                </button>
              </header>

              <section className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">
                    Documento:
                  </span>{" "}
                  {item.patient?.documento || "-"}
                </p>

                <p className="text-slate-600">
                  <span className="font-semibold text-slate-800">
                    EPS:
                  </span>{" "}
                  {item.patient?.eps || "-"}
                </p>
              </section>

              <article className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                  {item.motivoConsulta ||
                    "Sin motivo de consulta registrado."}
                </p>
              </article>

              <footer className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/dashboard/doctor/report/${item.id}`,
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-3.5 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
                >
                  <FileText size={15} />
                  Abrir atención
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileBadge2 size={15} />
                  {downloadingId === item.id
                    ? "Descargando..."
                    : "PDF"}
                </button>
              </footer>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}