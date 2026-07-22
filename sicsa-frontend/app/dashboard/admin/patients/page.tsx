"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  FileText,
  HeartPulse,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import { getToken, getUser } from "@/service/session";
import { getPatients, updatePatientByAdmin } from "@/service/patient";

type Patient = {
  id: number;
  tipoDocumento: string;
  numeroDocumento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  telefono: string;
  email: string;
  eps: string;
  epsId?: number;
  genero?: string;
  fechaNacimiento?: string;
  departamento?: string;
  municipio?: string;
};

export default function AdminPatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    email: "",
    eps: "",
    genero: "",
    fechaNacimiento: "",
    departamento: "",
    municipio: "",
  });

  const loadPatients = useCallback(
    async (searchValue = "") => {
      const token = getToken();

      if (!token) {
        router.replace("/login?role=admin");
        return;
      }

      try {
        setLoading(true);

        const result = await getPatients(token, searchValue);

        setPatients(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error cargando pacientes:", error);
        alert("No se pudieron cargar los pacientes");
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const token = getToken();
    const user = getUser();

    if (!token || !user || user.role !== "admin") {
      router.replace("/login?role=admin");
      return;
    }

    void loadPatients();
  }, [router, loadPatients]);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);

    setForm({
      tipoDocumento: patient.tipoDocumento || "",
      numeroDocumento: patient.numeroDocumento || "",
      primerNombre: patient.primerNombre || "",
      segundoNombre: patient.segundoNombre || "",
      primerApellido: patient.primerApellido || "",
      segundoApellido: patient.segundoApellido || "",
      telefono: patient.telefono || "",
      email: patient.email || "",
      eps: patient.eps || "",
      genero: patient.genero || "",
      fechaNacimiento: patient.fechaNacimiento || "",
      departamento: patient.departamento || "",
      municipio: patient.municipio || "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSearch = () => {
    void loadPatients(search.trim());
  };

  const handleSave = async () => {
    const token = getToken();

    if (!token || !selectedPatient) {
      alert("Selecciona un paciente");
      return;
    }

    if (
      !form.tipoDocumento ||
      !form.numeroDocumento ||
      !form.primerNombre ||
      !form.primerApellido ||
      !form.telefono ||
      !form.email ||
      !form.eps ||
      !form.departamento ||
      !form.municipio
    ) {
      alert("Completa los campos obligatorios");
      return;
    }

    try {
      setSaving(true);

      const updated = await updatePatientByAdmin(
        token,
        selectedPatient.id,
        form,
      );

      setSelectedPatient(updated);

      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === updated.id ? updated : patient,
        ),
      );

      alert("Datos del paciente actualizados correctamente");
    } catch (error) {
      console.error("Error actualizando paciente:", error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error actualizando paciente");
      }
    } finally {
      setSaving(false);
    }
  };

  const personalFields: Array<[keyof typeof form, string, string]> = [
    ["tipoDocumento", "Tipo de documento", "CC, TI, CE..."],
    ["numeroDocumento", "Número de documento", "Número de identificación"],
    ["primerNombre", "Primer nombre", "Primer nombre"],
    ["segundoNombre", "Segundo nombre", "Segundo nombre"],
    ["primerApellido", "Primer apellido", "Primer apellido"],
    ["segundoApellido", "Segundo apellido", "Segundo apellido"],
  ];

  const contactFields: Array<[keyof typeof form, string, string]> = [
    ["telefono", "Teléfono", "Teléfono de contacto"],
    ["email", "Correo electrónico", "Correo del paciente"],
  ];

  const healthFields: Array<[keyof typeof form, string, string]> = [
    ["eps", "EPS", "Entidad promotora de salud"],
    ["genero", "Género", "Femenino, Masculino, Otro"],
    ["fechaNacimiento", "Fecha de nacimiento", "Fecha de nacimiento"],
  ];

  const locationFields: Array<[keyof typeof form, string, string]> = [
    ["departamento", "Departamento", "Departamento"],
    ["municipio", "Municipio", "Municipio"],
  ];

  const getPatientFullName = (patient: Patient) =>
    [
      patient.primerNombre,
      patient.segundoNombre,
      patient.primerApellido,
      patient.segundoApellido,
    ]
      .filter(Boolean)
      .join(" ");

  const inputClassName =
    "w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100";

  const labelClassName =
    "mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600";

  const renderField = (
    field: keyof typeof form,
    label: string,
    placeholder: string,
  ) => (
    <article key={field}>
      <label htmlFor={field} className={labelClassName}>
        {label}
      </label>

      <input
        id={field}
        name={field}
        value={form[field]}
        onChange={handleChange}
        type={field === "fechaNacimiento" ? "date" : "text"}
        placeholder={placeholder}
        className={inputClassName}
      />
    </article>
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1500px]">
        <button
          type="button"
          onClick={() => router.push("/dashboard/admin")}
          className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <ArrowLeft size={17} />
          Volver al panel administrativo
        </button>

        {/* Encabezado */}
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-7 text-white shadow-xl sm:px-8 lg:px-10">
          <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <span className="pointer-events-none absolute -bottom-24 left-1/3 h-60 w-60 rounded-full bg-indigo-400/10 blur-3xl" />

          <section className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <section className="flex items-start gap-4">
              <figure className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur sm:h-16 sm:w-16">
                <UsersRound size={30} />
              </figure>

              <section>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-200 sm:text-sm">
                  Gestión administrativa
                </p>

                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Actualización de pacientes
                </h1>

                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200 sm:text-base">
                  Busca pacientes registrados y actualiza información personal,
                  contacto, EPS y ubicación desde el panel administrativo.
                </p>
              </section>
            </section>

            <article className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                <ShieldCheck size={22} />
              </span>

              <section>
                <p className="text-sm text-slate-300">Pacientes encontrados</p>
                <p className="mt-0.5 text-2xl font-bold">{patients.length}</p>
              </section>
            </article>
          </section>
        </header>

        {/* Contenido principal */}
        <section className="mt-5 grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          {/* Lista de pacientes */}
          <aside className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-slate-50 px-5 py-5">
              <section className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <Search size={21} />
                </span>

                <section>
                  <h2 className="text-xl font-bold text-slate-900">
                    Buscar paciente
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Selecciona un resultado para editarlo.
                  </p>
                </section>
              </section>
            </header>

            <section className="p-5">
              <section className="flex gap-2">
                <article className="relative min-w-0 flex-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    size={18}
                  />

                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearch();
                      }
                    }}
                    placeholder="Documento, nombre, correo, teléfono o EPS"
                    className={`${inputClassName} pl-10`}
                  />
                </article>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Search size={17} />
                  <span className="hidden sm:inline">Buscar</span>
                </button>
              </section>

              <section className="mt-4 flex items-center justify-between border-b border-slate-200 pb-3">
                <p className="text-sm font-semibold text-slate-700">
                  Resultados
                </p>

                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {patients.length}
                </span>
              </section>

              <section className="mt-3 max-h-[690px] space-y-3 overflow-y-auto pr-1">
                {loading ? (
                  <article className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <LoaderCircle
                      className="animate-spin text-blue-600"
                      size={32}
                    />

                    <p className="mt-4 font-semibold text-slate-700">
                      Cargando pacientes...
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Consultando la información registrada.
                    </p>
                  </article>
                ) : patients.length === 0 ? (
                  <article className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                      <UsersRound size={27} />
                    </span>

                    <h3 className="mt-4 font-bold text-slate-900">
                      No se encontraron pacientes
                    </h3>

                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      Intenta buscar por documento, nombre, correo, teléfono o
                      EPS.
                    </p>
                  </article>
                ) : (
                  patients.map((patient) => {
                    const isSelected = selectedPatient?.id === patient.id;

                    return (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handleSelectPatient(patient)}
                        className={`group w-full rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-100"
                            : "border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white hover:shadow-sm"
                        }`}
                      >
                        <header className="flex items-start justify-between gap-3">
                          <section className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                isSelected
                                  ? "bg-blue-600 text-white"
                                  : "bg-white text-slate-500 shadow-sm"
                              }`}
                            >
                              <UserRound size={20} />
                            </span>

                            <section className="min-w-0">
                              <p className="truncate font-bold capitalize text-slate-900">
                                {getPatientFullName(patient)}
                              </p>

                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {patient.tipoDocumento}{" "}
                                {patient.numeroDocumento}
                              </p>
                            </section>
                          </section>

                          {isSelected && (
                            <CheckCircle2
                              size={20}
                              className="shrink-0 text-blue-600"
                            />
                          )}
                        </header>

                        <section className="mt-4 space-y-2">
                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate">
                              {patient.email || "Correo no registrado"}
                            </span>
                          </p>

                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span>
                              {patient.telefono || "Teléfono no registrado"}
                            </span>
                          </p>

                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <HeartPulse
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate">
                              {patient.eps || "EPS no registrada"}
                            </span>
                          </p>

                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <MapPin
                              size={15}
                              className="shrink-0 text-slate-400"
                            />

                            <span className="truncate">
                              {patient.municipio || "Sin municipio"},{" "}
                              {patient.departamento || "Sin departamento"}
                            </span>
                          </p>
                        </section>
                      </button>
                    );
                  })
                )}
              </section>
            </section>
          </aside>

          {/* Formulario de edición */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <header className="border-b border-slate-200 bg-gradient-to-r from-white to-blue-50 px-5 py-5 sm:px-6">
              <section className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200">
                  <FileText size={21} />
                </span>

                <section>
                  <h2 className="text-xl font-bold text-slate-900">
                    Editar información
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    Actualiza los datos administrativos del paciente.
                  </p>
                </section>
              </section>
            </header>

            {!selectedPatient ? (
              <article className="flex min-h-[620px] flex-col items-center justify-center p-8 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                  <UserRound size={36} />
                </span>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  Selecciona un paciente
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Elige un paciente de la lista ubicada a la izquierda para
                  consultar y actualizar su información.
                </p>
              </article>
            ) : (
              <section className="p-5 sm:p-6">
                {/* Paciente seleccionado */}
                <article className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-white p-4">
                  <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <section className="flex min-w-0 items-center gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white">
                        <UserRound size={23} />
                      </span>

                      <section className="min-w-0">
                        <p className="truncate text-lg font-bold capitalize text-slate-900">
                          {getPatientFullName(selectedPatient)}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {selectedPatient.tipoDocumento}{" "}
                          {selectedPatient.numeroDocumento}
                        </p>
                      </section>
                    </section>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <CheckCircle2 size={15} />
                      Paciente seleccionado
                    </span>
                  </section>
                </article>

                {/* Información personal */}
                <section className="mt-6">
                  <header className="mb-4 flex items-center gap-2">
                    <UserRound size={18} className="text-blue-600" />

                    <section>
                      <h3 className="font-bold text-slate-900">
                        Información personal
                      </h3>

                      <p className="text-xs text-slate-500">
                        Documento, nombres y apellidos.
                      </p>
                    </section>
                  </header>

                  <section className="grid gap-4 md:grid-cols-2">
                    {personalFields.map(([field, label, placeholder]) =>
                      renderField(field, label, placeholder),
                    )}
                  </section>
                </section>

                <div className="my-6 h-px bg-slate-200" />

                {/* Contacto */}
                <section>
                  <header className="mb-4 flex items-center gap-2">
                    <Phone size={18} className="text-blue-600" />

                    <section>
                      <h3 className="font-bold text-slate-900">
                        Información de contacto
                      </h3>

                      <p className="text-xs text-slate-500">
                        Teléfono y correo electrónico.
                      </p>
                    </section>
                  </header>

                  <section className="grid gap-4 md:grid-cols-2">
                    {contactFields.map(([field, label, placeholder]) =>
                      renderField(field, label, placeholder),
                    )}
                  </section>
                </section>

                <div className="my-6 h-px bg-slate-200" />

                {/* Salud */}
                <section>
                  <header className="mb-4 flex items-center gap-2">
                    <HeartPulse size={18} className="text-blue-600" />

                    <section>
                      <h3 className="font-bold text-slate-900">
                        Información de salud
                      </h3>

                      <p className="text-xs text-slate-500">
                        EPS, género y fecha de nacimiento.
                      </p>
                    </section>
                  </header>

                  <section className="grid gap-4 md:grid-cols-2">
                    {healthFields.map(([field, label, placeholder]) =>
                      renderField(field, label, placeholder),
                    )}
                  </section>
                </section>

                <div className="my-6 h-px bg-slate-200" />

                {/* Ubicación */}
                <section>
                  <header className="mb-4 flex items-center gap-2">
                    <Building2 size={18} className="text-blue-600" />

                    <section>
                      <h3 className="font-bold text-slate-900">
                        Información de ubicación
                      </h3>

                      <p className="text-xs text-slate-500">
                        Departamento y municipio de residencia.
                      </p>
                    </section>
                  </header>

                  <section className="grid gap-4 md:grid-cols-2">
                    {locationFields.map(([field, label, placeholder]) =>
                      renderField(field, label, placeholder),
                    )}
                  </section>
                </section>

                {/* Acción */}
                <footer className="mt-7 flex justify-end border-t border-slate-200 pt-5">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-950 to-blue-900 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-70 sm:w-auto"
                  >
                    {saving ? (
                      <LoaderCircle className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}

                    {saving ? "Guardando cambios..." : "Guardar cambios"}
                  </button>
                </footer>
              </section>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}