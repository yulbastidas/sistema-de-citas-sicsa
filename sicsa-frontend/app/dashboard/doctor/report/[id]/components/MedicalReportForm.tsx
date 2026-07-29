"use client";

import type { ChangeEvent, ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ClipboardPlus,
  FileHeart,
  FileSearch,
  HeartPulse,
  History,
  NotebookPen,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";

import { MedicalReportForm as MedicalReportFormType } from "../types";

type MedicalFieldChangeEvent = ChangeEvent<
  HTMLInputElement | HTMLTextAreaElement
>;

type MedicalReportFormProps = {
  form: MedicalReportFormType;
  onChange: (event: MedicalFieldChangeEvent) => void;
};

type SectionHeaderProps = {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  iconClassName: string;
};

type TextAreaFieldProps = {
  label: string;
  name: keyof MedicalReportFormType;
  value: string;
  placeholder: string;
  helperText?: string;
  rows?: number;
  required?: boolean;
  onChange: (event: MedicalFieldChangeEvent) => void;
};

type InputFieldProps = {
  label: string;
  name: keyof MedicalReportFormType;
  value: string;
  placeholder: string;
  helperText?: string;
  unit?: string;
  readOnly?: boolean;
  inputMode?: "text" | "decimal" | "numeric";
  required?: boolean;
  onChange: (event: MedicalFieldChangeEvent) => void;
};

function SectionHeader({
  step,
  title,
  description,
  icon,
  iconClassName,
}: SectionHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-6">
      <section className="flex items-start gap-3">
        <figure
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </figure>

        <section>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
            {step}
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            {title}
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </section>
      </section>
    </header>
  );
}

function FieldStatus({
  value,
  required,
}: {
  value: string;
  required?: boolean;
}) {
  const hasValue = value.trim().length > 0;

  if (hasValue) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">
        <ShieldCheck size={12} />
        Diligenciado
      </span>
    );
  }

  if (required) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
        <AlertTriangle size={12} />
        Requerido
      </span>
    );
  }

  return null;
}

function TextAreaField({
  label,
  name,
  value,
  placeholder,
  helperText,
  rows = 5,
  required = false,
  onChange,
}: TextAreaFieldProps) {
  const characterCount = value.trim().length;

  return (
    <section>
      <section className="mb-2 flex items-start justify-between gap-3">
        <section>
          <label
            htmlFor={name}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}

            {required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </label>

          {helperText ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {helperText}
            </p>
          ) : null}
        </section>

        <FieldStatus value={value} required={required} />
      </section>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        required={required}
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

function InputField({
  label,
  name,
  value,
  placeholder,
  helperText,
  unit,
  readOnly = false,
  inputMode = "text",
  required = false,
  onChange,
}: InputFieldProps) {
  return (
    <section>
      <section className="mb-2 flex items-start justify-between gap-3">
        <section>
          <label
            htmlFor={name}
            className="block text-sm font-semibold text-slate-800"
          >
            {label}

            {required ? (
              <span className="ml-1 text-red-500">*</span>
            ) : null}
          </label>

          {helperText ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {helperText}
            </p>
          ) : null}
        </section>

        <FieldStatus value={value} required={required} />
      </section>

      <section className="relative">
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          inputMode={inputMode}
          readOnly={readOnly}
          required={required}
          className={`w-full rounded-xl border px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 ${unit ? "pr-16" : ""
            } ${readOnly
              ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-600"
              : "border-slate-300 bg-white hover:border-slate-400 focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
            }`}
        />

        {unit ? (
          <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold text-slate-500">
            {unit}
          </span>
        ) : null}
      </section>
    </section>
  );
}

function ClinicalCard({
  title,
  description,
  icon,
  iconClassName,
  children,
}: {
  title: string;
  description?: string;
  icon: ReactNode;
  iconClassName: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <header className="mb-5 flex items-start gap-3">
        <figure
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </figure>

        <section>
          <h3 className="font-bold text-slate-900">{title}</h3>

          {description ? (
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </section>
      </header>

      {children}
    </section>
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
          title="Motivo e historia de la enfermedad"
          description="Registra la razón principal de la consulta y la evolución clínica del cuadro actual."
          icon={<ClipboardPlus size={21} />}
          iconClassName="bg-cyan-50 text-cyan-700"
        />

        <section className="grid gap-6 p-5 sm:p-6 xl:grid-cols-2">
          <ClinicalCard
            title="Motivo de consulta"
            description="Indica brevemente por qué el paciente solicita la atención."
            icon={<FileHeart size={18} />}
            iconClassName="bg-blue-100 text-blue-700"
          >
            <TextAreaField
              label="Motivo principal"
              name="motivoConsulta"
              value={form.motivoConsulta}
              onChange={onChange}
              placeholder="Ejemplo: dolor abdominal de tres días de evolución..."
              helperText="Resume el síntoma, molestia o necesidad principal expresada por el paciente."
              rows={7}
              required
            />
          </ClinicalCard>

          <ClinicalCard
            title="Enfermedad actual"
            description="Describe de forma cronológica el cuadro clínico."
            icon={<FileSearch size={18} />}
            iconClassName="bg-cyan-100 text-cyan-700"
          >
            <TextAreaField
              label="Descripción clínica"
              name="enfermedadActual"
              value={form.enfermedadActual}
              onChange={onChange}
              placeholder="Describe el inicio, duración, evolución, intensidad, factores asociados y síntomas acompañantes..."
              helperText="Incluye inicio, evolución, localización, intensidad y síntomas relacionados."
              rows={7}
              required
            />
          </ClinicalCard>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 2"
          title="Antecedentes clínicos"
          description="Organiza la información previa del paciente para facilitar la valoración y la toma de decisiones."
          icon={<History size={21} />}
          iconClassName="bg-violet-50 text-violet-700"
        />

        <section className="grid gap-6 p-5 sm:p-6">
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ClinicalCard
              title="Personales"
              icon={<UserRoundCheck size={18} />}
              iconClassName="bg-cyan-100 text-cyan-700"
            >
              <TextAreaField
                label="Antecedentes personales"
                name="antecedentesPersonales"
                value={form.antecedentesPersonales}
                onChange={onChange}
                placeholder="Enfermedades crónicas, hospitalizaciones, antecedentes relevantes..."
                helperText="Incluye patologías previas y condiciones actuales conocidas."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Familiares"
              icon={<History size={18} />}
              iconClassName="bg-violet-100 text-violet-700"
            >
              <TextAreaField
                label="Antecedentes familiares"
                name="antecedentesFamiliares"
                value={form.antecedentesFamiliares}
                onChange={onChange}
                placeholder="Enfermedades hereditarias o relevantes en familiares..."
                helperText="Registra antecedentes presentes en padres, hermanos u otros familiares."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Quirúrgicos"
              icon={<Stethoscope size={18} />}
              iconClassName="bg-blue-100 text-blue-700"
            >
              <TextAreaField
                label="Antecedentes quirúrgicos"
                name="antecedentesQuirurgicos"
                value={form.antecedentesQuirurgicos}
                onChange={onChange}
                placeholder="Cirugías, procedimientos y fechas aproximadas..."
                helperText="Describe intervenciones previas y posibles complicaciones."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Alérgicos"
              icon={<AlertTriangle size={18} />}
              iconClassName="bg-red-100 text-red-700"
            >
              <TextAreaField
                label="Antecedentes alérgicos"
                name="antecedentesAlergicos"
                value={form.antecedentesAlergicos}
                onChange={onChange}
                placeholder="Medicamentos, alimentos, sustancias o niega alergias..."
                helperText="Especifica el agente y la reacción presentada."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Farmacológicos"
              icon={<Pill size={18} />}
              iconClassName="bg-emerald-100 text-emerald-700"
            >
              <TextAreaField
                label="Antecedentes farmacológicos"
                name="antecedentesFarmacologicos"
                value={form.antecedentesFarmacologicos}
                onChange={onChange}
                placeholder="Medicamentos actuales, dosis y frecuencia..."
                helperText="Incluye automedicación y tratamientos permanentes."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Resumen complementario"
              description="Campo conservado para reportes clínicos anteriores."
              icon={<NotebookPen size={18} />}
              iconClassName="bg-slate-200 text-slate-700"
            >
              <TextAreaField
                label="Antecedentes generales"
                name="antecedentes"
                value={form.antecedentes}
                onChange={onChange}
                placeholder="Información complementaria o antecedentes que no encajen en las categorías anteriores..."
                helperText="Puedes utilizarlo para conservar o ampliar información histórica."
                rows={6}
              />
            </ClinicalCard>
          </section>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 3"
          title="Signos vitales y valoración física"
          description="Registra las mediciones obtenidas durante la consulta y los hallazgos del examen físico."
          icon={<HeartPulse size={21} />}
          iconClassName="bg-red-50 text-red-700"
        />

        <section className="grid gap-6 p-5 sm:p-6">
          <ClinicalCard
            title="Signos vitales"
            description="Diligencia los valores medidos durante la valoración. El IMC se calcula automáticamente."
            icon={<Activity size={18} />}
            iconClassName="bg-red-100 text-red-700"
          >
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <InputField
                label="Presión arterial"
                name="presionArterial"
                value={form.presionArterial}
                onChange={onChange}
                placeholder="120/80"
                unit="mmHg"
                required
              />

              <InputField
                label="Frecuencia cardíaca"
                name="frecuenciaCardiaca"
                value={form.frecuenciaCardiaca}
                onChange={onChange}
                placeholder="80"
                unit="lpm"
                inputMode="numeric"
              />

              <InputField
                label="Frecuencia respiratoria"
                name="frecuenciaRespiratoria"
                value={form.frecuenciaRespiratoria}
                onChange={onChange}
                placeholder="18"
                unit="rpm"
                inputMode="numeric"
              />

              <InputField
                label="Temperatura"
                name="temperatura"
                value={form.temperatura}
                onChange={onChange}
                placeholder="36.5"
                unit="°C"
                inputMode="decimal"
              />

              <InputField
                label="Saturación de oxígeno"
                name="saturacionOxigeno"
                value={form.saturacionOxigeno}
                onChange={onChange}
                placeholder="98"
                unit="%"
                inputMode="numeric"
              />

              <InputField
                label="Peso"
                name="peso"
                value={form.peso}
                onChange={onChange}
                placeholder="65"
                unit="kg"
                inputMode="decimal"
              />

              <InputField
                label="Talla"
                name="talla"
                value={form.talla}
                onChange={onChange}
                placeholder="1.65"
                unit="m"
                inputMode="decimal"
                helperText="También puedes escribirla en centímetros."
              />

              <InputField
                label="Índice de masa corporal"
                name="imc"
                value={form.imc}
                onChange={onChange}
                placeholder="Automático"
                unit="kg/m²"
                readOnly
                helperText="Calculado a partir del peso y la talla."
              />
            </section>

            <section className="mt-6 border-t border-slate-200 pt-5">
              <TextAreaField
                label="Registro general de signos vitales"
                name="signosVitales"
                value={form.signosVitales}
                onChange={onChange}
                placeholder="Notas complementarias sobre los signos vitales, mediciones repetidas o condiciones de la toma..."
                helperText="Campo conservado para información adicional y reportes anteriores."
                rows={4}
              />
            </section>
          </ClinicalCard>

          <ClinicalCard
            title="Examen físico"
            description="Consigna los hallazgos positivos y negativos relevantes."
            icon={<Stethoscope size={18} />}
            iconClassName="bg-cyan-100 text-cyan-700"
          >
            <TextAreaField
              label="Hallazgos del examen físico"
              name="examenFisico"
              value={form.examenFisico}
              onChange={onChange}
              placeholder="Describe estado general, cabeza y cuello, sistema cardiopulmonar, abdomen, extremidades, sistema neurológico y otros hallazgos..."
              helperText="Organiza la descripción por sistemas cuando sea necesario."
              rows={9}
              required
            />
          </ClinicalCard>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 4"
          title="Diagnóstico"
          description="Registra la impresión clínica y el código diagnóstico cuando corresponda."
          icon={<Search size={21} />}
          iconClassName="bg-emerald-50 text-emerald-700"
        />

        <section className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1fr_280px]">
          <ClinicalCard
            title="Impresión diagnóstica"
            icon={<Search size={18} />}
            iconClassName="bg-emerald-100 text-emerald-700"
          >
            <TextAreaField
              label="Diagnóstico clínico"
              name="diagnostico"
              value={form.diagnostico}
              onChange={onChange}
              placeholder="Registra el diagnóstico principal y los diagnósticos relacionados..."
              helperText="Escribe la impresión diagnóstica de manera clara y completa."
              rows={7}
              required
            />
          </ClinicalCard>

          <ClinicalCard
            title="Clasificación"
            icon={<FileSearch size={18} />}
            iconClassName="bg-blue-100 text-blue-700"
          >
            <InputField
              label="Código CIE-10"
              name="codigoCie10"
              value={form.codigoCie10}
              onChange={onChange}
              placeholder="Ejemplo: J06.9"
              helperText="Utiliza el código correspondiente cuando esté disponible."
            />
          </ClinicalCard>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 5"
          title="Conducta y plan de manejo"
          description="Define el tratamiento, las recomendaciones, remisiones y observaciones finales de la atención."
          icon={<NotebookPen size={21} />}
          iconClassName="bg-blue-50 text-blue-700"
        />

        <section className="grid gap-6 p-5 sm:p-6">
          <section className="grid gap-6 xl:grid-cols-2">
            <ClinicalCard
              title="Tratamiento"
              icon={<Pill size={18} />}
              iconClassName="bg-blue-100 text-blue-700"
            >
              <TextAreaField
                label="Plan terapéutico"
                name="tratamiento"
                value={form.tratamiento}
                onChange={onChange}
                placeholder="Medicamentos, dosis, frecuencia, duración, procedimientos o manejo indicado..."
                helperText="Incluye el tratamiento formulado y las indicaciones principales."
                rows={7}
                required
              />
            </ClinicalCard>

            <ClinicalCard
              title="Recomendaciones"
              icon={<ShieldCheck size={18} />}
              iconClassName="bg-emerald-100 text-emerald-700"
            >
              <TextAreaField
                label="Indicaciones al paciente"
                name="recomendaciones"
                value={form.recomendaciones}
                onChange={onChange}
                placeholder="Cuidados en casa, signos de alarma, hábitos, controles o recomendaciones generales..."
                helperText="Especifica signos de alarma y acciones que debe seguir el paciente."
                rows={7}
              />
            </ClinicalCard>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <ClinicalCard
              title="Remisión o interconsulta"
              icon={<Stethoscope size={18} />}
              iconClassName="bg-violet-100 text-violet-700"
            >
              <TextAreaField
                label="Remisión"
                name="remision"
                value={form.remision}
                onChange={onChange}
                placeholder="Especialidad, servicio, prioridad y motivo de la remisión..."
                helperText="Indica 'No requiere' cuando no sea necesaria."
                rows={6}
              />
            </ClinicalCard>

            <ClinicalCard
              title="Observaciones finales"
              icon={<NotebookPen size={18} />}
              iconClassName="bg-slate-200 text-slate-700"
            >
              <TextAreaField
                label="Notas adicionales"
                name="observaciones"
                value={form.observaciones}
                onChange={onChange}
                placeholder="Información complementaria relevante para la atención..."
                helperText="Incluye aclaraciones clínicas o administrativas."
                rows={6}
              />
            </ClinicalCard>
          </section>
        </section>
      </article>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          step="Sección 6"
          title="Validación del profesional"
          description="Registra el nombre o identificación del profesional responsable de la historia clínica."
          icon={<UserRoundCheck size={21} />}
          iconClassName="bg-slate-100 text-slate-700"
        />

        <section className="p-5 sm:p-6">
          <ClinicalCard
            title="Firma o identificación del médico"
            description="Este dato aparecerá posteriormente en el documento PDF."
            icon={<UserRoundCheck size={18} />}
            iconClassName="bg-cyan-100 text-cyan-700"
          >
            <InputField
              label="Profesional responsable"
              name="firmaDoctor"
              value={form.firmaDoctor}
              onChange={onChange}
              placeholder="Ejemplo: Dra. María López — Medicina General"
              helperText="Puedes registrar el nombre completo, especialidad y número de registro profesional."
            />
          </ClinicalCard>
        </section>
      </article>
    </section>
  );
}