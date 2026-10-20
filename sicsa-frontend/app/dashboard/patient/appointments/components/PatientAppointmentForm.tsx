"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import AppointmentPriorityFields from "@/app/components/AppointmentPriorityFields";

import type {
  AppointmentClassItem,
  AppointmentForm,
  SpecialtyItem,
} from "../types";

type PatientAppointmentFormProps = {
  form: AppointmentForm;
  specialties: SpecialtyItem[];
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

export function PatientAppointmentForm({
  form,
  specialties,
  appointmentClasses,
  loadingCatalogs,
  canCreateAppointment,
  saving,
  onChange,
  onSubmit,
}: PatientAppointmentFormProps) {
  const [step, setStep] = useState(1);

  const selectedSpecialty = useMemo(
    () =>
      specialties.find(
        (specialty) =>
          String(specialty.id) === String(form.specialtyId),
      ),
    [specialties, form.specialtyId],
  );


  const goNext = () => {
    setStep((previous) =>
      Math.min(previous + 1, STEPS.length),
    );
  };

  const goBack = () => {
    setStep((previous) => Math.max(previous - 1, 1));
  };


  const inputClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100 disabled:text-slate-400";

  const readOnlyClass =
    "w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none";

  const labelClass =
    "mb-2 block text-sm font-medium text-slate-700";

  return (
    <section className="min-w-0 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60 sm:p-6 lg:p-7">
      <header className="mb-5 flex items-center gap-3">
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

      <nav className="mb-6 flex items-start justify-between overflow-hidden px-1">
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
                  className={`hidden text-xs font-semibold sm:block ${isActive || isDone
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

          <section className="grid gap-4 md:grid-cols-2">
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
              disabled={!canCreateAppointment || loadingCatalogs || !form.specialtyId}
              className={inputClass}
            >
              <option value="">
                {loadingCatalogs
                  ? "Cargando clases..."
                  : form.specialtyId
                    ? "Selecciona clase de cita"
                    : "Selecciona primero una especialidad"}
              </option>

              {appointmentClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre || `Clase ${item.id}`}
                </option>
              ))}
            </select>
          </article>
          </section>

          <section className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
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

          <article>
            <label className={labelClass}>EPS registrada</label>

            <input
              value={form.eps}
              readOnly
              aria-readonly="true"
              placeholder={
                loadingCatalogs
                  ? "Cargando EPS de tu perfil..."
                  : "EPS no registrada"
              }
              className={readOnlyClass}
            />
          </article>

          <section className="flex items-start gap-3 rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-blue-700"
              size={18}
            />

            <p className="text-sm leading-6 text-blue-800">
              Esta EPS proviene de tu perfil registrado y se usará en la
              cita. Si necesitas actualizarla, solicita el cambio de tus
              datos personales.
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
        <section className="space-y-5">
          <header>
            <h3 className="text-lg font-semibold text-slate-900">
              Motivo y prioridad administrativa
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Registra solo la información necesaria para organizar la solicitud.
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
              rows={3}
              placeholder="Describe brevemente el motivo principal de la consulta."
              disabled={!canCreateAppointment}
              className={inputClass}
            />

            <p className="mt-2 text-xs leading-5 text-slate-400">
              No necesitas indicar un diagnóstico. Describe lo que
              sientes o el servicio que necesitas.
            </p>
          </article>

          <AppointmentPriorityFields
            value={form}
            disabled={!canCreateAppointment}
            onTextChange={onChange}
            onCheckboxChange={onChange}
          />

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
              No incluyas diagnósticos si no han sido establecidos por un profesional.
            </p>
          </article>
        </section>
      )}

      <section className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
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
