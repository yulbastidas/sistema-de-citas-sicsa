"use client";

import {
  CalendarDays,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";

import { SessionUser } from "../types";
import { RoleProfileMenu } from "@/app/components/RoleProfileMenu";
import { DoctorNavigation } from "./DoctorNavigation";

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
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
      <section className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <section className="flex min-w-0 items-center gap-4">
          <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-inner">
            <Stethoscope size={28} />
          </figure>

          <section className="min-w-0">
            <section className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Panel médico
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                <ShieldCheck size={13} />
                Jornada activa
              </span>
            </section>

            <p className="mt-1 text-sm text-slate-300">
              Consulta tu agenda, prioriza pacientes y registra la atención
              clínica.
            </p>

            <section className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200">
              <p className="inline-flex items-center gap-2">
                <UserRound size={15} className="text-cyan-300" />
                <span className="truncate">
                  {user?.email || "Médico"}
                </span>
              </p>

              <p className="inline-flex items-center gap-2 capitalize">
                <CalendarDays size={15} className="text-cyan-300" />
                {formatDate(today)}
              </p>
            </section>
          </section>
        </section>

        <section className="flex flex-col gap-3 xl:items-end">
          <RoleProfileMenu name={user?.email} roleLabel="Médico" onLogout={onLogout} />
          <DoctorNavigation active="agenda" variant="hero" />
        </section>
      </section>
    </header>
  );
}
