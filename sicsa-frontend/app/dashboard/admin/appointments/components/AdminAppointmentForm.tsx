"use client";

import { useState } from "react";
import {
  Accessibility,
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  Droplets,
  FilePlus2,
  Flame,
  HeartPulse,
  MapPin,
  Send,
  ShieldAlert,
  Stethoscope,
  UserRound,
} from "lucide-react";

import type {
  AdminAppointmentForm,
  AppointmentClassItem,
  EpsItem,
  SpecialtyItem,
} from "../types";

type AdminAppointmentFormProps = {
  form: AdminAppointmentForm;
  specialties: SpecialtyItem[];
  epsList: EpsItem[];
  appointmentClasses: AppointmentClassItem[];
  availableHours: string[];
  loadingCatalogs: boolean;
  loadingHours: boolean;
  saving: boolean;
  today: string;
  onTextChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
};

type StepNumber = 1 | 2 | 3 | 4;

type StepItem = {
  number: StepNumber;
  title: string;
  shortTitle: string;
};

const steps: StepItem[] = [
  {
    number: 1,
    title: "Información del paciente",
    shortTitle: "Paciente",
  },
  {
    number: 2,
    title: "Programación de la cita",
    shortTitle: "Cita",
  },
  {
    number: 3,
    title: "Información clínica",
    shortTitle: "Clínica",
  },
  {
    number: 4,
    title: "Prioridad y confirmación",
    shortTitle: "Prioridad",
  },
];

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

const labelClassName =
  "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600";

export function AdminAppointmentFormPanel({
  form,
  specialties,
  epsList,
  appointmentClasses,
  availableHours,
  loadingCatalogs,
  loadingHours,
  saving,
  today,
  onTextChange,
  onCheckboxChange,
  onSubmit,
}: AdminAppointmentFormProps) {
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  const currentStepData = steps.find((step) => step.number === currentStep);
const goToNextStep = () => {
  setCurrentStep((previousStep) => {
    return Math.min(previousStep + 1, 4) as StepNumber;
  });
};

const goToPreviousStep = () => {
  setCurrentStep((previousStep) => {
    return Math.max(previousStep - 1, 1) as StepNumber;
  });
};

const goToStep = (step: StepNumber) => {
  setCurrentStep(step);
};

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {/* Encabezado */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-5 py-5 sm:px-6">
        <section className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
            <FilePlus2 size={22} />
          </span>

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Registro manual de cita
            </h2>

            <p className="mt-1 text-sm leading-5 text-slate-600">
              Completa el registro siguiendo los cuatro pasos.
            </p>
          </section>
        </section>
      </header>

      {/* Indicador de pasos */}
      <section className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <section className="grid grid-cols-4 gap-1 sm:gap-2">
          {steps.map((step, index) => {
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;

            return (
              <button
                key={step.number}
                type="button"
                onClick={() => goToStep(step.number)}
                className="group relative flex min-w-0 flex-col items-center"
              >
                <section className="flex w-full items-center">
                  {index > 0 && (
                    <span
                      className={`h-0.5 flex-1 transition ${
                        currentStep >= step.number
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                    />
                  )}

                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition sm:h-9 sm:w-9 ${
                      isActive
                        ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200"
                        : isCompleted
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check size={16} /> : step.number}
                  </span>

                  {index < steps.length - 1 && (
                    <span
                      className={`h-0.5 flex-1 transition ${
                        currentStep > step.number
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                    />
                  )}
                </section>

                <span
                  className={`mt-2 hidden truncate text-center text-xs font-semibold sm:block ${
                    isActive || isCompleted
                      ? "text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  {step.shortTitle}
                </span>

                <span
                  className={`mt-1 text-[10px] font-bold sm:hidden ${
                    isActive || isCompleted
                      ? "text-blue-700"
                      : "text-slate-500"
                  }`}
                >
                  Paso {step.number}
                </span>
              </button>
            );
          })}
        </section>
      </section>

      {/* Contenido del paso */}
      <section className="p-5 sm:p-6">
        <header className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
            Paso {currentStep} de 4
          </p>

          <h3 className="mt-1 text-lg font-bold text-slate-900">
            {currentStepData?.title}
          </h3>
        </header>

        {/* Paso 1: información del paciente */}
        {currentStep === 1 && (
          <section className="space-y-4">
            <article>
              <label htmlFor="documento" className={labelClassName}>
                Documento del paciente
              </label>

              <section className="relative">
                <UserRound
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={17}
                />

                <input
                  id="documento"
                  name="documento"
                  value={form.documento}
                  onChange={onTextChange}
                  placeholder="Número de documento"
                  className={`${inputClassName} pl-10`}
                />
              </section>
            </article>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label htmlFor="epsId" className={labelClassName}>
                  EPS
                </label>

                <select
                  id="epsId"
                  name="epsId"
                  value={form.epsId}
                  onChange={onTextChange}
                  disabled={loadingCatalogs}
                  className={inputClassName}
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
                <label htmlFor="epsSeleccionada" className={labelClassName}>
                  EPS seleccionada
                </label>

                <input
                  id="epsSeleccionada"
                  value={form.eps}
                  readOnly
                  placeholder="EPS seleccionada"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-600 outline-none"
                />
              </article>
            </section>

            <article>
              <label htmlFor="edad" className={labelClassName}>
                Edad
              </label>

              <input
                id="edad"
                type="number"
                name="edad"
                value={form.edad}
                onChange={onTextChange}
                placeholder="Edad del paciente"
                className={inputClassName}
              />
            </article>

            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <section className="flex items-start gap-3">
                <UserRound
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <section>
                  <p className="text-sm font-bold text-blue-900">
                    Datos del paciente
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Registra el documento, la entidad de salud y la edad antes
                    de continuar con la programación.
                  </p>
                </section>
              </section>
            </article>
          </section>
        )}

        {/* Paso 2: programación */}
        {currentStep === 2 && (
          <section className="space-y-4">
            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label htmlFor="specialtyId" className={labelClassName}>
                  Especialidad
                </label>

                <select
                  id="specialtyId"
                  name="specialtyId"
                  value={form.specialtyId}
                  onChange={onTextChange}
                  disabled={loadingCatalogs}
                  className={inputClassName}
                >
                  <option value="">
                    {loadingCatalogs
                      ? "Cargando especialidades..."
                      : "Selecciona especialidad"}
                  </option>

                  {specialties.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre || `Especialidad ${item.id}`}
                    </option>
                  ))}
                </select>
              </article>

              <article>
                <label
                  htmlFor="appointmentClassId"
                  className={labelClassName}
                >
                  Clase de cita
                </label>

                <select
                  id="appointmentClassId"
                  name="appointmentClassId"
                  value={form.appointmentClassId}
                  onChange={onTextChange}
                  disabled={loadingCatalogs}
                  className={inputClassName}
                >
                  <option value="">
                    {loadingCatalogs
                      ? "Cargando clases..."
                      : "Selecciona clase"}
                  </option>

                  {appointmentClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre || `Clase ${item.id}`}
                    </option>
                  ))}
                </select>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label htmlFor="fecha" className={labelClassName}>
                  Fecha
                </label>

                <section className="relative">
                  <CalendarDays
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <input
                    id="fecha"
                    type="date"
                    name="fecha"
                    min={today}
                    value={form.fecha}
                    onChange={onTextChange}
                    className={`${inputClassName} pl-10`}
                  />
                </section>
              </article>

              <article>
                <label htmlFor="hora" className={labelClassName}>
                  Hora disponible
                </label>

                <section className="relative">
                  <Clock3
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <select
                    id="hora"
                    name="hora"
                    value={form.hora}
                    onChange={onTextChange}
                    disabled={!form.fecha || loadingHours}
                    className={`${inputClassName} pl-10`}
                  >
                    <option value="">
                      {loadingHours
                        ? "Cargando horarios..."
                        : "Selecciona una hora"}
                    </option>

                    {availableHours.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </section>
              </article>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              <article>
                <label htmlFor="departamento" className={labelClassName}>
                  Departamento
                </label>

                <section className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <input
                    id="departamento"
                    name="departamento"
                    value={form.departamento}
                    onChange={onTextChange}
                    placeholder="Departamento"
                    className={`${inputClassName} pl-10`}
                  />
                </section>
              </article>

              <article>
                <label htmlFor="municipio" className={labelClassName}>
                  Municipio
                </label>

                <section className="relative">
                  <Building2
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={17}
                  />

                  <input
                    id="municipio"
                    name="municipio"
                    value={form.municipio}
                    onChange={onTextChange}
                    placeholder="Municipio"
                    className={`${inputClassName} pl-10`}
                  />
                </section>
              </article>
            </section>

            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <section className="flex items-start gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <section>
                  <p className="text-sm font-bold text-blue-900">
                    Programación de la cita
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    La lista de horarios se habilita cuando seleccionas una
                    fecha disponible.
                  </p>
                </section>
              </section>
            </article>
          </section>
        )}

        {/* Paso 3: información clínica */}
        {currentStep === 3 && (
          <section className="space-y-4">
            <article>
              <label htmlFor="motivoConsulta" className={labelClassName}>
                Motivo de consulta
              </label>

              <textarea
                id="motivoConsulta"
                name="motivoConsulta"
                rows={5}
                value={form.motivoConsulta}
                onChange={onTextChange}
                placeholder="Describe brevemente el motivo de consulta"
                className={`${inputClassName} resize-none`}
              />
            </article>

            <article>
              <label htmlFor="observaciones" className={labelClassName}>
                Observaciones
              </label>

              <textarea
                id="observaciones"
                name="observaciones"
                rows={4}
                value={form.observaciones}
                onChange={onTextChange}
                placeholder="Observaciones administrativas o clínicas"
                className={`${inputClassName} resize-none`}
              />
            </article>

            <article className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <section className="flex items-start gap-3">
                <Stethoscope
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <section>
                  <p className="text-sm font-bold text-blue-900">
                    Información clínica
                  </p>

                  <p className="mt-1 text-xs leading-5 text-blue-700">
                    Describe claramente el motivo de consulta para facilitar la
                    gestión y priorización de la cita.
                  </p>
                </section>
              </section>
            </article>
          </section>
        )}

        {/* Paso 4: indicadores de prioridad */}
        {currentStep === 4 && (
          <section className="space-y-4">
            <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <section className="flex items-start gap-3">
                <ShieldAlert
                  size={20}
                  className="mt-0.5 shrink-0 text-amber-600"
                />

                <section>
                  <p className="text-sm font-bold text-amber-900">
                    Indicadores de prioridad clínica
                  </p>

                  <p className="mt-1 text-xs leading-5 text-amber-700">
                    Selecciona únicamente las condiciones que correspondan al
                    paciente.
                  </p>
                </section>
              </section>
            </article>

            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.embarazada
                    ? "border-pink-300 bg-pink-50 text-pink-700 ring-2 ring-pink-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="embarazada"
                  checked={form.embarazada}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <HeartPulse size={17} />
                Embarazada
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.discapacidad
                    ? "border-violet-300 bg-violet-50 text-violet-700 ring-2 ring-violet-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="discapacidad"
                  checked={form.discapacidad}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <Accessibility size={17} />
                Discapacidad
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.dolorIntenso
                    ? "border-orange-300 bg-orange-50 text-orange-700 ring-2 ring-orange-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="dolorIntenso"
                  checked={form.dolorIntenso}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <Activity size={17} />
                Dolor intenso
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.sangrado
                    ? "border-red-300 bg-red-50 text-red-700 ring-2 ring-red-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="sangrado"
                  checked={form.sangrado}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <Droplets size={17} />
                Sangrado
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.dificultadRespiratoria
                    ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="dificultadRespiratoria"
                  checked={form.dificultadRespiratoria}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <Activity size={17} />
                Dificultad respiratoria
              </label>

              <label
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  form.fiebre
                    ? "border-amber-300 bg-amber-50 text-amber-700 ring-2 ring-amber-100"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <input
                  type="checkbox"
                  name="fiebre"
                  checked={form.fiebre}
                  onChange={onCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300"
                />

                <Flame size={17} />
                Fiebre
              </label>
            </section>

            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">
                Resumen del registro
              </p>

              <section className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-800">
                    Documento:
                  </span>{" "}
                  {form.documento || "Sin registrar"}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">Fecha:</span>{" "}
                  {form.fecha || "Sin seleccionar"}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">Hora:</span>{" "}
                  {form.hora || "Sin seleccionar"}
                </p>

                <p>
                  <span className="font-semibold text-slate-800">EPS:</span>{" "}
                  {form.eps || "Sin seleccionar"}
                </p>
              </section>
            </article>
          </section>
        )}

        {/* Navegación inferior */}
        <footer className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ArrowLeft size={17} />
              Atrás
            </button>
          ) : (
            <span />
          )}

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={goToNextStep}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Siguiente
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70"
            >
              <Send size={17} />
              {saving ? "Guardando cita..." : "Crear cita"}
            </button>
          )}
        </footer>
      </section>
    </section>
  );
}