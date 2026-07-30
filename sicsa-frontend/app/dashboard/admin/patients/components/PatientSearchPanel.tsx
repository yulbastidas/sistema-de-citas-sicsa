"use client";

import {
    LoaderCircle,
    Search,
    UsersRound,
    X,
} from "lucide-react";

import { PatientListItem } from "./PatientListItem";

import type { Patient } from "../types";

type PatientSearchPanelProps = {
    patients: Patient[];
    selectedPatient: Patient | null;
    search: string;
    loading: boolean;
    onSearchChange: (value: string) => void;
    onSearch: () => void;
    onClearSearch: () => void;
    onSelectPatient: (patient: Patient) => void;
};

export function PatientSearchPanel({
    patients,
    selectedPatient,
    search,
    loading,
    onSearchChange,
    onSearch,
    onClearSearch,
    onSelectPatient,
}: PatientSearchPanelProps) {
    const inputClassName =
        "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

    return (
        <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-5">
                <section className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Search size={21} />
                    </span>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900">
                            Buscar paciente
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Selecciona un resultado para consultar y editar
                            sus datos.
                        </p>
                    </section>
                </section>
            </header>

            <section className="p-5">
                <section className="flex gap-2">
                    <article className="relative min-w-0 flex-1">
                        <Search
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                        />

                        <input
                            value={search}
                            onChange={(event) =>
                                onSearchChange(event.target.value)
                            }
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    onSearch();
                                }
                            }}
                            placeholder="Documento, nombre, correo, teléfono o EPS"
                            className={`${inputClassName} pl-10 ${search ? "pr-10" : ""
                                }`}
                        />

                        {search && (
                            <button
                                type="button"
                                onClick={onClearSearch}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </article>

                    <button
                        type="button"
                        onClick={onSearch}
                        disabled={loading}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Search size={17} />
                        )}

                        <span className="hidden sm:inline">
                            Buscar
                        </span>
                    </button>
                </section>

                <section className="mt-4 flex items-center justify-between border-b border-slate-200 pb-3">
                    <p className="text-sm font-semibold text-slate-700">
                        Resultados
                    </p>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {patients.length}
                    </span>
                </section>

                <section className="mt-3 max-h-[800px] space-y-3 overflow-y-auto pr-1">
                    {loading ? (
                        <article className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <LoaderCircle
                                className="animate-spin text-blue-600"
                                size={32}
                            />

                            <p className="mt-4 font-semibold text-slate-700">
                                Cargando pacientes...
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                                Consultando la información registrada.
                            </p>
                        </article>
                    ) : patients.length === 0 ? (
                        <article className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                                <UsersRound size={27} />
                            </span>

                            <h3 className="mt-4 font-bold text-slate-900">
                                No se encontraron pacientes
                            </h3>

                            <p className="mt-2 text-sm leading-5 text-slate-500">
                                Intenta buscar por documento, nombre, correo,
                                teléfono, EPS, ubicación o contacto de
                                emergencia.
                            </p>
                        </article>
                    ) : (
                        patients.map((patient) => (
                            <PatientListItem
                                key={patient.id}
                                patient={patient}
                                selected={
                                    selectedPatient?.id === patient.id
                                }
                                onSelect={onSelectPatient}
                            />
                        ))
                    )}
                </section>
            </section>
        </aside>
    );
}