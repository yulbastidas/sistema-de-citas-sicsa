"use client";

import { useEffect, useMemo, useState } from "react";
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

const STEPS = [
  { id: 1, label: "Especialidad", icon: Stethoscope },
  { id: 2, label: "EPS", icon: ShieldCheck },
  { id: 3, label: "Ubicación", icon: MapPin },
  { id: 4, label: "Detalles", icon: FileText },
] as const;

const PAIN_LEVELS = ["Sin dolor", "Leve", "Moderado", "Fuerte"] as const;

const ONSET_OPTIONS = [
  "Hoy",
  "2–3 días",
  "Menos de una semana",
  "1 semana o más",
] as const;

type ClinicalType =
  | "general"
  | "dental"
  | "oral-hygiene"
  | "gynecology"
  | "pediatrics"
  | "mental-health"
  | "generic";

type ClinicalConfig = {
  type: ClinicalType;
  title: string;
  description: string;
  question: string;
  primaryOptions: readonly string[];
  secondaryOptions: readonly string[];
  showPain: boolean;
  showOnset: boolean;
  showPriorityPreview: boolean;
};

const GENERAL_CONFIG: ClinicalConfig = {
  type: "general",
  title: "Información sobre tus síntomas",
  description:
    "Selecciona únicamente los síntomas que presentas actualmente.",
  question: "¿Presentas alguno de estos síntomas?",
  primaryOptions: [
    "Fiebre",
    "Tos",
    "Dolor de cabeza",
    "Dolor abdominal",
    "Náuseas o vómito",
    "Dificultad para respirar",
  ],
  secondaryOptions: [
    "Dolor en el pecho",
    "Diarrea",
    "Mareo",
    "Dolor muscular",
    "Fatiga",
    "Erupciones en la piel",
    "Sangrado",
  ],
  showPain: true,
  showOnset: true,
  showPriorityPreview: true,
};

const DENTAL_CONFIG: ClinicalConfig = {
  type: "dental",
  title: "Información odontológica",
  description:
    "Indica el motivo principal para orientar correctamente la atención.",
  question: "¿Cuál es el motivo de la cita?",
  primaryOptions: [
    "Limpieza dental",
    "Control odontológico",
    "Dolor dental",
    "Caries",
    "Diente fracturado",
    "Inflamación de encía",
  ],
  secondaryOptions: [
    "Sangrado de encías",
    "Extracción dental",
    "Tratamiento pendiente",
    "Golpe o trauma dental",
    "Inflamación facial",
    "Dificultad para abrir la boca",
    "Otro motivo odontológico",
  ],
  showPain: true,
  showOnset: true,
  showPriorityPreview: true,
};

const ORAL_HYGIENE_CONFIG: ClinicalConfig = {
  type: "oral-hygiene",
  title: "Motivo de atención en higiene oral",
  description:
    "Selecciona el servicio o motivo relacionado con tu cuidado oral.",
  question: "¿Qué atención necesitas?",
  primaryOptions: [
    "Limpieza oral",
    "Control de higiene oral",
    "Aplicación de flúor",
    "Revisión de encías",
    "Educación en higiene oral",
    "Control de placa",
  ],
  secondaryOptions: [
    "Sangrado de encías",
    "Mal aliento persistente",
    "Sensibilidad dental",
    "Otro motivo",
  ],
  showPain: false,
  showOnset: false,
  showPriorityPreview: false,
};

const GYNECOLOGY_CONFIG: ClinicalConfig = {
  type: "gynecology",
  title: "Información para la consulta",
  description:
    "Selecciona el motivo relacionado con tu atención ginecológica.",
  question: "¿Cuál es el motivo principal?",
  primaryOptions: [
    "Control ginecológico",
    "Dolor pélvico",
    "Sangrado anormal",
    "Flujo o molestias",
    "Planificación familiar",
    "Control de embarazo",
  ],
  secondaryOptions: [
    "Resultado de examen",
    "Irregularidad menstrual",
    "Dolor intenso",
    "Fiebre",
    "Otro motivo",
  ],
  showPain: true,
  showOnset: true,
  showPriorityPreview: true,
};

const PEDIATRICS_CONFIG: ClinicalConfig = {
  type: "pediatrics",
  title: "Información sobre el menor",
  description:
    "Selecciona el motivo principal de la consulta pediátrica.",
  question: "¿Cuál es el motivo de la consulta?",
  primaryOptions: [
    "Control de crecimiento",
    "Fiebre",
    "Tos",
    "Dolor",
    "Náuseas o vómito",
    "Problemas digestivos",
  ],
  secondaryOptions: [
    "Diarrea",
    "Erupción en la piel",
    "Dificultad para respirar",
    "Falta de apetito",
    "Fatiga",
    "Otro motivo",
  ],
  showPain: true,
  showOnset: true,
  showPriorityPreview: true,
};

const MENTAL_HEALTH_CONFIG: ClinicalConfig = {
  type: "mental-health",
  title: "Motivo de atención",
  description:
    "Selecciona el motivo general. No necesitas indicar un diagnóstico.",
  question: "¿Cuál es el motivo principal?",
  primaryOptions: [
    "Primera valoración",
    "Control",
    "Ansiedad",
    "Cambios de ánimo",
    "Problemas de sueño",
    "Seguimiento de tratamiento",
  ],
  secondaryOptions: [
    "Crisis emocional",
    "Dificultad para concentrarse",
    "Estrés",
    "Otro motivo",
  ],
  showPain: false,
  showOnset: true,
  showPriorityPreview: false,
};

const GENERIC_CONFIG: ClinicalConfig = {
  type: "generic",
  title: "Información de la consulta",
  description:
    "Describe brevemente el motivo para orientar la atención solicitada.",
  question: "Puedes seleccionar una opción relacionada",
  primaryOptions: [
    "Primera valoración",
    "Control",
    "Seguimiento de tratamiento",
    "Resultado de examen",
    "Procedimiento programado",
    "Otro motivo",
  ],
  secondaryOptions: [],
  showPain: false,
  showOnset: true,
  showPriorityPreview: false,
};

const CLINICAL_BLOCK_START =
  "--- Información clínica (autogenerado) ---";
const CLINICAL_BLOCK_END = "--- fin información clínica ---";

const CLINICAL_BLOCK_REGEX = new RegExp(
  `${CLINICAL_BLOCK_START}[\\s\\S]*?${CLINICAL_BLOCK_END}\\n?`,
);

type PriorityLevel = "baja" | "media" | "alta";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getClinicalConfig(
  specialtyId: string,
  specialties: SpecialtyItem[],
): ClinicalConfig {
  const selectedSpecialty = specialties.find(
    (specialty) => String(specialty.id) === specialtyId,
  );

  const specialtyName = normalizeText(selectedSpecialty?.nombre || "");

  if (
    specialtyId === "13" ||
    specialtyName.includes("medico general") ||
    specialtyName.includes("medicina general")
  ) {
    return GENERAL_CONFIG;
  }

  if (
    specialtyId === "15" ||
    specialtyName.includes("odontolog")
  ) {
    return DENTAL_CONFIG;
  }

  if (
    specialtyId === "9" ||
    specialtyName.includes("higienista") ||
    specialtyName.includes("higiene oral")
  ) {
    return ORAL_HYGIENE_CONFIG;
  }

  if (
    specialtyName.includes("ginecolog") ||
    specialtyName.includes("obstetric")
  ) {
    return GYNECOLOGY_CONFIG;
  }

  if (specialtyName.includes("pediatr")) {
    return PEDIATRICS_CONFIG;
  }

  if (
    specialtyName.includes("psicolog") ||
    specialtyName.includes("psiquiatr")
  ) {
    return MENTAL_HEALTH_CONFIG;
  }

  return GENERIC_CONFIG;
}

const GENERAL_CRITICAL_OPTIONS = [
  "Dificultad para respirar",
  "Dolor en el pecho",
  "Sangrado",
];

const DENTAL_CRITICAL_OPTIONS = [
  "Inflamación facial",
  "Dificultad para abrir la boca",
  "Golpe o trauma dental",
];

function calculatePriority(
  clinicalType: ClinicalType,
  selectedOptions: string[],
  pain: string,
  onset: string,
): {
  level: PriorityLevel;
  label: string;
  note: string;
} {
  let score = 0;

  if (clinicalType === "general" || clinicalType === "pediatrics") {
    selectedOptions.forEach((option) => {
      score += GENERAL_CRITICAL_OPTIONS.includes(option) ? 4 : 1;
    });
  } else if (
    clinicalType === "dental" ||
    clinicalType === "gynecology"
  ) {
    selectedOptions.forEach((option) => {
      score += DENTAL_CRITICAL_OPTIONS.includes(option) ? 3 : 1;
    });
  } else {
    selectedOptions.forEach(() => {
      score += 1;
    });
  }

  if (pain === "Leve") score += 1;
  if (pain === "Moderado") score += 2;
  if (pain === "Fuerte") score += 4;

  if (onset === "Hoy") score += 1;
  if (onset === "2–3 días") score += 1;

  if (score >= 7) {
    return {
      level: "alta",
      label: "Requiere revisión prioritaria",
      note:
        "Las respuestas contienen factores que deben ser revisados por el personal encargado.",
    };
  }

  if (score >= 3) {
    return {
      level: "media",
      label: "Prioridad preliminar media",
      note:
        "La información será analizada por el sistema de priorización.",
    };
  }

  return {
    level: "baja",
    label: "Registro normal",
    note:
      "No se identificaron factores preliminares de alta prioridad.",
  };
}

function buildClinicalBlock(
  specialtyName: string,
  clinicalTitle: string,
  selectedOptions: string[],
  pain: string,
  onset: string,
): string {
  const optionsText =
    selectedOptions.length === 0
      ? "Ninguno seleccionado"
      : selectedOptions.join(", ");

  return [
    CLINICAL_BLOCK_START,
    `Especialidad: ${specialtyName || "No indicada"}`,
    `Tipo de información: ${clinicalTitle}`,
    `Motivos o síntomas seleccionados: ${optionsText}`,
    `Intensidad del dolor: ${pain || "No indicada"}`,
    `Inicio o tiempo de evolución: ${onset || "No indicado"}`,
    CLINICAL_BLOCK_END,
  ].join("\n");
}

const priorityStyles: Record<
  PriorityLevel,
  {
    border: string;
    bg: string;
    text: string;
  }
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
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [pain, setPain] = useState("");
  const [onset, setOnset] = useState("");
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  const selectedSpecialty = useMemo(
    () =>
      specialties.find(
        (specialty) =>
          String(specialty.id) === String(form.specialtyId),
      ),
    [specialties, form.specialtyId],
  );

  const clinicalConfig = useMemo(
    () => getClinicalConfig(form.specialtyId, specialties),
    [form.specialtyId, specialties],
  );

  const priority = useMemo(
    () =>
      calculatePriority(
        clinicalConfig.type,
        selectedOptions,
        pain,
        onset,
      ),
    [clinicalConfig.type, selectedOptions, pain, onset],
  );

  useEffect(() => {
    setSelectedOptions([]);
    setPain("");
    setOnset("");
    setShowMoreOptions(false);

    const cleanObservaciones = form.observaciones
      .replace(CLINICAL_BLOCK_REGEX, "")
      .trim();

    if (cleanObservaciones !== form.observaciones) {
      onChange({
        target: {
          name: "observaciones",
          value: cleanObservaciones,
        },
      } as React.ChangeEvent<HTMLTextAreaElement>);
    }

    // Se limpia la información clínica cuando cambia la especialidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.specialtyId]);

  const goNext = () => {
    setStep((previous) =>
      Math.min(previous + 1, STEPS.length),
    );
  };

  const goBack = () => {
    setStep((previous) => Math.max(previous - 1, 1));
  };

  const syncClinicalSummary = (
    nextOptions: string[],
    nextPain: string,
    nextOnset: string,
  ) => {
    const hasClinicalInformation =
      nextOptions.length > 0 || Boolean(nextPain) || Boolean(nextOnset);

    const cleanObservaciones = form.observaciones
      .replace(CLINICAL_BLOCK_REGEX, "")
      .trim();

    const clinicalBlock = buildClinicalBlock(
      selectedSpecialty?.nombre || "",
      clinicalConfig.title,
      nextOptions,
      nextPain,
      nextOnset,
    );

    const nextValue = hasClinicalInformation
      ? `${clinicalBlock}\n${cleanObservaciones}`.trim()
      : cleanObservaciones;

    onChange({
      target: {
        name: "observaciones",
        value: nextValue,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const toggleOption = (option: string) => {
    const nextOptions = selectedOptions.includes(option)
      ? selectedOptions.filter((item) => item !== option)
      : [...selectedOptions, option];

    setSelectedOptions(nextOptions);
    syncClinicalSummary(nextOptions, pain, onset);
  };

  const selectPain = (level: string) => {
    const nextPain = pain === level ? "" : level;

    setPain(nextPain);
    syncClinicalSummary(selectedOptions, nextPain, onset);
  };

  const selectOnset = (option: string) => {
    const nextOnset = onset === option ? "" : option;

    setOnset(nextOnset);
    syncClinicalSummary(selectedOptions, pain, nextOnset);
  };

  const inputClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400";

  const readOnlyClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  const optionButtonClass = (checked: boolean) =>
    `flex min-h-12 items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-sm font-medium transition ${checked
      ? "border-blue-500 bg-blue-50 text-blue-800 shadow-sm"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40"
    } ${!canCreateAppointment
      ? "pointer-events-none opacity-50"
      : ""
    }`;

  const choiceButtonClass = (checked: boolean) =>
    `rounded-2xl border-2 px-4 py-2.5 text-sm font-medium transition ${checked
      ? "border-blue-500 bg-blue-50 text-blue-800"
      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200"
    } ${!canCreateAppointment
      ? "pointer-events-none opacity-50"
      : ""
    }`;

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
          <ClipboardList className="text-blue-700" size={22} />
        </span>

        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Nueva cita
          </h2>

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
            Debes tener la verificación aprobada para crear una nueva
            cita. Sí puedes consultar y cancelar tus citas existentes.
          </p>
        </section>
      )}

      <nav className="mb-8 flex items-center justify-between">
        {STEPS.map((currentStep, index) => {
          const Icon = currentStep.icon;
          const isActive = step === currentStep.id;
          const isDone = step > currentStep.id;

          return (
            <div
              key={currentStep.id}
              className="flex flex-1 items-center"
            >
              <button
                type="button"
                onClick={() => setStep(currentStep.id)}
                className="flex flex-col items-center gap-2 focus:outline-none"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-bold transition ${isActive
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                      : isDone
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-400"
                    }`}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Icon size={16} />
                  )}
                </span>

                <span
                  className={`text-xs font-semibold ${isActive || isDone
                      ? "text-blue-700"
                      : "text-slate-400"
                    }`}
                >
                  {currentStep.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <span
                  className={`mx-2 mb-6 h-[2px] flex-1 rounded ${step > currentStep.id
                      ? "bg-blue-600"
                      : "bg-slate-200"
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
                  {specialty.nombre ||
                    `Especialidad ${specialty.id}`}
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
            <Sparkles
              className="mt-0.5 shrink-0 text-blue-700"
              size={18}
            />

            <p className="text-sm leading-6 text-blue-800">
              El formulario final cambiará según la especialidad
              seleccionada.
            </p>
          </section>
        </section>
      )}

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
                  {loadingCatalogs
                    ? "Cargando EPS..."
                    : "Selecciona EPS"}
                </option>

                {epsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre || `EPS ${item.id}`}
                  </option>
                ))}
              </select>
            </article>

            <article>
              <label className={labelClass}>
                EPS seleccionada
              </label>

              <input
                value={form.eps}
                readOnly
                placeholder="EPS seleccionada"
                className={readOnlyClass}
              />
            </article>
          </section>

          <section className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-blue-700"
              size={18}
            />

            <p className="text-sm leading-6 text-blue-800">
              Verifica que la EPS seleccionada corresponda a tu
              afiliación actual.
            </p>
          </section>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Ubicación
          </h3>

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
            <MapPin
              className="mt-0.5 shrink-0 text-blue-700"
              size={18}
            />

            <p className="text-sm leading-6 text-blue-800">
              Estos datos vienen de tu verificación aprobada y no se
              pueden editar aquí.
            </p>
          </section>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-6">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">
              {clinicalConfig.title}
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              {clinicalConfig.description}
            </p>
          </header>

          <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Especialidad seleccionada
            </p>

            <p className="mt-1 font-semibold text-blue-900">
              {selectedSpecialty?.nombre || "Sin especialidad"}
            </p>
          </section>

          <article>
            <label className={labelClass}>
              Cuéntanos brevemente qué necesitas
            </label>

            <textarea
              name="motivoConsulta"
              value={form.motivoConsulta}
              onChange={onChange}
              rows={4}
              placeholder={
                clinicalConfig.type === "dental"
                  ? "Ejemplo: Tengo dolor fuerte en una muela desde hace dos días."
                  : clinicalConfig.type === "oral-hygiene"
                    ? "Ejemplo: Solicito una limpieza y control de higiene oral."
                    : "Describe brevemente el motivo principal de la consulta."
              }
              disabled={!canCreateAppointment}
              className={inputClass}
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              No necesitas indicar un diagnóstico. Describe lo que
              sientes o el servicio que necesitas.
            </p>
          </article>

          <article>
            <p className={labelClass}>
              {clinicalConfig.question}
            </p>

            <section className="grid gap-2.5 sm:grid-cols-2">
              {clinicalConfig.primaryOptions.map((option) => {
                const checked = selectedOptions.includes(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => toggleOption(option)}
                    disabled={!canCreateAppointment}
                    className={optionButtonClass(checked)}
                  >
                    <span>{option}</span>

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

            {clinicalConfig.secondaryOptions.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setShowMoreOptions((previous) => !previous)
                  }
                  className="mt-3 flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800"
                >
                  {showMoreOptions ? (
                    <>
                      Ver menos opciones
                      <ChevronUp size={16} />
                    </>
                  ) : (
                    <>
                      Ver más opciones
                      <ChevronDown size={16} />
                    </>
                  )}
                </button>

                {showMoreOptions && (
                  <section className="mt-3 grid gap-2.5 sm:grid-cols-2">
                    {clinicalConfig.secondaryOptions.map(
                      (option) => {
                        const checked =
                          selectedOptions.includes(option);

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleOption(option)}
                            disabled={!canCreateAppointment}
                            className={optionButtonClass(checked)}
                          >
                            <span>{option}</span>

                            {checked && (
                              <CheckCircle2
                                size={16}
                                className="shrink-0 text-blue-600"
                              />
                            )}
                          </button>
                        );
                      },
                    )}
                  </section>
                )}
              </>
            )}
          </article>

          {clinicalConfig.showPain && (
            <article>
              <p className={labelClass}>
                Intensidad del dolor o molestia
              </p>

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
          )}

          {clinicalConfig.showOnset && (
            <article>
              <p className={labelClass}>
                ¿Hace cuánto comenzó o necesitas esta atención?
              </p>

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
          )}

          {clinicalConfig.showPriorityPreview &&
            (selectedOptions.length > 0 || pain || onset) && (
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
                  <p
                    className={`text-sm font-semibold ${priorityStyles[priority.level].text}`}
                  >
                    {priority.label}
                  </p>

                  <p
                    className={`mt-1 text-sm leading-6 ${priorityStyles[priority.level].text}`}
                  >
                    {priority.note}
                  </p>

                  <p className="mt-2 text-xs italic text-slate-500">
                    Esta es una orientación preliminar. La prioridad
                    definitiva será calculada y revisada al registrar
                    la cita.
                  </p>
                </section>
              </section>
            )}

          <article>
            <label className={labelClass}>
              Observaciones adicionales
            </label>

            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={onChange}
              rows={3}
              placeholder="Agrega información adicional únicamente si es necesario."
              disabled={!canCreateAppointment}
              className={inputClass}
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Las opciones seleccionadas se agregan automáticamente a
              la información enviada con la cita.
            </p>
          </article>
        </section>
      )}

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
            type="button"
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