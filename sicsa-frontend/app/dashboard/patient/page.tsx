"use client";

import { LogOut } from "lucide-react";
import { usePatientDashboard } from "./hooks/usePatientDashboard";
import { PatientHeader } from "./components/PatientHeader";
import { VerificationStatusCard } from "./components/VerificationStatusCard";
import { NextAppointmentCard } from "./components/NextAppointmentCard";
import { VerificationRequestForm } from "./components/VerificationRequestForm";

export default function PatientDashboard() {
  const {
    checkingAuth,
    user,
    form,
    appointments,
    activeAppointments,
    nextActiveAppointment,
    requestLoading,
    isApproved,
    isPending,
    isRejected,
    hasNoRequest,
    handleLogout,
    handleRequestVerification,
  } = usePatientDashboard();

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-6 py-8">
      <PatientHeader
        user={user}
        appointments={appointments}
        activeAppointments={activeAppointments}
        isApproved={isApproved}
        isPending={isPending}
        isRejected={isRejected}
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <VerificationStatusCard
          hasNoRequest={hasNoRequest}
          isPending={isPending}
          isRejected={isRejected}
          isApproved={isApproved}
        />

        <NextAppointmentCard nextActiveAppointment={nextActiveAppointment} />
      </section>

      {!isApproved && (
        <VerificationRequestForm
          form={form}
          requestLoading={requestLoading}
          isPending={isPending}
          onSubmit={handleRequestVerification}
          onLogout={handleLogout}
        />
      )}

      {isApproved && (
        <section className="mt-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
          >
            <span className="inline-flex items-center gap-2">
              <LogOut size={16} />
              Cerrar sesión
            </span>
          </button>
        </section>
      )}
    </main>
  );
}