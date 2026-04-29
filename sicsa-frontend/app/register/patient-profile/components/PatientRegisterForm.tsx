"use client";

import type { CityItem, DepartmentItem, EpsItem, PatientRegisterFormData } from "../types";

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
  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
      <header>
        <h1 className="mb-2 text-4xl font-extrabold text-slate-900">
          Completar Perfil
        </h1>
        <p className="mb-8 text-slate-600">
          Ingresa tu información personal para finalizar el registro.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <select
          name="tipoDocumento"
          value={form.tipoDocumento}
          onChange={onChange}
          className="input"
        >
          <option value="">Selecciona tipo de documento</option>
          <option value="CC">Cédula de ciudadanía</option>
          <option value="TI">Tarjeta de identidad</option>
          <option value="CE">Cédula de extranjería</option>
          <option value="RC">Registro civil</option>
          <option value="PASAPORTE">Pasaporte</option>
        </select>

        <input
          name="numeroDocumento"
          placeholder="Número de documento"
          value={form.numeroDocumento}
          onChange={onChange}
          className="input"
        />

        <input
          name="primerNombre"
          placeholder="Primer nombre"
          value={form.primerNombre}
          onChange={onChange}
          className="input"
        />

        <input
          name="segundoNombre"
          placeholder="Segundo nombre"
          value={form.segundoNombre}
          onChange={onChange}
          className="input"
        />

        <input
          name="primerApellido"
          placeholder="Primer apellido"
          value={form.primerApellido}
          onChange={onChange}
          className="input"
        />

        <input
          name="segundoApellido"
          placeholder="Segundo apellido"
          value={form.segundoApellido}
          onChange={onChange}
          className="input"
        />

        <input
          name="telefono"
          placeholder="Teléfono"
          value={form.telefono}
          onChange={onChange}
          className="input"
        />

        <select
          name="genero"
          value={form.genero}
          onChange={onChange}
          className="input"
        >
          <option value="">Selecciona género</option>
          <option value="Femenino">Femenino</option>
          <option value="Masculino">Masculino</option>
          <option value="Otro">Otro</option>
          <option value="Prefiero no decirlo">Prefiero no decirlo</option>
        </select>

        <input
          name="fechaNacimiento"
          type="date"
          value={form.fechaNacimiento}
          onChange={onChange}
          className="input"
        />

        <select
          name="departamentoId"
          value={form.departamentoId}
          onChange={onChange}
          className="input"
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

        <select
          name="municipioId"
          value={form.municipioId}
          onChange={onChange}
          className="input"
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

        <select
          name="epsId"
          value={form.epsId}
          onChange={onChange}
          className="input"
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

        <input
          name="eps"
          placeholder="EPS seleccionada"
          value={form.eps}
          readOnly
          className="input bg-slate-100"
        />
      </section>

      <button
        onClick={onSubmit}
        disabled={loading}
        className="mt-10 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Registrando..." : "Completar Registro"}
      </button>
    </section>
  );
}