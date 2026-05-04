"use client";

type PatientSummaryCardProps = {
  appointmentId: number;
};

export function PatientSummaryCard({ appointmentId }: PatientSummaryCardProps) {
  return (
    <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-slate-50 px-6 py-4 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        Cita en edición:{" "}
        <span className="font-bold text-slate-800">#{appointmentId}</span>
      </p>
    </section>
  );
}
