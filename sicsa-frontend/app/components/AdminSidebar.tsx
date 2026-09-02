"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, CalendarDays, ShieldCheck, UsersRound } from "lucide-react";
import { getUser, logout } from "@/service/session";
import { RoleProfileMenu } from "./RoleProfileMenu";
import { useSyncExternalStore } from "react";

type SessionUser = { email?: string; canViewReports?: boolean };

const subscribeToClient = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function AdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );
  const user = isClient ? (getUser() as SessionUser | null) : null;
  const items = [
    { label: "Verificaciones", href: "/dashboard/admin", icon: ShieldCheck },
    { label: "Citas", href: "/dashboard/admin/appointments", icon: CalendarDays },
    { label: "Pacientes", href: "/dashboard/admin/patients", icon: UsersRound },
    ...(user?.canViewReports === true ? [{ label: "Reportes", href: "/dashboard/admin/reports", icon: BarChart3 }] : []),
  ];

  return (
    <section className="relative z-20 border-b border-white/10 px-5 py-4 sm:px-7 lg:px-8">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <section className="flex min-w-0 items-center gap-3">
          <figure className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1 shadow-inner">
            <Image src="/hospital.jpg" alt="Logo E.S.E. Hospital Clarita Santos" width={48} height={48} className="h-full w-full rounded-xl object-contain mix-blend-screen" />
          </figure>
          <section className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">SICSA</p>
            <p className="truncate text-sm font-semibold text-white sm:text-base">Panel administrativo</p>
          </section>
        </section>

        <nav aria-label="Navegación administrativa" className="grid flex-1 grid-cols-2 gap-3 sm:flex sm:flex-wrap xl:justify-center">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <button key={item.href} type="button" onClick={() => router.push(item.href)} aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-14 items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:min-w-36 sm:text-base lg:px-5 ${active ? "border-white bg-white text-blue-950 shadow-lg ring-2 ring-cyan-200/30" : "border-white/15 bg-white/10 text-white shadow-sm hover:-translate-y-0.5 hover:border-cyan-200/50 hover:bg-white/15"}`}>
                <Icon size={20} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <RoleProfileMenu name={user?.email} roleLabel="Administrador" onLogout={() => { logout(); router.push("/login?role=admin"); }} />
      </section>
    </section>
  );
}
