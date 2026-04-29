"use client";

import { FilePlus2 } from "lucide-react";
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
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <FilePlus2 className="text-slate-700" size={22} />
        </span>
        <section>
          <h2 className="text-2xl font-semibold text-slate-900">
            Registro manual de cita
          </h2>
          <p className="mt-1 text-slate-600">
            Completa la información clínica y administrativa.
          </p>
        </section>
      </header>

      <section className="space-y-4">
        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Documento del paciente
          </label>
          <input
            name="documento"
            value={form.documento}
            onChange={onTextChange}
            placeholder="Número de documento"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </article>

        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Especialidad
            </label>
            <select
              name="specialtyId"
              value={form.specialtyId}
              onChange={onTextChange}
              disabled={loadingCatalogs}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Clase de cita
            </label>
            <select
              name="appointmentClassId"
              value={form.appointmentClassId}
              onChange={onTextChange}
              disabled={loadingCatalogs}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Fecha
            </label>
            <input
              type="date"
              name="fecha"
              min={today}
              value={form.fecha}
              onChange={onTextChange}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </article>

          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Hora disponible
            </label>
            <select
              name="hora"
              value={form.hora}
              onChange={onTextChange}
              disabled={!form.fecha || loadingHours}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
            >
              <option value="">
                {loadingHours ? "Cargando horarios..." : "Selecciona una hora"}
              </option>
              {availableHours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              EPS
            </label>
            <select
              name="epsId"
              value={form.epsId}
              onChange={onTextChange}
              disabled={loadingCatalogs}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white disabled:bg-slate-100"
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

        <section className="grid gap-4 md:grid-cols-2">
          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Departamento
            </label>
            <input
              name="departamento"
              value={form.departamento}
              onChange={onTextChange}
              placeholder="Departamento"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </article>

          <article>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Municipio
            </label>
            <input
              name="municipio"
              value={form.municipio}
              onChange={onTextChange}
              placeholder="Municipio"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </article>
        </section>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Edad
          </label>
          <input
            type="number"
            name="edad"
            value={form.edad}
            onChange={onTextChange}
            placeholder="Edad"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </article>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Motivo de consulta
          </label>
          <textarea
            name="motivoConsulta"
            rows={4}
            value={form.motivoConsulta}
            onChange={onTextChange}
            placeholder="Escribe el motivo de consulta"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </article>

        <article>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Observaciones
          </label>
          <textarea
            name="observaciones"
            rows={3}
            value={form.observaciones}
            onChange={onTextChange}
            placeholder="Observaciones administrativas o clínicas"
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
          />
        </article>

        <section className="grid grid-cols-2 gap-3 text-sm text-slate-700">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="embarazada"
              checked={form.embarazada}
              onChange={onCheckboxChange}
            />
            Embarazada
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="discapacidad"
              checked={form.discapacidad}
              onChange={onCheckboxChange}
            />
            Discapacidad
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="dolorIntenso"
              checked={form.dolorIntenso}
              onChange={onCheckboxChange}
            />
            Dolor intenso
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="sangrado"
              checked={form.sangrado}
              onChange={onCheckboxChange}
            />
            Sangrado
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="dificultadRespiratoria"
              checked={form.dificultadRespiratoria}
              onChange={onCheckboxChange}
            />
            Dif. respiratoria
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
            <input
              type="checkbox"
              name="fiebre"
              checked={form.fiebre}
              onChange={onCheckboxChange}
            />
            Fiebre
          </label>
        </section>

        <button
          onClick={onSubmit}
          disabled={saving}
          className="w-full rounded-2xl bg-gradient-to-r from-slate-900 to-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
        >
          {saving ? "Guardando..." : "Crear cita"}
        </button>
      </section>
    </section>
  );
}
