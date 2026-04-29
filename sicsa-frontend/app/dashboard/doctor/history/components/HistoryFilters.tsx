"use client";

import { Filter, Search } from "lucide-react";

type HistoryFiltersProps = {
  search: string;
  dateFilter: string;
  onSearchChange: (value: string) => void;
  onDateChange: (value: string) => void;
};

export function HistoryFilters({
  search,
  dateFilter,
  onSearchChange,
  onDateChange,
}: HistoryFiltersProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
      <header className="flex items-center gap-2">
        <Filter size={16} className="text-slate-500" />
        <p className="text-sm font-medium text-slate-500">Filtros</p>
      </header>

      <section className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nombre o documento"
            className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </label>

        <label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
          />
        </label>
      </section>
    </article>
  );
}
