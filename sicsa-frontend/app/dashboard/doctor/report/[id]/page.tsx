"use client";

import { useParams } from "next/navigation";

import { useMedicalReport } from "./hooks/useMedicalReport";
import { ReportHeader } from "./components/ReportHeader";
import { PatientSummaryCard } from "./components/PatientSummaryCard";
import { MedicalReportForm } from "./components/MedicalReportForm";
import { ReportActions } from "./components/ReportActions";

export default function DoctorMedicalReportPage() {
  const params = useParams();
  const appointmentId = Number(params.id);

  const {
    checkingAuth,
    loadingData,
    saving,
    downloading,
    message,
    form,
    handleChange,
    handleSave,
    handleDownloadPdf,
    router,
  } = useMedicalReport(appointmentId);

  if (checkingAuth || loadingData) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-8">
        <p className="text-lg font-semibold text-slate-600">
          Cargando reporte clínico...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8">
      <ReportHeader
        appointmentId={appointmentId}
        onBack={() => router.push("/dashboard/doctor")}
      />

      <PatientSummaryCard appointmentId={appointmentId} />

      <form
        onSubmit={handleSave}
        className="mx-auto mt-6 max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <MedicalReportForm form={form} onChange={handleChange} />

        <ReportActions
          saving={saving}
          downloading={downloading}
          message={message}
          onDownloadPdf={() => {
            void handleDownloadPdf();
          }}
        />
      </form>
    </main>
  );
}
