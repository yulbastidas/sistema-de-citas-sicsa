"use client";

import {
  CalendarDays,
  ChevronDown,
  LogOut,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { AppointmentItem, PatientSummary } from "../types";

type Props = {
  patient: PatientSummary | null;
  appointments: AppointmentItem[];
  activeAppointments: number;
  isApproved: boolean;
  isPending: boolean;
  isRejected: boolean;
  onLogout: () => void;
};

export function PatientHeader({
  patient,
  appointments,
  activeAppointments,
  isApproved,
  isPending,
  isRejected,
  onLogout,
}: Props) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const patientName =
    [patient?.primerNombre, patient?.primerApellido].filter(Boolean).join(" ") ||
    "Paciente";

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
      <section className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <article className="flex items-start gap-4">
          <figure className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1 shadow-inner backdrop-blur sm:h-[4.5rem] sm:w-[4.5rem]">
            <Image
              src="/hospital.jpg"
              alt="Logo E.S.E. Hospital Clarita Santos"
              width={72}
              height={72}
              className="h-full w-full rounded-xl object-contain mix-blend-screen"
              priority
            />
          </figure>

          <section>
            <section className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Bienvenido a SICSA
              </h1>
              <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                Portal del paciente
              </span>
            </section>

            <p className="mt-2 max-w-3xl text-cyan-50">
              Consulta tu estado de verificación, revisa tus citas y gestiona tu
              atención médica de forma sencilla.
            </p>

            <section className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-200">
              <p className="inline-flex items-center gap-2">
                <UserRound size={15} className="text-cyan-300" />
                {patientName}
              </p>
            </section>
          </section>
        </article>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:min-w-[680px]">
          <button
            type="button"
            onClick={() => router.push("/dashboard/patient/appointments")}
            className="group rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
            aria-label="Abrir Mis citas"
          >
            <p className="text-sm text-cyan-100">Mis citas</p>
            <p className="mt-1 flex items-center justify-between text-2xl font-bold">
              <span>{appointments.length}</span>
              <CalendarDays
                className="text-cyan-200 transition group-hover:translate-x-0.5"
                size={18}
              />
            </p>
          </button>

          <article className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            <p className="text-sm text-cyan-100">
              Citas activas
            </p>
            <p className="mt-1 text-2xl font-bold">
              {activeAppointments}
            </p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
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

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((current) => !current)}
              className="flex h-full min-h-[76px] w-full items-center justify-between gap-3 rounded-2xl border border-cyan-200/25 bg-slate-950/35 px-4 py-3 text-left shadow-lg backdrop-blur transition hover:border-cyan-200/50 hover:bg-slate-950/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-label={`Menú de usuario de ${patientName}`}
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-900">
                  <UserRound size={19} />
                </span>
                <span className="truncate text-sm font-bold text-white">
                  {patientName}
                </span>
              </span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-cyan-100 transition ${isMenuOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-30 mt-2 w-[min(19rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-2xl"
              >
                <Link
                  href="/dashboard/patient/profile"
                  role="menuitem"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-start gap-3 rounded-xl px-3 py-3 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-600"
                >
                  <UserRound className="mt-0.5 text-cyan-700" size={18} />
                  <span>
                    <span className="block text-sm font-bold">Mi perfil</span>
                    <span className="block text-xs text-slate-500">
                      Ver y editar mis datos
                    </span>
                  </span>
                </Link>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void onLogout();
                  }}
                  className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <LogOut className="mt-0.5 text-rose-600" size={18} />
                  <span>
                    <span className="block text-sm font-bold">Cerrar sesión</span>
                    <span className="block text-xs text-slate-500">
                      Salir de la cuenta
                    </span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>
      </section>
    </header>
  );
}
