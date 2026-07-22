"use client";

import {
  CalendarDays,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

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
  const hasFilters =
    searchTerm.trim() !== "" ||
    dateFilter !== "" ||
    statusFilter !== "todos";

  const handleClearFilters = () => {
    onSearchChange("");
    onDateChange("");
    onStatusChange("todos");
  };

  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_210px_210px_auto]">
      <article className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar paciente, documento, correo, EPS o municipio"
          className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </article>

      <article className="relative">
        <CalendarDays
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
      </article>

      <article className="relative">
        <SlidersHorizontal
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />

        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendientes</option>
          <option value="confirmada">Confirmadas</option>
          <option value="aprobada">Aprobadas</option>
          <option value="atendida">Atendidas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </article>

      {hasFilters && (
        <button
          type="button"
          onClick={handleClearFilters}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          <X size={17} />
          Limpiar
        </button>
      )}
    </section>
  );
}