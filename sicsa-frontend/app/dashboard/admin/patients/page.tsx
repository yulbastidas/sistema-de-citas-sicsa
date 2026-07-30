"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { AdminPatientsHeader } from "./components/AdminPatientsHeader";
import { PatientEditPanel } from "./components/PatientEditPanel";
import { PatientSearchPanel } from "./components/PatientSearchPanel";
import { useAdminPatients } from "./hooks/useAdminPatients";

export default function AdminPatientsPage() {
  const router = useRouter();

  const {
    patients,
    selectedPatient,
    form,
    search,
    loading,
    saving,
    setSearch,
    selectPatient,
    updateFormField,
    searchPatients,
    clearSearch,
    savePatient,
  } = useAdminPatients();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1500px]">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/admin")
          }
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al panel administrativo
        </button>

        <AdminPatientsHeader
          patientsCount={patients.length}
        />

        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <PatientSearchPanel
            patients={patients}
            selectedPatient={selectedPatient}
            search={search}
            loading={loading}
            onSearchChange={setSearch}
            onSearch={searchPatients}
            onClearSearch={clearSearch}
            onSelectPatient={selectPatient}
          />

          <PatientEditPanel
            selectedPatient={selectedPatient}
            form={form}
            saving={saving}
            onChange={updateFormField}
            onSave={savePatient}
          />
        </section>
      </section>
    </main>
  );
}