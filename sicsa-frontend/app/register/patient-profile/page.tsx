"use client";

import { usePatientRegister } from "./hooks/usePatientRegister";
import { PatientRegisterForm } from "./components/PatientRegisterForm";

export default function PatientProfilePage() {
  const {
    form,
    epsList,
    departments,
    cities,
    loading,
    loadingEps,
    loadingDepartments,
    loadingCities,
    handleChange,
    handleSubmit,
  } = usePatientRegister();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <PatientRegisterForm
        form={form}
        epsList={epsList}
        departments={departments}
        cities={cities}
        loading={loading}
        loadingEps={loadingEps}
        loadingDepartments={loadingDepartments}
        loadingCities={loadingCities}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </main>
  );
}