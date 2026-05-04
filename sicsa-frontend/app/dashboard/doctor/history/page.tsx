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
    <main className="min-h-screen bg-slate-100 px-5 py-6 lg:px-8">
      <HistoryHeader
        loading={loading}
        totalHistory={totalHistory}
        totalWithReport={totalWithReport}
      />

      <HistoryFilters
        search={search}
        dateFilter={dateFilter}
        onSearchChange={setSearch}
        onDateChange={setDateFilter}
      />

      <HistoryList
        loading={loading}
        errorMessage={errorMessage}
        filteredAppointments={filteredAppointments}
        downloadingId={downloadingId}
        onDownloadPdf={handleDownloadPdf}
      />
    </main>
  );
}
