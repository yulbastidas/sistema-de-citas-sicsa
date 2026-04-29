"use client";

import { CalendarDays, FileBadge2, FileText } from "lucide-react";
import { AppointmentItem } from "../types";
import { useRouter } from "next/navigation";

type TodayAppointmentsProps = {
  loadingAppointments: boolean;
  appointments: AppointmentItem[];
  downloadingId: number | null;
  onOpenPdf: (id: number) => Promise<void>;
};

function getReportBadgeClass(exists: boolean | undefined) {
  if (exists) {
    return "border border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

export function TodayAppointments({
  loadingAppointments,
  appointments,
  downloadingId,
  onOpenPdf,
}: TodayAppointmentsProps) {
  const router = useRouter();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
      <header className="mb-6 flex items-start gap-3">
        <figure className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
          <CalendarDays size={22} />
        </figure>

        <section>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Citas confirmadas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pacientes listos para atención médica.
          </p>
        </section>
      </header>

      {loadingAppointments ? (
        <p className="text-slate-600">Cargando citas...</p>
      ) : appointments.length === 0 ? (
        <article className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-base font-semibold text-slate-700">
            No hay citas confirmadas disponibles.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Las citas aprobadas aparecerán automáticamente aquí.
          </p>
        </article>
      ) : (
        <section className="space-y-5">
          {appointments.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
            >
              <header className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <section className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.patient?.nombre || "Paciente"}
                  </h3>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getReportBadgeClass(item.medicalReport?.exists)}`}
                  >
                    {item.medicalReport?.exists
                      ? "Reporte guardado"
                      : "Sin reporte"}
                  </span>
                </section>

                <p className="text-sm font-medium text-slate-500">
                  Cita #{item.id}
                </p>
              </header>

              <section className="mt-4 grid gap-4">
                <article className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Fecha:</span>{" "}
                    {item.fecha || "-"}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Hora:</span>{" "}
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
                  <p className="text-sm text-slate-700 md:col-span-2">
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
            </article>
          ))}
        </section>
      )}
    </section>
  );
}