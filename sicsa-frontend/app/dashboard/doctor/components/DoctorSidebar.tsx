"use client";

import {
  ArrowRight,
  Clock3,
  FileText,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { AppointmentItem } from "../types";

type DoctorSidebarProps = {
  loadingAppointments: boolean;
  totalConfirmed: number;
  savedReportsCount: number;
  nextAppointment: AppointmentItem | null;
};

export function DoctorSidebar({
  loadingAppointments,
  totalConfirmed,
  savedReportsCount,
  nextAppointment,
}: DoctorSidebarProps) {
  const router = useRouter();

  const pendingReports = Math.max(
    totalConfirmed - savedReportsCount,
    0,
  );

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-cyan-200 bg-white shadow-sm">
      <section className="grid lg:grid-cols-[1fr_auto]">
        <article className="p-5 sm:p-6">
          <header className="flex items-start gap-3">
            <figure className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-700 text-white">
              <Clock3 size={21} />
            </figure>

            <section>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">
                Próxima atención
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                {loadingAppointments
                  ? "Cargando paciente..."
                  : nextAppointment?.patient
                    ?.nombre ||
                  "No hay una cita pendiente para hoy"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {nextAppointment
                  ? "Paciente confirmado y listo para iniciar la atención."
                  : "Las citas vencidas pueden revisarse en la agenda y marcarse como inasistencia."}
              </p>
            </section>
          </header>

          {nextAppointment && (
            <section className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
              <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                <Clock3
                  size={16}
                  className="text-cyan-700"
                />

                <span className="font-semibold">
                  {nextAppointment.hora ||
                    "Sin hora"}
                </span>
              </p>

              <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                <UserRound
                  size={16}
                  className="text-cyan-700"
                />

                Documento:

                <span className="font-semibold">
                  {nextAppointment.patient
                    ?.documento || "-"}
                </span>
              </p>

              <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                <FileText
                  size={16}
                  className="text-cyan-700"
                />

                {nextAppointment.medicalReport
                  ?.exists
                  ? "Reporte registrado"
                  : "Reporte pendiente"}
              </p>
            </section>
          )}
        </article>

        <aside className="flex flex-col justify-center gap-3 border-t border-cyan-100 bg-cyan-50 p-5 lg:min-w-72 lg:border-l lg:border-t-0">
          <section className="grid grid-cols-2 gap-3">
            <article>
              <p className="text-xs font-medium text-slate-500">
                Pendientes
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {loadingAppointments
                  ? "..."
                  : totalConfirmed}
              </p>
            </article>

            <article>
              <p className="text-xs font-medium text-slate-500">
                Sin reporte
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {loadingAppointments
                  ? "..."
                  : pendingReports}
              </p>
            </article>
          </section>

          <button
            type="button"
            disabled={!nextAppointment}
            onClick={() => {
              if (!nextAppointment) {
                return;
              }

              router.push(
                `/dashboard/doctor/report/${nextAppointment.id}`,
              );
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Iniciar atención
            <ArrowRight size={17} />
          </button>
        </aside>
      </section>
    </section>
  );
}