"use client";

import {
  Activity,
  ClipboardPlus,
  FileSearch,
  HeartPulse,
  History,
  NotebookPen,
  Pill,
  Search,
  Stethoscope,
} from "lucide-react";

import { MedicalReportForm as MedicalReportFormType } from "../types";

type FieldProps = {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  rows?: number;
  helperText?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

function Field({
  label,
  name,
  value,
  placeholder,
  rows = 4,
  helperText,
  onChange,
}: FieldProps) {
  const characterCount = value.trim().length;

  return (
    <section>
      <section className="mb-2 flex items-end justify-between gap-3">
        <section>
          <label
            htmlFor={name}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}
          </label>

          {helperText ? (
            <p className="mt-1 text-xs text-slate-500">{helperText}</p>
          ) : null}
        </section>

        {characterCount > 0 ? (
          <span className="shrink-0 text-xs font-medium text-emerald-700">
            Diligenciado
          </span>
        ) : null}
      </section>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
      />

      {characterCount > 0 ? (
        <p className="mt-1 text-right text-xs text-slate-400">
          {characterCount} caracteres
        </p>
      ) : null}
    </section>
  );
}

type SectionHeaderProps = {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
};

function SectionHeader({
  step,
  title,
  description,
  icon,
  iconClassName,
}: SectionHeaderProps) {
  return (
    <header className="flex items-start gap-3 border-b border-slate-200 px-5 py-5 sm:px-6">
      <figure
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </figure>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          {step}
        </p>

        <h2 className="mt-1 text-lg font-bold text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </section>
    </header>
  );
}

export function MedicalReportForm({
  form,
  onChange,
}: MedicalReportFormProps) {
  return (
    <section className="grid gap-6">
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 1"
          title="Historia y evaluación inicial"
          description="Registra el estado actual del paciente y los antecedentes clínicos relevantes."
          icon={<ClipboardPlus size={20} />}
          iconClassName="bg-cyan-50 text-cyan-700"
        />

        <section className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <section className="mb-4 flex items-center gap-2 text-cyan-800">
              <FileSearch size={18} />
              <h3 className="font-bold">Enfermedad actual</h3>
            </section>

            <Field
              label="Descripción clínica"
              name="enfermedadActual"
              value={form.enfermedadActual}
              onChange={onChange}
              helperText="Incluye inicio, evolución, características y síntomas asociados."
              placeholder="Describe el inicio del cuadro, evolución de los síntomas y motivo clínico principal..."
              rows={8}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <section className="mb-4 flex items-center gap-2 text-violet-800">
              <History size={18} />
              <h3 className="font-bold">Antecedentes</h3>
            </section>

            <Field
              label="Antecedentes relevantes"
              name="antecedentes"
              value={form.antecedentes}
              onChange={onChange}
              helperText="Personales, familiares, quirúrgicos, alérgicos y farmacológicos."
              placeholder="Registra antecedentes personales, familiares, quirúrgicos, alérgicos o farmacológicos..."
              rows={8}
            />
          </section>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 2"
          title="Valoración física"
          description="Consigna los signos vitales y los hallazgos encontrados durante el examen físico."
          icon={<HeartPulse size={20} />}
          iconClassName="bg-red-50 text-red-700"
        />

        <section className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <section className="mb-4 flex items-center gap-2 text-red-700">
              <Activity size={18} />
              <h3 className="font-bold">Signos vitales</h3>
            </section>

            <Field
              label="Registro de signos vitales"
              name="signosVitales"
              value={form.signosVitales}
              onChange={onChange}
              helperText="Registra los valores obtenidos durante la valoración."
              placeholder="Ejemplo: TA 120/80 mmHg, FC 80 lpm, FR 18 rpm, temperatura 36.5 °C, SpO₂ 98 %..."
              rows={7}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <section className="mb-4 flex items-center gap-2 text-cyan-800">
              <Stethoscope size={18} />
              <h3 className="font-bold">Examen físico</h3>
            </section>

            <Field
              label="Hallazgos del examen"
              name="examenFisico"
              value={form.examenFisico}
              onChange={onChange}
              helperText="Describe los hallazgos positivos y negativos relevantes."
              placeholder="Describe los hallazgos del examen físico por sistemas..."
              rows={7}
            />
          </section>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 3"
          title="Diagnóstico y conducta médica"
          description="Define la impresión diagnóstica, tratamiento, recomendaciones y observaciones finales."
          icon={<NotebookPen size={20} />}
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <section className="grid gap-6 p-5 sm:p-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <section className="mb-4 flex items-center gap-2 text-emerald-800">
                <Search size={18} />
                <h3 className="font-bold">Diagnóstico</h3>
              </section>

              <Field
                label="Impresión diagnóstica"
                name="diagnostico"
                value={form.diagnostico}
                onChange={onChange}
                helperText="Incluye diagnóstico principal y CIE-10 cuando corresponda."
                placeholder="Registra el diagnóstico principal, impresión diagnóstica o código CIE-10..."
                rows={7}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <section className="mb-4 flex items-center gap-2 text-blue-800">
                <Pill size={18} />
                <h3 className="font-bold">Tratamiento</h3>
              </section>

              <Field
                label="Plan de manejo"
                name="tratamiento"
                value={form.tratamiento}
                onChange={onChange}
                helperText="Incluye medicamentos, recomendaciones, remisiones y controles."
                placeholder="Indica el manejo, medicamentos, recomendaciones, remisiones o controles..."
                rows={7}
              />
            </section>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <section className="mb-4 flex items-center gap-2 text-slate-700">
              <NotebookPen size={18} />
              <h3 className="font-bold">Observaciones adicionales</h3>
            </section>

            <Field
              label="Notas finales"
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              helperText="Agrega información complementaria relevante para la atención."
              placeholder="Agrega notas adicionales, preparación, justificación u observaciones administrativas..."
              rows={5}
            />
          </section>
        </section>
      </article>
    </section>
  );
}

type MedicalReportFormProps = {
  form: MedicalReportFormType;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};