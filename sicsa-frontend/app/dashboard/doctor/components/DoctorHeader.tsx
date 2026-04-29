"use client";

import {
  CalendarDays,
  LogOut,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { SessionUser } from "../types";

type DoctorHeaderProps = {
  user: SessionUser | null;
  today: string;
  onLogout: () => void;
};

export function DoctorHeader({ user, today, onLogout }: DoctorHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-8 py-8 text-white">
      <section className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <article className="flex items-start gap-4">
          <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/10 backdrop-blur">
            <Stethoscope size={30} className="text-white" />
          </figure>

          <section>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-cyan-100">
              <Sparkles size={14} />
              Jornada médica activa
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight lg:text-4xl">
              Panel del doctor
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-200 lg:text-base">
              Agenda del día, priorización clínica, citas activas y acceso a
              reportes en PDF.
            </p>

            <section className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-200">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <UserRound size={15} />
                <span>{user?.email || "Doctor"}</span>
              </p>

              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <ShieldCheck size={15} />
                <span>Rol médico activo</span>
              </p>

              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
                <CalendarDays size={15} />
                <span>{today}</span>
              </p>
            </section>
          </section>
        </article>

        <button
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </section>
    </section>
  );
}
