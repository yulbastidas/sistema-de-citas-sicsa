"use client";

import {
  Activity,
  CalendarCheck2,
  ClipboardList,
  FileCheck2,
} from "lucide-react";

type DoctorStatsProps = {
  loadingAppointments: boolean;
  loadingQueue: boolean;
  totalConfirmed: number;
  totalQueue: number;
  highPriorityCount: number;
  savedReportsCount: number;
};

type StatItemProps = {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
};

function StatItem({
  label,
  value,
  description,
  icon,
  iconClassName,
}: StatItemProps) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <figure
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </figure>

      <section className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </p>

        <section className="mt-1 flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-950">{value}</p>
          <p className="truncate text-xs text-slate-500">{description}</p>
        </section>
      </section>
    </article>
  );
}

export function DoctorStats({
  loadingAppointments,
  loadingQueue,
  totalConfirmed,
  totalQueue,
  highPriorityCount,
  savedReportsCount,
}: DoctorStatsProps) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatItem
        label="Confirmadas"
        value={loadingAppointments ? "..." : totalConfirmed}
        description="citas del día"
        icon={<CalendarCheck2 size={20} />}
        iconClassName="bg-cyan-50 text-cyan-700"
      />

      <StatItem
        label="En cola"
        value={loadingQueue ? "..." : totalQueue}
        description="pacientes"
        icon={<ClipboardList size={20} />}
        iconClassName="bg-violet-50 text-violet-700"
      />

      <StatItem
        label="Prioridad alta"
        value={loadingQueue ? "..." : highPriorityCount}
        description="casos urgentes"
        icon={<Activity size={20} />}
        iconClassName="bg-red-50 text-red-700"
      />

      <StatItem
        label="Reportes"
        value={loadingAppointments ? "..." : savedReportsCount}
        description="completados"
        icon={<FileCheck2 size={20} />}
        iconClassName="bg-emerald-50 text-emerald-700"
      />
    </section>
  );
}