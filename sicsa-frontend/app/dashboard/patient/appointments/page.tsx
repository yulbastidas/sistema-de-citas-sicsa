"use client";

import {
  ArrowLeft,
  CalendarCheck2,
  CalendarClock,
  Clock3,
  Stethoscope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { usePatientAppointments } from "./hooks/usePatientAppointments";
import { AppointmentBookingForm } from "@/app/components/appointment-booking/AppointmentBookingForm";
import { PatientAppointmentList } from "./components/PatientAppointmentList";

export default function PatientAppointmentsPage() {
  const router = useRouter();

  const {
    checkingAuth,
    appointments,
    specialties,
    appointmentClasses,
    doctors,
    patientProfile,
    lastResult,
    availableHours,
    loadingAppointments,
    loadingHours,
    loadingDoctors,
    loadingCatalogs,
    saving,
    savingWaitlist,
    form,
    canCreateAppointment,
    activeAppointments,
    showWaitlistButton,
    today,
    handleFieldChange,
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
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50">
      <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
        <section className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
          <article className="flex items-start gap-4">
            <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-cyan-100 shadow-inner">
              <Stethoscope size={28} />
            </figure>

            <section>
              <button
                type="button"
                onClick={() => router.push("/dashboard/patient")}
                className="mb-3 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <ArrowLeft size={16} />
                Volver al panel
              </button>

              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
                Agenda del paciente
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Gestión de citas
              </h1>
              <p className="mt-2 max-w-3xl text-cyan-50">
                Consulta tus citas activas, revisa disponibilidad semanal y
                agenda una nueva solicitud cuando tu verificación esté aprobada.
              </p>
            </section>
          </article>

          <section className="grid gap-3 sm:grid-cols-3 xl:min-w-[530px]">
            <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-sm text-cyan-100"><CalendarCheck2 size={16} /> Mis citas</p>
              <p className="mt-2 text-2xl font-bold">{appointments.length}</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-sm text-cyan-100"><CalendarClock size={16} /> Citas activas</p>
              <p className="mt-2 text-2xl font-bold">
                {activeAppointments.length}
              </p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-sm">
              <p className="flex items-center gap-2 text-sm text-cyan-100"><Clock3 size={16} /> Horarios visibles</p>
              <p className="mt-2 text-2xl font-bold">
                {canCreateAppointment ? availableHours.length : 0}
              </p>
            </article>
          </section>
        </section>
      </header>

      <section className="mx-auto max-w-[1600px] px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,2.15fr)_minmax(340px,1fr)]">
        <AppointmentBookingForm
          mode="patient"
          patient={patientProfile}
          form={form}
          specialties={specialties}
          doctors={doctors}
          appointmentClasses={appointmentClasses}
          availableHours={availableHours}
          today={today}
          loadingCatalogs={loadingCatalogs}
          loadingDoctors={loadingDoctors}
          loadingHours={loadingHours}
          disabled={!canCreateAppointment}
          saving={saving}
          savingWaitlist={savingWaitlist}
          showWaitlist={showWaitlistButton}
          result={lastResult}
          onChange={handleFieldChange}
          onSubmit={handleCreateAppointment}
          onJoinWaitlist={handleJoinWaitlist}
        />
        <aside className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-950">Seguimiento</h2><p className="mt-2 text-sm text-slate-600">Tienes {activeAppointments.length} cita(s) activa(s). La disponibilidad corresponde al médico seleccionado.</p></aside>
      </section>

      <PatientAppointmentList
        appointments={appointments}
        loadingAppointments={loadingAppointments}
        onCancel={handleCancelAppointment}
      />
      </section>
    </main>
  );
}
