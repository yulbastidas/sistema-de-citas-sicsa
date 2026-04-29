"use client";

import { MedicalReportForm as MedicalReportFormType } from "../types";

type FieldProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function Field({
  label,
  name,
  value,
  placeholder,
  rows = 4,
  onChange,
}: FieldProps) {
  return (
    <section>
      <label htmlFor={name} className="mb-2 block text-sm font-bold text-slate-800">
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-100"
      />
    </section>
  );
}

type MedicalReportFormProps = {
  form: MedicalReportFormType;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export function MedicalReportForm({ form, onChange }: MedicalReportFormProps) {
  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white p-7 shadow-sm">
      <header className="mb-6 border-b border-slate-200 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-700">
          Formato clínico
        </p>

        <h2 className="mt-2 text-2xl font-bold text-slate-950">
          Registro de atención médica
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Diligencia la valoración clínica del paciente. Esta información será
          usada para generar el reporte PDF institucional.
        </p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <h3 className="mb-4 text-base font-bold text-slate-900">
          1. Evaluación inicial
        </h3>

        <section className="grid gap-5">
          <Field
            label="Enfermedad actual"
            name="enfermedadActual"
            value={form.enfermedadActual}
            onChange={onChange}
            placeholder="Describe la enfermedad actual, evolución de síntomas y motivo clínico principal..."
            rows={4}
          />

          <Field
            label="Antecedentes"
            name="antecedentes"
            value={form.antecedentes}
            onChange={onChange}
            placeholder="Registra antecedentes personales, familiares, quirúrgicos, alérgicos o farmacológicos..."
            rows={4}
          />
        </section>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-base font-bold text-slate-900">
          2. Valoración física
        </h3>

        <section className="grid gap-5 md:grid-cols-2">
          <Field
            label="Signos vitales"
            name="signosVitales"
            value={form.signosVitales}
            onChange={onChange}
            placeholder="Ejemplo: TA 120/80, FC 80 lpm, FR 18 rpm, Temp. 36.5°C..."
            rows={5}
          />

          <Field
            label="Examen físico"
            name="examenFisico"
            value={form.examenFisico}
            onChange={onChange}
            placeholder="Describe hallazgos relevantes del examen físico por sistemas..."
            rows={5}
          />
        </section>
      </section>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
        <h3 className="mb-4 text-base font-bold text-slate-900">
          3. Conducta médica
        </h3>

        <section className="grid gap-5">
          <Field
            label="Diagnóstico"
            name="diagnostico"
            value={form.diagnostico}
            onChange={onChange}
            placeholder="Registra diagnóstico principal, impresión diagnóstica o CIE-10 si aplica..."
            rows={4}
          />

          <Field
            label="Tratamiento"
            name="tratamiento"
            value={form.tratamiento}
            onChange={onChange}
            placeholder="Indica manejo, medicamentos, recomendaciones, remisiones o controles..."
            rows={4}
          />

          <Field
            label="Observaciones"
            name="observaciones"
            value={form.observaciones}
            onChange={onChange}
            placeholder="Agrega notas adicionales, preparación, justificación u observaciones administrativas..."
            rows={3}
          />
        </section>
      </section>
    </section>
  );
}