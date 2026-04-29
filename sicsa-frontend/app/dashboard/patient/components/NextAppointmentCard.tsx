"use client";

import { CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AppointmentItem } from "../types";

type Props = {
  nextActiveAppointment?: AppointmentItem;
};

export function NextAppointmentCard({ nextActiveAppointment }: Props) {
  const router = useRouter();

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg backdrop-blur">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
          <CalendarDays className="text-emerald-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Próxima cita
          </h2>
          <p className="text-sm text-slate-600">
            Resumen rápido de tu atención más cercana.
          </p>
        </section>
      </header>

      {!nextActiveAppointment ? (
        <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm text-slate-600">
            No tienes citas activas registradas en este momento.
          </p>
        </article>
      ) : (
        <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-emerald-50 p-5">
          <p className="text-sm text-slate-500">Fecha</p>
          <p className="text-lg font-semibold text-slate-900">
            {nextActiveAppointment.fecha}
          </p>

          <p className="mt-4 text-sm text-slate-500">Hora</p>
          <p className="text-lg font-semibold text-slate-900">
            {nextActiveAppointment.hora}
          </p>

          <p className="mt-4 text-sm text-slate-500">Estado</p>
          <p className="text-lg font-semibold text-slate-900">
            {nextActiveAppointment.estado || "pendiente"}
          </p>

          <button
            onClick={() => router.push("/dashboard/patient/appointments")}
            className="mt-5 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Gestionar citas
          </button>
        </section>
      )}
    </section>
  );
}