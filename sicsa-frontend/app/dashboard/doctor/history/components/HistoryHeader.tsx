"use client";

import { CalendarDays, FileBadge2, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { DoctorNavigation } from "../../components/DoctorNavigation";
import { RoleProfileMenu } from "@/app/components/RoleProfileMenu";
import { getUser, logout } from "@/service/session";

type HistoryHeaderProps = {
  loading: boolean;
  totalHistory: number;
  totalWithReport: number;
};

export function HistoryHeader({
  loading,
  totalHistory,
  totalWithReport,
}: HistoryHeaderProps) {
  const router = useRouter();
  const user = getUser() as { email?: string } | null;
  return (
    <header className="shadow-sm">
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
        <section className="mx-auto grid max-w-[1600px] gap-5 px-4 py-5 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <section className="flex min-w-0 items-center gap-4">
            <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-inner">
              <FolderOpen size={27} />
            </figure>

            <section className="min-w-0">
              <section className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  Historial de atenciones
                </h1>

                <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-xs font-semibold text-cyan-100">
                  Módulo clínico
                </span>
              </section>

              <p className="mt-1 max-w-2xl text-sm text-slate-300">
                Consulta atenciones registradas, filtra por paciente o fecha y accede a los reportes en PDF.
              </p>

              <section className="mt-2.5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-200">
                <span className="inline-flex items-center gap-2">
                  <CalendarDays size={15} className="text-cyan-300" />
                  {loading ? "Cargando atenciones..." : `${totalHistory} atenciones registradas`}
                </span>
                <span className="inline-flex items-center gap-2">
                  <FileBadge2 size={15} className="text-cyan-300" />
                  {loading ? "Cargando reportes..." : `${totalWithReport} reportes disponibles`}
                </span>
              </section>
            </section>
          </section>

          <section className="flex flex-col gap-3 xl:items-end">
            <RoleProfileMenu name={user?.email} roleLabel="Médico" onLogout={() => { logout(); router.push("/login?role=doctor"); }} />
            <DoctorNavigation active="history" variant="hero" />
          </section>
        </section>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <section className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:px-8">
          <section className="grid gap-3 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <header className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Atenciones registradas
                </p>
                <CalendarDays size={18} className="text-slate-500" />
              </header>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {loading ? "..." : totalHistory}
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <header className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Reportes disponibles
                </p>
                <FileBadge2 size={18} className="text-slate-500" />
              </header>
              <p className="mt-1 text-2xl font-extrabold text-slate-900">
                {loading ? "..." : totalWithReport}
              </p>
            </article>
          </section>
        </section>
      </section>
    </header>
  );
}
