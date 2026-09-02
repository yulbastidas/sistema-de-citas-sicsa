"use client";

import { useDoctorHistory } from "./hooks/useDoctorHistory";
import { HistoryHeader } from "./components/HistoryHeader";
import { HistoryFilters } from "./components/HistoryFilters";
import { HistoryList } from "./components/HistoryList";

export default function DoctorHistoryPage() {
  const {
    checkingAuth,
    loading,
    downloadingId,
    errorMessage,
    filteredAppointments,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    totalHistory,
    totalWithReport,
    handleDownloadPdf,
  } = useDoctorHistory();

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-lg font-semibold text-slate-600">Cargando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <HistoryHeader
        loading={loading}
        totalHistory={totalHistory}
        totalWithReport={totalWithReport}
      />

      <section className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
      <HistoryFilters
        search={search}
        dateFilter={dateFilter}
        onSearchChange={setSearch}
        onDateChange={setDateFilter}
      />

      <HistoryList
        key={`${search}|${dateFilter}`}
        loading={loading}
        errorMessage={errorMessage}
        filteredAppointments={filteredAppointments}
        downloadingId={downloadingId}
        onDownloadPdf={handleDownloadPdf}
      />
      </section>
    </main>
  );
}
