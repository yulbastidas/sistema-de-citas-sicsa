"use client";

import { CalendarDays, Search, SlidersHorizontal } from "lucide-react";

type AppointmentFiltersProps = {
  searchTerm: string;
  dateFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
};

export function AppointmentFilters({
  searchTerm,
  dateFilter,
  statusFilter,
  onSearchChange,
  onDateChange,
  onStatusChange,
}: AppointmentFiltersProps) {
  return (
    <section className="mt-5 grid gap-4 xl:grid-cols-[1.3fr_220px_220px]">
      <article className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por paciente, documento, correo, EPS o municipio"
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
        />
      </article>

      <article className="relative">
        <CalendarDays
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
        />
      </article>

      <article className="relative">
        <SlidersHorizontal
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500"
        >
          <option value="todos">Todos</option>
          <option value="confirmada">Confirmadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </article>
    </section>
  );
}