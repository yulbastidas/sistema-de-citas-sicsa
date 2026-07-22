"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  FileText,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type {
  AppointmentClassItem,
  AppointmentForm,
  EpsItem,
  SpecialtyItem,
} from "../types";

type PatientAppointmentFormProps = {
  form: AppointmentForm;
  specialties: SpecialtyItem[];
  epsList: EpsItem[];
  appointmentClasses: AppointmentClassItem[];
  loadingCatalogs: boolean;
  canCreateAppointment: boolean;
  saving: boolean;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onSubmit: () => void;
};

// Todo lo relacionado a los pasos es SOLO visual (agrupación de los mismos
// campos y handlers que ya existían). No se agrega, quita ni cambia
// ninguna validación, request ni estado del formulario real.
const STEPS = [
  { id: 1, label: "Especialidad", icon: Stethoscope },
  { id: 2, label: "EPS", icon: ShieldCheck },
  { id: 3, label: "Ubicación", icon: MapPin },
  { id: 4, label: "Detalles", icon: FileText },
] as const;

// ─────────────────────────────────────────────────────────────
// Información clínica (paso 4): síntomas principales + "ver más",
// dolor y tiempo de evolución. Es un módulo puramente visual/local:
// no crea campos nuevos en el formulario real ni toca el hook. Su
// resumen se inserta como texto dentro de "Observaciones", que ya
// existía y ya viaja con el resto de la lógica de creación.
// ─────────────────────────────────────────────────────────────
const PRIMARY_SYMPTOMS = [
  "Fiebre",
  "Tos",
  "Dolor de cabeza",
  "Dolor abdominal",
  "Náuseas o vómito",
  "Dificultad para respirar",
] as const;

const SECONDARY_SYMPTOMS = [
  "Dolor en el pecho",
  "Diarrea",
  "Mareo",
  "Dolor muscular",
  "Fatiga",
  "Erupciones en la piel",
  "Sangrado",
] as const;

const PAIN_LEVELS = ["Sin dolor", "Leve", "Moderado", "Fuerte"] as const;

const ONSET_OPTIONS = ["Hoy", "2–3 días", "1 semana o más"] as const;

// Peso de urgencia por síntoma (heurística simple, no es diagnóstico).
const SYMPTOM_WEIGHT: Record<string, number> = {
  "Dificultad para respirar": 3,
  "Dolor en el pecho": 3,
  Sangrado: 3,
  Fiebre: 1,
  Tos: 1,
  "Dolor de cabeza": 1,
  "Dolor abdominal": 1,
  "Náuseas o vómito": 1,
  Diarrea: 1,
  Mareo: 1,
  "Dolor muscular": 1,
  Fatiga: 1,
  "Erupciones en la piel": 1,
};

const PAIN_WEIGHT: Record<(typeof PAIN_LEVELS)[number], number> = {
  "Sin dolor": 0,
  Leve: 1,
  Moderado: 2,
  Fuerte: 3,
};

const ONSET_WEIGHT: Record<(typeof ONSET_OPTIONS)[number], number> = {
  Hoy: 1,
  "2–3 días": 1,
  "1 semana o más": 0,
};

type PriorityLevel = "baja" | "media" | "alta";

function calculatePriority(
  symptoms: string[],
  pain: string,
  onset: string,
): { level: PriorityLevel; label: string; note: string } {
  const symptomScore = symptoms
    .filter((s) => s !== "Ninguno")
    .reduce((total, s) => total + (SYMPTOM_WEIGHT[s] || 0), 0);
  const painScore = PAIN_WEIGHT[pain as (typeof PAIN_LEVELS)[number]] || 0;
  const onsetScore = ONSET_WEIGHT[onset as (typeof ONSET_OPTIONS)[number]] || 0;

  const total = symptomScore + painScore + onsetScore;

  if (total >= 5) {
    return {
      level: "alta",
      label: "Atención prioritaria",
      note: "Síntomas o dolor de mayor cuidado. Se recomienda valoración pronta.",
    };
  }
  if (total >= 2) {
    return {
      level: "media",
      label: "Prioridad media",
      note: "Se recomienda valoración por medicina general en las próximas horas.",
    };
  }
  return {
    level: "baja",
    label: "Baja prioridad",
    note: "Síntomas leves o sin reportar. Continúa con el registro normal.",
  };
}

const CLINICAL_BLOCK_START = "--- Información clínica (autogenerado) ---";
const CLINICAL_BLOCK_END = "--- fin información clínica ---";
const CLINICAL_BLOCK_REGEX = new RegExp(
  `${CLINICAL_BLOCK_START}[\\s\\S]*?${CLINICAL_BLOCK_END}\\n?`,
);

function buildClinicalBlock(
  symptoms: string[],
  pain: string,
  onset: string,
  priorityLabel: string,
): string {
  const symptomsText = symptoms.length === 0 ? "Ninguno reportado" : symptoms.join(", ");

  return [
    CLINICAL_BLOCK_START,
    `Síntomas: ${symptomsText}`,
    `Intensidad del dolor: ${pain || "No indicada"}`,
    `Inicio de síntomas: ${onset || "No indicado"}`,
    `Indicador estimado: ${priorityLabel}`,
    CLINICAL_BLOCK_END,
  ].join("\n");
}

const priorityStyles: Record<
  PriorityLevel,
  { border: string; bg: string; text: string }
> = {
  baja: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
  },
  media: {
    border: "border-amber-200",
    bg: "bg-amber-50",
    text: "text-amber-800",
  },
  alta: {
    border: "border-rose-200",
    bg: "bg-rose-50",
    text: "text-rose-800",
  },
};

export function PatientAppointmentForm({
  form,
  specialties,
  epsList,
  appointmentClasses,
  loadingCatalogs,
  canCreateAppointment,
  saving,
  onChange,
  onSubmit,
}: PatientAppointmentFormProps) {
  const [step, setStep] = useState(1);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [pain, setPain] = useState<string>("");
  const [onset, setOnset] = useState<string>("");
  const [showMoreSymptoms, setShowMoreSymptoms] = useState(false);

  const goNext = () => setStep((prev) => Math.min(prev + 1, STEPS.length));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const priority = useMemo(
    () => calculatePriority(symptoms, pain, onset),
    [symptoms, pain, onset],
  );

  // Inserta/actualiza el resumen clínico dentro de "observaciones" sin
  // tocar el hook: se sigue usando el mismo onChange y el mismo campo
  // que ya existía y que ya viaja con handleCreateAppointment.
  const syncClinicalSummary = (
    nextSymptoms: string[],
    nextPain: string,
    nextOnset: string,
  ) => {
    const hasAnySelection =
      nextSymptoms.length > 0 || !!nextPain || !!nextOnset;

    const cleanObservaciones = form.observaciones.replace(
      CLINICAL_BLOCK_REGEX,
      "",
    );

    const nextValue = hasAnySelection
      ? `${buildClinicalBlock(
          nextSymptoms,
          nextPain,
          nextOnset,
          calculatePriority(nextSymptoms, nextPain, nextOnset).label,
        )}\n${cleanObservaciones}`.trim()
      : cleanObservaciones.trim();

    onChange({
      target: { name: "observaciones", value: nextValue },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const toggleSymptom = (symptom: string) => {
    const next = symptoms.includes(symptom)
      ? symptoms.filter((s) => s !== symptom)
      : [...symptoms, symptom];
    setSymptoms(next);
    syncClinicalSummary(next, pain, onset);
  };

  const selectPain = (level: string) => {
    const next = pain === level ? "" : level;
    setPain(next);
    syncClinicalSummary(symptoms, next, onset);
  };

  const selectOnset = (option: string) => {
    const next = onset === option ? "" : option;
    setOnset(next);
    syncClinicalSummary(symptoms, pain, next);
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400";
  const readOnlyClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none";
  const labelClass = "mb-2 block text-sm font-medium text-slate-700";

  const symptomButtonClass = (checked: boolean) =>
    `flex items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3.5 text-sm font-medium transition ${
      checked
        ? "border-blue-500 bg-blue-50 text-blue-800"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
    } ${!canCreateAppointment ? "pointer-events-none opacity-50" : ""}`;

  const choiceButtonClass = (checked: boolean) =>
    `rounded-2xl border-2 px-4 py-2.5 text-sm font-medium transition ${
      checked
        ? "border-blue-500 bg-blue-50 text-blue-800"
        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
    } ${!canCreateAppointment ? "pointer-events-none opacity-50" : ""}`;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <ClipboardList className="text-blue-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Nueva cita</h2>
          <p className="mt-1 text-slate-600">
            Completa el registro siguiendo los cuatro pasos.
          </p>
        </section>
      </header>

      {!canCreateAppointment && (
        <section className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <section className="flex items-center gap-2">
            <ShieldAlert className="text-amber-700" size={18} />
            <p className="text-sm font-semibold text-amber-800">
              Agendamiento bloqueado
            </p>
          </section>
          <p className="mt-2 text-sm leading-6 text-amber-700">
            Debes tener la verificación aprobada para crear una nueva cita. Sí
            puedes consultar y cancelar tus citas existentes.
          </p>
        </section>
      )}

      {/* Progreso de pasos */}
      <nav className="mb-8 flex items-center justify-between">
        {STEPS.map((s, index) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isDone = step > s.id;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <button
                type="button"
                onClick={() => setStep(s.id)}
                className="flex flex-col items-center gap-2 focus:outline-none"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                    isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : isDone
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {isDone ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    isActive || isDone ? "text-blue-700" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </button>
              {index < STEPS.length - 1 && (
                <span
                  className={`mx-2 mb-6 h-[2px] flex-1 rounded ${
                    step > s.id ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </nav>

      <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
        Paso {step} de {STEPS.length}
      </p>

      {/* Paso 1: Especialidad y clase de cita */}
      {step === 1 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Especialidad y tipo de cita
          </h3>

          <article>
            <label className={labelClass}>Especialidad</label>
            <select
              name="specialtyId"
              value={form.specialtyId}
              onChange={onChange}
              disabled={!canCreateAppointment || loadingCatalogs}
              className={inputClass}
            >
              <option value="">
                {loadingCatalogs
                  ? "Cargando especialidades..."
                  : "Selecciona una especialidad"}
              </option>
              {specialties.map((specialty) => (
                <option key={specialty.id} value={specialty.id}>
                  {specialty.nombre || `Especialidad ${specialty.id}`}
                </option>
              ))}
            </select>
          </article>

          <article>
            <label className={labelClass}>Clase de cita</label>
            <select
              name="appointmentClassId"
              value={form.appointmentClassId}
              onChange={onChange}
              disabled={!canCreateAppointment || loadingCatalogs}
              className={inputClass}
            >
              <option value="">
                {loadingCatalogs
                  ? "Cargando clases..."
                  : "Selecciona clase de cita"}
              </option>
              {appointmentClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre || `Clase ${item.id}`}
                </option>
              ))}
            </select>
          </article>

          <section className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <Sparkles className="mt-0.5 shrink-0 text-blue-700" size={18} />
            <p className="text-sm leading-6 text-blue-800">
              Elige la especialidad y el tipo de cita antes de continuar con
              tu EPS.
            </p>
          </section>
        </section>
      )}

      {/* Paso 2: EPS */}
      {step === 2 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Entidad de salud
          </h3>

          <section className="grid gap-4 md:grid-cols-2">
            <article>
              <label className={labelClass}>EPS</label>
              <select
                name="epsId"
                value={form.epsId}
                onChange={onChange}
                disabled={!canCreateAppointment || loadingCatalogs}
                className={inputClass}
              >
                <option value="">
                  {loadingCatalogs ? "Cargando EPS..." : "Selecciona EPS"}
                </option>
                {epsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre || `EPS ${item.id}`}
                  </option>
                ))}
              </select>
            </article>

            <article>
              <label className={labelClass}>EPS seleccionada</label>
              <input
                value={form.eps}
                readOnly
                placeholder="EPS seleccionada"
                className={readOnlyClass}
              />
            </article>
          </section>

          <section className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-blue-700" size={18} />
            <p className="text-sm leading-6 text-blue-800">
              Verifica que la EPS seleccionada corresponda a tu afiliación
              actual.
            </p>
          </section>
        </section>
      )}

      {/* Paso 3: Ubicación */}
      {step === 3 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Ubicación</h3>

          <section className="grid gap-4 md:grid-cols-2">
            <article>
              <label className={labelClass}>Departamento</label>
              <input
                name="departamento"
                value={form.departamento}
                readOnly
                placeholder="Departamento detectado"
                className={readOnlyClass}
              />
            </article>

            <article>
              <label className={labelClass}>Municipio</label>
              <input
                name="municipio"
                value={form.municipio}
                readOnly
                placeholder="Municipio detectado"
                className={readOnlyClass}
              />
            </article>
          </section>

          <section className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <MapPin className="mt-0.5 shrink-0 text-blue-700" size={18} />
            <p className="text-sm leading-6 text-blue-800">
              Estos datos vienen de tu verificación aprobada y no se pueden
              editar aquí.
            </p>
          </section>
        </section>
      )}

      {/* Paso 4: Información clínica + motivo + observaciones */}
      {step === 4 && (
        <section className="space-y-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Información clínica
          </h3>

          <article>
            <label className={labelClass}>Motivo de consulta</label>
            <textarea
              name="motivoConsulta"
              value={form.motivoConsulta}
              onChange={onChange}
              rows={3}
              placeholder="¿Cuál es el motivo principal de tu consulta?"
              disabled={!canCreateAppointment}
              className={inputClass}
            />
          </article>

          <article>
            <p className={labelClass}>¿Presenta alguno de estos síntomas?</p>
            <section className="grid grid-cols-2 gap-2.5">
              {PRIMARY_SYMPTOMS.map((symptom) => {
                const checked = symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    disabled={!canCreateAppointment}
                    className={symptomButtonClass(checked)}
                  >
                    <span>{symptom}</span>
                    {checked && (
                      <CheckCircle2
                        size={16}
                        className="shrink-0 text-blue-600"
                      />
                    )}
                  </button>
                );
              })}
            </section>

            <button
              type="button"
              onClick={() => setShowMoreSymptoms((prev) => !prev)}
              className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
            >
              {showMoreSymptoms ? (
                <>
                  Ver menos síntomas
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Ver más síntomas
                  <ChevronDown size={16} />
                </>
              )}
            </button>

            {showMoreSymptoms && (
              <section className="mt-3 grid grid-cols-2 gap-2.5">
                {SECONDARY_SYMPTOMS.map((symptom) => {
                  const checked = symptoms.includes(symptom);
                  return (
                    <button
                      key={symptom}
                      type="button"
                      onClick={() => toggleSymptom(symptom)}
                      disabled={!canCreateAppointment}
                      className={symptomButtonClass(checked)}
                    >
                      <span>{symptom}</span>
                      {checked && (
                        <CheckCircle2
                          size={16}
                          className="shrink-0 text-blue-600"
                        />
                      )}
                    </button>
                  );
                })}
              </section>
            )}
          </article>

          <article>
            <p className={labelClass}>Intensidad del dolor</p>
            <section className="flex flex-wrap gap-2">
              {PAIN_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => selectPain(level)}
                  disabled={!canCreateAppointment}
                  className={choiceButtonClass(pain === level)}
                >
                  {level}
                </button>
              ))}
            </section>
          </article>

          <article>
            <p className={labelClass}>¿Hace cuánto comenzaron los síntomas?</p>
            <section className="flex flex-wrap gap-2">
              {ONSET_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => selectOnset(option)}
                  disabled={!canCreateAppointment}
                  className={choiceButtonClass(onset === option)}
                >
                  {option}
                </button>
              ))}
            </section>
          </article>

          {(symptoms.length > 0 || pain || onset) && (
            <section
              className={`flex items-start gap-3 rounded-3xl border p-4 ${priorityStyles[priority.level].border} ${priorityStyles[priority.level].bg}`}
            >
              {priority.level === "alta" ? (
                <AlertTriangle
                  className={`mt-0.5 shrink-0 ${priorityStyles[priority.level].text}`}
                  size={18}
                />
              ) : (
                <Activity
                  className={`mt-0.5 shrink-0 ${priorityStyles[priority.level].text}`}
                  size={18}
                />
              )}
              <section>
                <p className={`text-sm font-semibold ${priorityStyles[priority.level].text}`}>
                  {priority.label}
                </p>
                <p className={`mt-1 text-sm leading-6 ${priorityStyles[priority.level].text}`}>
                  {priority.note}
                </p>
                <p className="mt-2 text-xs italic text-slate-500">
                  Estimado automáticamente a partir de tus respuestas. No
                  reemplaza la valoración de un profesional de salud.
                </p>
              </section>
            </section>
          )}

          <article>
            <label className={labelClass}>Observaciones adicionales</label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              rows={3}
              placeholder="Observaciones adicionales"
              disabled={!canCreateAppointment}
              className={inputClass}
            />
            <p className="mt-2 text-xs text-slate-400">
              Los síntomas, el dolor y el tiempo de evolución que marcaste
              arriba se agregan automáticamente al inicio de este campo.
            </p>
          </article>
        </section>
      )}

      {/* Navegación */}
      <section className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 1}
          className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Atrás
        </button>

        {step < STEPS.length ? (
          <button
            type="button"
            onClick={goNext}
            className="flex items-center gap-1 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={saving || !canCreateAppointment}
            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Crear cita"}
          </button>
        )}
      </section>
    </section>
  );
}