"use client";

import {
  CalendarCheck2,
  Clock3,
  ShieldAlert,
} from "lucide-react";
import AdminSidebar from "@/app/components/AdminSidebar";
import { useAdminAppointments } from "./hooks/useAdminAppointments";
import { AdminAppointmentFormPanel } from "./components/AdminAppointmentForm";
import { QueuePanel } from "./components/QueuePanel";
import { AppointmentFilters } from "./components/AppointmentFilters";
import { AdminAppointmentList } from "./components/AdminAppointmentList";

export default function AdminAppointmentsPage() {
  const {
    checkingAuth,
    loading,
    loadingQueue,
    loadingHours,
    loadingCatalogs,
    saving,
    queueItems,
    availableHours,
    specialties,
    epsList,
    appointmentClasses,
    selectedDate,
    statusFilter,
    dateFilter,
    searchTerm,
    form,
    filteredAppointments,
    pendingCount,
    confirmedCount,
    highPriorityCount,
    today,
    setSelectedDate,
    setStatusFilter,
    setDateFilter,
    setSearchTerm,
    handleTextChange,
    handleCheckboxChange,
    handleApprove,
    handleCancel,
    handleCreateAppointment,
  } = useAdminAppointments();

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <section className="flex flex-col items-center gap-4">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-base font-semibold text-slate-600">
            Cargando panel administrativo...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <section className="px-4 pb-5 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-[1600px]">
          {/* Encabezado principal */}
          <header className="relative left-1/2 w-[100dvw] -translate-x-1/2 overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 text-white shadow-lg">
            <AdminSidebar />
            <section className="relative px-6 py-7 sm:px-8 lg:px-10">
              <span className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
              <span className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />

              <section className="relative flex flex-col gap-7 2xl:flex-row 2xl:items-center 2xl:justify-between">
                <article className="max-w-4xl">
                  <section>
                    <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Gestión integral de citas
                    </h1>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
                      Controla la agenda clínica, registra citas manuales,
                      revisa la cola priorizada y administra el estado operativo
                      del servicio.
                    </p>
                  </section>
                </article>

                {/* Contadores */}
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 2xl:min-w-[510px]">
                  <article className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-sm backdrop-blur transition hover:bg-white/[0.14]">
                    <section className="flex items-center justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
                        <Clock3 size={20} />
                      </span>

                      <p className="text-3xl font-bold text-white">
                        {pendingCount}
                      </p>
                    </section>

                    <p className="mt-3 text-sm font-medium text-slate-200">
                      Citas pendientes
                    </p>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-sm backdrop-blur transition hover:bg-white/[0.14]">
                    <section className="flex items-center justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
                        <CalendarCheck2 size={20} />
                      </span>

                      <p className="text-3xl font-bold text-white">
                        {confirmedCount}
                      </p>
                    </section>

                    <p className="mt-3 text-sm font-medium text-slate-200">
                      Citas confirmadas
                    </p>
                  </article>

                  <article className="rounded-2xl border border-white/10 bg-white/10 px-4 py-4 shadow-sm backdrop-blur transition hover:bg-white/[0.14]">
                    <section className="flex items-center justify-between gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/15 text-red-200">
                        <ShieldAlert size={20} />
                      </span>

                      <p className="text-3xl font-bold text-white">
                        {highPriorityCount}
                      </p>
                    </section>

                    <p className="mt-3 text-sm font-medium text-slate-200">
                      Prioridad alta
                    </p>
                  </article>
                </section>
              </section>
            </section>
          </header>

          {/* Formulario y cola priorizada */}
          <section className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.9fr)]">
            <AdminAppointmentFormPanel
              form={form}
              specialties={specialties}
              epsList={epsList}
              appointmentClasses={appointmentClasses}
              availableHours={availableHours}
              loadingCatalogs={loadingCatalogs}
              loadingHours={loadingHours}
              saving={saving}
              today={today}
              onTextChange={handleTextChange}
              onCheckboxChange={handleCheckboxChange}
              onSubmit={handleCreateAppointment}
            />

            <QueuePanel
              queueItems={queueItems}
              loadingQueue={loadingQueue}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </section>

          {/* Agenda general */}
          <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 px-5 py-5 sm:px-6 lg:px-8">
              <section className="flex flex-col gap-5">
                <article>
                  <section className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                      <CalendarCheck2 size={22} />
                    </span>

                    <section>
                      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
                        Agenda general de citas
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-base">
                        Control administrativo, operativo y seguimiento del
                        estado de cada cita.
                      </p>
                    </section>
                  </section>
                </article>

                <AppointmentFilters
                  searchTerm={searchTerm}
                  dateFilter={dateFilter}
                  statusFilter={statusFilter}
                  onSearchChange={setSearchTerm}
                  onDateChange={setDateFilter}
                  onStatusChange={setStatusFilter}
                />
              </section>
            </header>

            <section className="p-4 sm:p-5 lg:p-6">
              <AdminAppointmentList
                filteredAppointments={filteredAppointments}
                loading={loading}
                onApprove={handleApprove}
                onCancel={handleCancel}
              />
            </section>
          </section>
        </section>
      </section>
    </main>
  );
}
