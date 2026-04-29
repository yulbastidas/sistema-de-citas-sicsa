"use client";

import { useMemo } from "react";
import { CalendarDays, FolderOpen } from "lucide-react";

import { useDoctorDashboard } from "./hooks/useDoctorDashboard";
import { DoctorHeader } from "./components/DoctorHeader";
import { DoctorStats } from "./components/DoctorStats";
import { DoctorSidebar } from "./components/DoctorSidebar";
import { DoctorQueue } from "./components/DoctorQueue";
import { TodayAppointments } from "./components/TodayAppointments";

export default function DoctorDashboardPage() {
  const {
    user,
    today,
    checkingAuth,
    loadingAppointments,
    loadingQueue,
    downloadingId,
    appointments,
    queueItems,
    handleLogout,
    openMedicalReportPdf,
  } = useDoctorDashboard();

  const totalConfirmed = appointments.length;
  const totalQueue = queueItems.length;

  const highPriorityCount = useMemo(() => {
    return queueItems.filter((item) => {
      const value = String(item.prioridad || "").toLowerCase();
      return value.includes("alta") || value === "3";
    }).length;
  }, [queueItems]);

  const savedReportsCount = useMemo(() => {
    return appointments.filter((item) => item.medicalReport?.exists).length;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    return appointments[0] || null;
  }, [appointments]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-5 py-6 lg:px-8">
      <header className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <DoctorHeader user={user} today={today} onLogout={handleLogout} />

        <section className="border-t border-slate-200 bg-slate-50 px-6 py-5">
          <nav className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white">
              <CalendarDays size={16} />
              Agenda del día
            </button>

            <a
              href="/dashboard/doctor/history"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <FolderOpen size={16} />
              Historial de atenciones
            </a>
          </nav>
        </section>

        <DoctorStats
          loadingAppointments={loadingAppointments}
          loadingQueue={loadingQueue}
          totalConfirmed={totalConfirmed}
          totalQueue={totalQueue}
          highPriorityCount={highPriorityCount}
          savedReportsCount={savedReportsCount}
        />
      </header>

      <DoctorSidebar
        user={user}
        loadingAppointments={loadingAppointments}
        totalConfirmed={totalConfirmed}
        savedReportsCount={savedReportsCount}
        nextAppointment={nextAppointment}
      />

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DoctorQueue
          loadingQueue={loadingQueue}
          queueItems={queueItems}
          downloadingId={downloadingId}
          onOpenPdf={openMedicalReportPdf}
        />

        <TodayAppointments
          loadingAppointments={loadingAppointments}
          appointments={appointments}
          downloadingId={downloadingId}
          onOpenPdf={openMedicalReportPdf}
        />
      </section>
    </main>
  );
}
