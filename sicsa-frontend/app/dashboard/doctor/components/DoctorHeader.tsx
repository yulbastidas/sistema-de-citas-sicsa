"use client";

import {
  CalendarDays,
  LogOut,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { SessionUser } from "../types";

type DoctorHeaderProps = {
  user: SessionUser | null;
  today: string;
  onLogout: () => void;
};

function formatDate(date: string) {
  if (!date) return "";

  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function DoctorHeader({
  user,
  today,
  onLogout,
}: DoctorHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <section className="mx-auto flex max-w-[1500px] flex-col gap-5 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <section className="flex min-w-0 items-center gap-4">
          <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-700 text-white shadow-sm">
            <Stethoscope size={28} />
          </figure>

          <section className="min-w-0">
            <section className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Panel médico
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={13} />
                Jornada activa
              </span>
            </section>

            <p className="mt-1 text-sm text-slate-500">
              Consulta tu agenda, prioriza pacientes y registra la atención
              clínica.
            </p>

            <section className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2">
                <UserRound size={15} className="text-slate-400" />
                <span className="truncate">
                  {user?.email || "Médico"}
                </span>
              </p>

              <p className="inline-flex items-center gap-2 capitalize">
                <CalendarDays size={15} className="text-slate-400" />
                {formatDate(today)}
              </p>
            </section>
          </section>
        </section>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 lg:self-auto"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </section>
    </header>
  );
}