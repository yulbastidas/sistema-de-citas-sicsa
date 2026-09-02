"use client";

import { useMemo, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    Search,
    UsersRound,
    X,
} from "lucide-react";

import { PatientListItem } from "./PatientListItem";

import type { Patient } from "../types";

const PATIENTS_PER_PAGE = 10;

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
    const [currentPage, setCurrentPage] = useState(1);
    const inputClassName =
        "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

    const totalPages = Math.max(
        1,
        Math.ceil(patients.length / PATIENTS_PER_PAGE),
    );
    const visiblePage = Math.min(currentPage, totalPages);
    const paginatedPatients = useMemo(() => {
        const startIndex = (visiblePage - 1) * PATIENTS_PER_PAGE;

        return patients.slice(
            startIndex,
            startIndex + PATIENTS_PER_PAGE,
        );
    }, [patients, visiblePage]);
    const firstVisiblePatient =
        patients.length === 0
            ? 0
            : (visiblePage - 1) * PATIENTS_PER_PAGE + 1;
    const lastVisiblePatient = Math.min(
        visiblePage * PATIENTS_PER_PAGE,
        patients.length,
    );

    return (
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-5">
                <section className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <Search size={21} />
                    </span>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900">
                            Directorio de pacientes
                        </h2>

                        <p className="mt-1 text-sm text-slate-600">
                            Busca y selecciona un paciente para consultar sus datos.
                        </p>
                    </section>
                </section>
            </header>

            <section className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[300px_minmax(0,1fr)]">
                <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:row-span-2 lg:self-start">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    Buscar paciente
                  </p>
                <section className="flex flex-col gap-2">
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
                                    setCurrentPage(1);
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
                                onClick={() => {
                                    setCurrentPage(1);
                                    onClearSearch();
                                }}
                                aria-label="Limpiar búsqueda"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </article>

                    <button
                        type="button"
                        onClick={() => {
                            setCurrentPage(1);
                            onSearch();
                        }}
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Search size={17} />
                        )}

                        <span>
                            Buscar
                        </span>
                    </button>
                </section>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Puedes buscar usando los datos actualmente soportados por el sistema.
                </p>
                </aside>

                <section className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <p className="text-sm font-semibold text-slate-700">
                        Resultados
                    </p>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {patients.length}
                    </span>
                </section>

                <section>
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
                        <section className="grid gap-3 xl:grid-cols-2">
                        {paginatedPatients.map((patient) => (
                            <PatientListItem
                                key={patient.id}
                                patient={patient}
                                selected={
                                    selectedPatient?.id === patient.id
                                }
                                onSelect={onSelectPatient}
                            />
                        ))}
                        </section>
                    )}
                </section>

                {!loading && patients.length > 0 && (
                    <footer className="col-start-1 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 lg:col-start-2 sm:flex-row sm:items-center sm:justify-between">
                        <section>
                            <p className="text-sm font-semibold text-slate-700">
                                Mostrando {firstVisiblePatient} a {lastVisiblePatient} de {patients.length} pacientes
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Página {visiblePage} de {totalPages}
                            </p>
                        </section>

                        <nav
                            aria-label="Paginación de pacientes"
                            className="flex flex-wrap items-center gap-2"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.max(page - 1, 1),
                                    )
                                }
                                disabled={visiblePage === 1}
                                className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                                <span className="hidden sm:inline">Anterior</span>
                            </button>

                            {Array.from(
                                { length: totalPages },
                                (_, index) => index + 1,
                            ).map((page) => (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    aria-current={visiblePage === page ? "page" : undefined}
                                    className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2.5 text-sm font-bold transition ${
                                        visiblePage === page
                                            ? "border-blue-700 bg-blue-700 text-white shadow-sm"
                                            : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            <button
                                type="button"
                                onClick={() =>
                                    setCurrentPage((page) =>
                                        Math.min(
                                            Math.min(page, totalPages) + 1,
                                            totalPages,
                                        ),
                                    )
                                }
                                disabled={visiblePage === totalPages}
                                className="flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span className="hidden sm:inline">Siguiente</span>
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    </footer>
                )}
            </section>
        </section>
    );
}
