"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LogOut,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { logout } from "@/service/session";

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    {
      label: "Verificaciones",
      href: "/dashboard/admin",
      icon: ShieldCheck,
    },
    {
      label: "Citas",
      href: "/dashboard/admin/appointments",
      icon: CalendarDays,
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login?role=admin");
  };

  return (
    <aside className="sticky top-0 min-h-screen w-80 border-r border-slate-200 bg-white/95 px-6 py-8 shadow-sm backdrop-blur">
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-6 py-6 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">
          SICSA
        </p>
        <h1 className="mt-3 text-3xl font-bold">Administración</h1>
        <p className="mt-2 text-sm text-slate-200">
          Gestión hospitalaria, operativa y seguimiento clínico.
        </p>
      </header>

      <nav className="mt-8 space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition ${
                active
                  ? "border border-blue-200 bg-blue-50 text-blue-900 shadow-sm"
                  : "border border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  active ? "bg-blue-100" : "bg-slate-100"
                }`}
              >
                <Icon size={18} />
              </span>
              <span className="font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <ClipboardList size={18} className="text-slate-700" />
          </span>
          <article>
            <h2 className="text-sm font-semibold text-slate-900">
              Acceso rápido
            </h2>
            <p className="text-xs text-slate-500">Resumen del panel</p>
          </article>
        </header>

        <p className="mt-4 text-sm leading-6 text-slate-600">
          Revisa verificaciones, administra citas y mantén control del flujo
          operativo del sistema.
        </p>
      </section>

      <section className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-5">
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
            <Sparkles size={18} className="text-blue-700" />
          </span>
          <article>
            <h2 className="text-sm font-semibold text-blue-900">
              Panel interno
            </h2>
            <p className="text-xs text-blue-700">Uso administrativo</p>
          </article>
        </header>

        <p className="mt-3 text-sm leading-6 text-blue-800">
          Este espacio está diseñado para el control de personal interno y
          seguimiento administrativo.
        </p>
      </section>

      <button
        onClick={handleLogout}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 font-semibold text-red-700 transition hover:bg-red-100"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  );
}