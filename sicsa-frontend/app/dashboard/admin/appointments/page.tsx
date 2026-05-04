"use client";

import { ClipboardList } from "lucide-react";
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
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-100">
      <AdminSidebar />

      <section className="flex-1 px-6 py-8">
        <header className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-8 py-8 text-white shadow-xl">
          <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <article className="flex items-start gap-4">
              <figure className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                <ClipboardList className="text-white" size={30} />
              </figure>

              <section>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Panel administrativo
                </p>
                <h1 className="mt-2 text-4xl font-bold tracking-tight">
                  Gestión integral de citas
                </h1>
                <p className="mt-2 max-w-3xl text-slate-200">
                  Controla la agenda clínica, registra citas manuales, revisa la
                  cola priorizada y administra el estado operativo del servicio.
                </p>
              </section>
            </article>

            <section className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Pendientes</p>
                <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Confirmadas</p>
                <p className="mt-1 text-2xl font-bold">{confirmedCount}</p>
              </article>

              <article className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-sm text-slate-200">Prioridad alta</p>
                <p className="mt-1 text-2xl font-bold">{highPriorityCount}</p>
              </article>
            </section>
          </section>
        </header>

        <section className="mt-6 grid gap-6 xl:grid-cols-[460px_1fr]">
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

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <header className="mb-6">
            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <article>
                <h2 className="text-2xl font-semibold text-slate-900">
                  Agenda general de citas
                </h2>
                <p className="mt-1 text-slate-600">
                  Control administrativo, operativo y seguimiento del estado.
                </p>
              </article>
            </section>

            <AppointmentFilters
              searchTerm={searchTerm}
              dateFilter={dateFilter}
              statusFilter={statusFilter}
              onSearchChange={setSearchTerm}
              onDateChange={setDateFilter}
              onStatusChange={setStatusFilter}
            />
          </header>

          <AdminAppointmentList
            filteredAppointments={filteredAppointments}
            loading={loading}
            onApprove={handleApprove}
            onCancel={handleCancel}
          />
        </section>
      </section>
    </main>
  );
}
