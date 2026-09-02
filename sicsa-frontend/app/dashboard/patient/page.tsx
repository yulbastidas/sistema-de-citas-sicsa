"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { usePatientDashboard } from "./hooks/usePatientDashboard";
import { PatientHeader } from "./components/PatientHeader";
import { VerificationStatusCard } from "./components/VerificationStatusCard";
import { NextAppointmentCard } from "./components/NextAppointmentCard";
import { VerificationRequestForm } from "./components/VerificationRequestForm";

export default function PatientDashboard() {
  const {
    checkingAuth,
    patient,
    form,
    appointments,
    phoneVerificationStatus,
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
    <main className="min-h-screen bg-slate-100">
      <PatientHeader
        patient={patient}
        appointments={appointments}
        activeAppointments={activeAppointments}
        isApproved={isApproved}
        isPending={isPending}
        isRejected={isRejected}
        onLogout={handleLogout}
      />

      <section className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      {phoneVerificationStatus?.verified === false && (
        <section className="mb-5 flex flex-col gap-4 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-cyan-100 p-2 text-cyan-700">
              <Phone size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-bold text-slate-900">
                Verifica tu número de celular
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Para utilizar tu celular como método de acceso debes verificarlo.
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/patient/profile"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200"
          >
            Verificar celular
          </Link>
        </section>
      )}
      <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
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
        />
      )}
      </section>
    </main>
  );
}
