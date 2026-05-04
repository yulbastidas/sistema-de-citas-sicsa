"use client";

import { PlusCircle, ShieldAlert } from "lucide-react";
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
  return (
    <section className="rounded-[2rem] border border-cyan-100 bg-white/90 p-8 shadow-lg backdrop-blur">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100">
          <PlusCircle className="text-cyan-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">Nueva cita</h2>
          <p className="mt-1 text-slate-600">
            Completa la solicitud con datos administrativos y clínicos.
          </p>
        </section>
      </header>

      {!canCreateAppointment && (
        <section className="mb-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
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

      <section className="space-y-4">
        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Especialidad
          </label>
          <select
            name="specialtyId"
            value={form.specialtyId}
            onChange={onChange}
            disabled={!canCreateAppointment || loadingCatalogs}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
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
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Clase de cita
          </label>
          <select
            name="appointmentClassId"
            value={form.appointmentClassId}
            onChange={onChange}
            disabled={!canCreateAppointment || loadingCatalogs}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
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

        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              EPS
            </label>
            <select
              name="epsId"
              value={form.epsId}
              onChange={onChange}
              disabled={!canCreateAppointment || loadingCatalogs}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              EPS seleccionada
            </label>
            <input
              value={form.eps}
              readOnly
              placeholder="EPS seleccionada"
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-700 outline-none"
            />
          </article>
        </section>

        {/* UBICACIÓN DINÁMICA: Ahora son solo lectura y dependen del Hook */}
        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Departamento
            </label>
            <input
              name="departamento"
              value={form.departamento}
              readOnly // CORREGIDO: Solo lectura porque viene del perfil
              placeholder="Departamento detectado"
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </article>

          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Municipio
            </label>
            <input
              name="municipio"
              value={form.municipio}
              readOnly // CORREGIDO: Solo lectura
              placeholder="Municipio detectado"
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm text-slate-500 outline-none"
            />
          </article>
        </section>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Motivo de consulta
          </label>
          <textarea
            name="motivoConsulta"
            value={form.motivoConsulta}
            onChange={onChange}
            rows={4}
            placeholder="Describe el motivo de la cita"
            disabled={!canCreateAppointment}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
          />
        </article>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            value={form.observaciones}
            onChange={onChange}
            rows={3}
            placeholder="Observaciones adicionales"
            disabled={!canCreateAppointment}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-cyan-500 focus:bg-white disabled:bg-slate-100"
          />
        </article>

        <button
          onClick={onSubmit}
          disabled={saving || !canCreateAppointment}
          className="w-full rounded-2xl bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
        >
          {saving ? "Guardando..." : "Crear cita"}
        </button>
      </section>
    </section>
  );
}