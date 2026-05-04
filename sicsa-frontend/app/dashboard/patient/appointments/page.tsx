"use client";

import { ArrowLeft, Stethoscope } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePatientAppointments } from "./hooks/usePatientAppointments";
import { PatientAppointmentForm } from "./components/PatientAppointmentForm";
import { WeeklyAvailability } from "./components/WeeklyAvailability";
import { PatientAppointmentList } from "./components/PatientAppointmentList";

export default function PatientAppointmentsPage() {
  const router = useRouter();

  const {
    checkingAuth,
    appointments,
    specialties,
    epsList,
    appointmentClasses,
    availableHours,
    loadingAppointments,
    loadingHours,
    loadingCatalogs,
    saving,
    savingWaitlist,
    form,
    canCreateAppointment,
    activeAppointments,
    showWaitlistButton,
    today,
    handleChange,
    handleSelectWeekDay,
    handleSelectHour,
    handleCreateAppointment,
    handleJoinWaitlist,
    handleCancelAppointment,
  } = usePatientAppointments();

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-sky-50">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 px-6 py-8">
      <header className="rounded-[2rem] bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-8 py-8 text-white shadow-xl">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <article className="flex items-start gap-4">
            <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
              <Stethoscope className="text-white" size={30} />
            </figure>

            <section>
              <button
                onClick={() => router.push("/dashboard/patient")}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-cyan-50 transition hover:text-white"
              >
                <ArrowLeft size={16} />
                Volver al panel
              </button>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Agenda del paciente
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">
                Gestión de citas
              </h1>
              <p className="mt-2 max-w-3xl text-cyan-50">
                Consulta tus citas activas, revisa disponibilidad semanal y
                agenda una nueva solicitud cuando tu verificación esté aprobada.
              </p>
            </section>
          </article>

          <section className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Mis citas</p>
              <p className="mt-1 text-2xl font-bold">{appointments.length}</p>
            </article>

            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Citas activas</p>
              <p className="mt-1 text-2xl font-bold">
                {activeAppointments.length}
              </p>
            </article>

            <article className="rounded-3xl border border-white/15 bg-white/15 px-5 py-4 backdrop-blur">
              <p className="text-sm text-cyan-100">Horarios visibles</p>
              <p className="mt-1 text-2xl font-bold">
                {canCreateAppointment ? availableHours.length : 0}
              </p>
            </article>
          </section>
        </section>
      </header>

      <section className="mt-6 grid gap-6 xl:grid-cols-[470px_1fr]">
        <PatientAppointmentForm
          form={form}
          specialties={specialties}
          epsList={epsList}
          appointmentClasses={appointmentClasses}
          loadingCatalogs={loadingCatalogs}
          canCreateAppointment={canCreateAppointment}
          saving={saving}
          onChange={handleChange}
          onSubmit={handleCreateAppointment}
        />

        <WeeklyAvailability
          form={form}
          availableHours={availableHours}
          loadingHours={loadingHours}
          canCreateAppointment={canCreateAppointment}
          showWaitlistButton={showWaitlistButton}
          savingWaitlist={savingWaitlist}
          activeAppointments={activeAppointments}
          appointments={appointments}
          today={today}
          onSelectDay={handleSelectWeekDay}
          onSelectHour={handleSelectHour}
          onJoinWaitlist={handleJoinWaitlist}
        />
      </section>

      <PatientAppointmentList
        appointments={appointments}
        loadingAppointments={loadingAppointments}
        onCancel={handleCancelAppointment}
      />
    </main>
  );
}