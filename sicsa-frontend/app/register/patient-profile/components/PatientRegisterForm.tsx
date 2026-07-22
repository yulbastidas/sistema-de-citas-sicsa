"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HeartPulse,
  MapPin,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type {
  CityItem,
  DepartmentItem,
  EpsItem,
  PatientRegisterFormData,
} from "../types";

type Props = {
  form: PatientRegisterFormData;
  epsList: EpsItem[];
  departments: DepartmentItem[];
  cities: CityItem[];
  loading: boolean;
  loadingEps: boolean;
  loadingDepartments: boolean;
  loadingCities: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void | Promise<void>;
  onSubmit: () => void;
};

export function PatientRegisterForm({
  form,
  epsList,
  departments,
  cities,
  loading,
  loadingEps,
  loadingDepartments,
  loadingCities,
  onChange,
  onSubmit,
}: Props) {
  const inputClass =
    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  const today = new Date();
  const maximumBirthDate = today.toISOString().split("T")[0];

  const minimumBirthDateObject = new Date(today);
  minimumBirthDateObject.setFullYear(today.getFullYear() - 120);

  const minimumBirthDate = minimumBirthDateObject
    .toISOString()
    .split("T")[0];

  return (
    <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
      <header className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-6 py-8 sm:px-10">
        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between text-xs font-semibold sm:text-sm">
            <span className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={18} />
              1. Cuenta completada
            </span>

            <span className="text-blue-600">2. Datos personales</span>
          </div>

          <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-blue-600" />
          </div>

          <p className="mt-3 text-sm text-slate-500">Paso 2 de 2</p>
        </section>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <figure className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <UserRound size={32} />
          </figure>

          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Completa tu perfil
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600">
              Ingresa tu información personal para finalizar el registro como
              paciente.
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-10 px-6 py-8 sm:px-10">
        {/* Identificación */}
        <section>
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <FileText size={20} />
            </span>

            <div>
              <h2 className="font-bold text-slate-900">Identificación</h2>
              <p className="text-sm text-slate-500">
                Información del documento del paciente.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Tipo de documento *
              </span>

              <select
                name="tipoDocumento"
                value={form.tipoDocumento}
                onChange={onChange}
                className={inputClass}
              >
                <option value="">Selecciona tipo de documento</option>
                <option value="CC">Cédula de ciudadanía</option>
                <option value="TI">Tarjeta de identidad</option>
                <option value="CE">Cédula de extranjería</option>
                <option value="RC">Registro civil</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Número de documento *
              </span>

              <input
                name="numeroDocumento"
                placeholder="Número de documento"
                value={form.numeroDocumento}
                onChange={onChange}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        {/* Datos personales */}
        <section>
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <UserRound size={20} />
            </span>

            <div>
              <h2 className="font-bold text-slate-900">Datos personales</h2>
              <p className="text-sm text-slate-500">
                Nombres, apellidos y datos básicos.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Primer nombre *
              </span>

              <input
                name="primerNombre"
                placeholder="Primer nombre"
                value={form.primerNombre}
                onChange={onChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Segundo nombre
              </span>

              <input
                name="segundoNombre"
                placeholder="Segundo nombre"
                value={form.segundoNombre}
                onChange={onChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Primer apellido *
              </span>

              <input
                name="primerApellido"
                placeholder="Primer apellido"
                value={form.primerApellido}
                onChange={onChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Segundo apellido
              </span>

              <input
                name="segundoApellido"
                placeholder="Segundo apellido"
                value={form.segundoApellido}
                onChange={onChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Teléfono *
              </span>

              <input
                name="telefono"
                type="tel"
                placeholder="Número de teléfono"
                value={form.telefono}
                onChange={onChange}
                className={inputClass}
              />
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Género *
              </span>

              <select
                name="genero"
                value={form.genero}
                onChange={onChange}
                className={inputClass}
              >
                <option value="">Selecciona género</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
                <option value="Prefiero no decirlo">
                  Prefiero no decirlo
                </option>
              </select>
            </label>

            <label className="md:col-span-2">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Fecha de nacimiento *
              </span>

              <input
                name="fechaNacimiento"
                type="date"
                min={minimumBirthDate}
                max={maximumBirthDate}
                value={form.fechaNacimiento}
                onChange={onChange}
                className={inputClass}
              />

              <span className="mt-2 block text-xs text-slate-500">
                La fecha no puede ser futura ni superar los 120 años.
              </span>
            </label>
          </div>
        </section>

        {/* Ubicación */}
        <section>
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <MapPin size={20} />
            </span>

            <div>
              <h2 className="font-bold text-slate-900">Ubicación</h2>
              <p className="text-sm text-slate-500">
                Selecciona el departamento y municipio.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Departamento *
              </span>

              <select
                name="departamentoId"
                value={form.departamentoId}
                onChange={onChange}
                className={inputClass}
                disabled={loadingDepartments}
              >
                <option value="">
                  {loadingDepartments
                    ? "Cargando departamentos..."
                    : "Selecciona departamento"}
                </option>

                {departments.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Municipio *
              </span>

              <select
                name="municipioId"
                value={form.municipioId}
                onChange={onChange}
                className={inputClass}
                disabled={!form.departamentoId || loadingCities}
              >
                <option value="">
                  {!form.departamentoId
                    ? "Primero selecciona departamento"
                    : loadingCities
                      ? "Cargando municipios..."
                      : "Selecciona municipio"}
                </option>

                {cities.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* Información de salud */}
        <section>
          <header className="mb-5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <HeartPulse size={20} />
            </span>

            <div>
              <h2 className="font-bold text-slate-900">
                Información de salud
              </h2>
              <p className="text-sm text-slate-500">
                Selecciona la EPS a la que estás afiliado.
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                EPS *
              </span>

              <select
                name="epsId"
                value={form.epsId}
                onChange={onChange}
                className={inputClass}
                disabled={loadingEps}
              >
                <option value="">
                  {loadingEps ? "Cargando EPS..." : "Selecciona EPS"}
                </option>

                {epsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                EPS seleccionada
              </span>

              <input
                name="eps"
                placeholder="EPS seleccionada"
                value={form.eps}
                readOnly
                className={`${inputClass} bg-slate-100`}
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              className="mt-0.5 shrink-0 text-blue-600"
              size={21}
            />

            <p className="text-sm leading-relaxed text-slate-600">
              Verifica que la información sea correcta antes de completar el
              registro. Los campos marcados con asterisco son obligatorios.
            </p>
          </div>
        </section>

        <section className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-7 sm:flex-row sm:justify-between">
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={20} />
            Volver
          </Link>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <CheckCircle2 size={21} />
            {loading ? "Registrando..." : "Completar registro"}
          </button>
        </section>
      </section>
    </section>
  );
}