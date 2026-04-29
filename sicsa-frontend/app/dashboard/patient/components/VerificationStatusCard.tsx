"use client";

import {
  BadgeCheck,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  hasNoRequest: boolean;
  isPending: boolean;
  isRejected: boolean;
  isApproved: boolean;
};

export function VerificationStatusCard({
  hasNoRequest,
  isPending,
  isRejected,
  isApproved,
}: Props) {
  const router = useRouter();

  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white/90 p-6 shadow-lg backdrop-blur">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
          <ShieldCheck className="text-cyan-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Estado de verificación
          </h2>
          <p className="text-sm text-slate-600">
            Control de acceso para habilitar el agendamiento de citas.
          </p>
        </section>
      </header>

      {hasNoRequest && (
        <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-900">
            Aún no has solicitado verificación
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Debes completar este proceso para poder agendar citas médicas dentro
            del sistema.
          </p>
        </section>
      )}

      {isPending && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <section className="flex items-center gap-2">
            <ShieldAlert className="text-amber-700" size={18} />
            <p className="text-sm font-semibold text-amber-800">
              Solicitud en revisión
            </p>
          </section>
          <p className="mt-2 text-sm leading-6 text-amber-700">
            Tu solicitud fue enviada correctamente y se encuentra pendiente de
            validación por parte del administrador.
          </p>
        </section>
      )}

      {isRejected && (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5">
          <section className="flex items-center gap-2">
            <ShieldAlert className="text-rose-700" size={18} />
            <p className="text-sm font-semibold text-rose-800">
              Solicitud rechazada
            </p>
          </section>
          <p className="mt-2 text-sm leading-6 text-rose-700">
            Debes corregir la información enviada y volver a solicitar la
            verificación.
          </p>
        </section>
      )}

      {isApproved && (
        <section className="flex flex-col gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 md:flex-row md:items-center md:justify-between">
          <article>
            <section className="flex items-center gap-2">
              <BadgeCheck className="text-emerald-700" size={18} />
              <p className="text-sm font-semibold text-emerald-800">
                Verificación aprobada
              </p>
            </section>
            <p className="mt-2 text-sm leading-6 text-emerald-700">
              Ya puedes gestionar tus citas médicas dentro del portal del
              paciente.
            </p>
          </article>

          <button
            onClick={() => router.push("/dashboard/patient/appointments")}
            className="rounded-2xl bg-gradient-to-r from-sky-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
          >
            Ir a citas
          </button>
        </section>
      )}
    </section>
  );
}