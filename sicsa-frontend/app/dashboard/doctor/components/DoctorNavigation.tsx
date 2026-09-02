"use client";

import Link from "next/link";
import { CalendarDays, History } from "lucide-react";

type DoctorNavigationProps = {
  active: "agenda" | "history";
  className?: string;
  variant?: "default" | "hero";
};

const baseItemClass =
  "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2";

const activeItemClass =
  "border-cyan-700 bg-cyan-700 font-bold text-white shadow-sm";

const inactiveItemClass =
  "border-transparent bg-white font-semibold text-slate-600 hover:border-cyan-100 hover:bg-cyan-50 hover:text-cyan-800";

export function DoctorNavigation({
  active,
  className = "",
  variant = "default",
}: DoctorNavigationProps) {
  const hero = variant === "hero";
  return (
    <nav
      aria-label="Navegación del módulo médico"
      className={`grid grid-cols-2 gap-2 rounded-2xl border p-1.5 shadow-sm sm:w-fit ${hero ? "border-white/10 bg-white/10" : "border-slate-200 bg-white"} ${className}`}
    >
      <Link
        href="/dashboard/doctor"
        aria-current={active === "agenda" ? "page" : undefined}
        className={`${baseItemClass} ${active === "agenda" ? (hero ? "border-white bg-white font-bold text-slate-950" : activeItemClass) : (hero ? "border-transparent bg-transparent font-semibold text-white hover:bg-white/10" : inactiveItemClass)}`}
      >
        <CalendarDays size={17} />
        Agenda del día
      </Link>

      <Link
        href="/dashboard/doctor/history"
        aria-current={active === "history" ? "page" : undefined}
        className={`${baseItemClass} ${active === "history" ? (hero ? "border-white bg-white font-bold text-slate-950" : activeItemClass) : (hero ? "border-transparent bg-transparent font-semibold text-white hover:bg-white/10" : inactiveItemClass)}`}
      >
        <History size={17} />
        Historial clínico
      </Link>
    </nav>
  );
}
