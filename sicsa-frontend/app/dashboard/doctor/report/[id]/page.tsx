"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

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

  const completedFields = useMemo(() => {
    return Object.values(form).filter((value) => value.trim().length > 0).length;
  }, [form]);

  const totalFields = Object.keys(form).length;

  if (checkingAuth || loadingData) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <section className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
          <LoaderCircle
            size={22}
            className="animate-spin text-cyan-700"
          />

          <p className="text-sm font-semibold text-slate-600">
            Cargando reporte clínico...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <ReportHeader
        appointmentId={appointmentId}
        completedFields={completedFields}
        totalFields={totalFields}
        onBack={() => router.push("/dashboard/doctor")}
      />

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <PatientSummaryCard
          appointmentId={appointmentId}
          completedFields={completedFields}
          totalFields={totalFields}
        />

        <form onSubmit={handleSave} className="mt-6">
          <MedicalReportForm form={form} onChange={handleChange} />

          <ReportActions
            saving={saving}
            downloading={downloading}
            message={message}
            completedFields={completedFields}
            totalFields={totalFields}
            onDownloadPdf={() => {
              void handleDownloadPdf();
            }}
          />
        </form>
      </section>
    </main>
  );
}