"use client";

import { useMemo } from "react";
import {
  CalendarDays,
  History,
} from "lucide-react";
import Link from "next/link";

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
    markingNoShowId,
    appointments,
    queueItems,
    handleLogout,
    handleMarkNoShow,
    openMedicalReportPdf,
  } = useDoctorDashboard();

  const totalConfirmed = appointments.length;
  const totalQueue = queueItems.length;

  const highPriorityCount = useMemo(() => {
    return queueItems.filter((item) => {
      const value = String(
        item.prioridad || "",
      ).toLowerCase();

      return (
        value.includes("alta") ||
        value === "3"
      );
    }).length;
  }, [queueItems]);

  const savedReportsCount = useMemo(() => {
    return appointments.filter(
      (item) =>
        item.medicalReport?.exists,
    ).length;
  }, [appointments]);

  /**
   * La próxima atención debe ser únicamente una cita
   * correspondiente al día actual.
   *
   * Las citas vencidas permanecen visibles en la agenda
   * para poder marcarlas como inasistencia, pero no deben
   * mostrarse como próxima atención.
   */
  const nextAppointment = useMemo(() => {
    return (
      appointments.find(
        (item) =>
          String(item.fecha || "").slice(
            0,
            10,
          ) === today,
      ) || null
    );
  }, [appointments, today]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <section className="rounded-2xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            Cargando panel médico...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <DoctorHeader
        user={user}
        today={today}
        onLogout={handleLogout}
      />

      <section className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <nav className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            <CalendarDays size={17} />

            Agenda del día
          </button>

          <Link
            href="/dashboard/doctor/history"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
          >
            <History size={17} />

            Historial clínico
          </Link>
        </nav>

        <DoctorStats
          loadingAppointments={
            loadingAppointments
          }
          loadingQueue={loadingQueue}
          totalConfirmed={totalConfirmed}
          totalQueue={totalQueue}
          highPriorityCount={
            highPriorityCount
          }
          savedReportsCount={
            savedReportsCount
          }
        />

        <DoctorSidebar
          loadingAppointments={
            loadingAppointments
          }
          totalConfirmed={totalConfirmed}
          savedReportsCount={
            savedReportsCount
          }
          nextAppointment={
            nextAppointment
          }
        />

        <section className="mt-6 grid items-start gap-6 xl:grid-cols-[1.12fr_0.88fr]">
          <DoctorQueue
            loadingQueue={loadingQueue}
            queueItems={queueItems}
            downloadingId={downloadingId}
            onOpenPdf={
              openMedicalReportPdf
            }
          />

          <TodayAppointments
            loadingAppointments={
              loadingAppointments
            }
            appointments={appointments}
            downloadingId={downloadingId}
            markingNoShowId={
              markingNoShowId
            }
            onOpenPdf={
              openMedicalReportPdf
            }
            onMarkNoShow={
              handleMarkNoShow
            }
          />
        </section>
      </section>
    </main>
  );
}