"use client";

import { HeartPulse, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AppointmentItem, SessionUser } from "../types";

type Props = {
  user: SessionUser | null;
  appointments: AppointmentItem[];
  activeAppointments: number;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
};

export function PatientHeader({
  user,
  appointments,
  activeAppointments,
  isApproved,
  isPending,
  isRejected,
}: Props) {
  const router = useRouter();

  return (
    <header className="rounded-[2rem] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-8 py-8 text-white shadow-xl">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <article className="flex items-start gap-4">
          <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
            <HeartPulse size={30} className="text-white" />
          </figure>

          <section>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100">
              Portal del paciente
            </p>

            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Bienvenido a SICSA
            </h1>

            <p className="mt-2 max-w-3xl text-cyan-50">
              Consulta tu estado de verificación, revisa tus citas y gestiona tu
              atención médica de forma sencilla.
            </p>

            <p className="mt-3 text-sm font-medium text-cyan-100">
              {user?.email || "Paciente"}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/patient/profile")
              }
              className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
            >
              <UserRound size={18} />
              Mi perfil
            </button>
          </section>
        </article>

        <section className="grid gap-3 sm:grid-cols-3">
          <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
            <p className="text-sm text-cyan-100">Mis citas</p>
            <p className="mt-1 text-2xl font-bold">
              {appointments.length}
            </p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
            <p className="text-sm text-cyan-100">
              Citas activas
            </p>
            <p className="mt-1 text-2xl font-bold">
              {activeAppointments}
            </p>
          </article>

          <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
            <p className="text-sm text-cyan-100">
              Estado
            </p>
            <p className="mt-1 text-lg font-bold">
              {isApproved
                ? "Aprobado"
                : isPending
                  ? "Pendiente"
                  : isRejected
                    ? "Rechazado"
                    : "Sin solicitud"}
            </p>
          </article>
        </section>
      </section>
    </header>
  );
}