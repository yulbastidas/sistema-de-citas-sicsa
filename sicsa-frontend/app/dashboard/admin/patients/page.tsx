"use client";


import { AdminPatientsHeader } from "./components/AdminPatientsHeader";
import { PatientEditPanel } from "./components/PatientEditPanel";
import { PatientSearchPanel } from "./components/PatientSearchPanel";
import { useAdminPatients } from "./hooks/useAdminPatients";

export default function AdminPatientsPage() {
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
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50">
      <section className="px-4 pb-5 sm:px-6 lg:px-8">
       <section className="mx-auto w-full max-w-[1600px]">
        <AdminPatientsHeader
          patientsCount={patients.length}
        />

        <section className="mt-5 space-y-5">
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
      </section>
    </main>
  );
}
