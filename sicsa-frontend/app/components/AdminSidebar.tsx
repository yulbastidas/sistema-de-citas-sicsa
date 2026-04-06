"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LogOut,
  ShieldCheck,
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
    <aside className="min-h-screen w-72 border-r border-slate-200 bg-white px-6 py-8">
      <header className="mb-10 border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          SICSA
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Administración
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Gestión hospitalaria y operativa
        </p>
      </header>

      <nav className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                active
                  ? "border border-blue-200 bg-blue-50 text-blue-900"
                  : "border border-transparent text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon size={18} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <header className="flex items-center gap-2">
          <ClipboardList size={18} className="text-slate-600" />
          <h2 className="text-sm font-semibold text-slate-800">
            Acceso rápido
          </h2>
        </header>
        <p className="mt-2 text-sm text-slate-600">
          Administra verificaciones, citas y cola de atención desde este panel.
        </p>
      </section>

      <button
        onClick={handleLogout}
        className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700 transition hover:bg-red-100"
      >
        <LogOut size={18} />
        Cerrar sesión
      </button>
    </aside>
  );
}