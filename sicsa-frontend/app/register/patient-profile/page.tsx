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
    errors,
    registrationChannel,
    handleChange,
    handleSubmit,
  } = usePatientRegister();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-4 py-8 md:p-10">
      <PatientRegisterForm
        form={form}
        epsList={epsList}
        departments={departments}
        cities={cities}
        loading={loading}
        loadingEps={loadingEps}
        loadingDepartments={loadingDepartments}
        loadingCities={loadingCities}
        errors={errors}
        registrationChannel={registrationChannel}
        onChange={handleChange}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
