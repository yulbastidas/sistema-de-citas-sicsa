"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Search, UsersRound } from "lucide-react";
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
        prev.map((patient) => (patient.id === updated.id ? updated : patient)),
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

  const fields: Array<[keyof typeof form, string, string]> = [
    ["tipoDocumento", "Tipo de documento", "CC, TI, CE..."],
    ["numeroDocumento", "Número de documento", "Número de identificación"],
    ["primerNombre", "Primer nombre", "Primer nombre"],
    ["segundoNombre", "Segundo nombre", "Segundo nombre"],
    ["primerApellido", "Primer apellido", "Primer apellido"],
    ["segundoApellido", "Segundo apellido", "Segundo apellido"],
    ["telefono", "Teléfono", "Teléfono de contacto"],
    ["email", "Correo electrónico", "Correo del paciente"],
    ["eps", "EPS", "Entidad promotora de salud"],
    ["genero", "Género", "Femenino, Masculino, Otro"],
    ["fechaNacimiento", "Fecha de nacimiento", "Fecha de nacimiento"],
    ["departamento", "Departamento", "Departamento"],
    ["municipio", "Municipio", "Municipio"],
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <section className="mx-auto max-w-7xl">
        <button
          onClick={() => router.push("/dashboard/admin")}
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Volver al panel admin
        </button>

        <header className="rounded-[2rem] bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-8 py-8 text-white shadow-xl">
          <section className="flex items-start gap-4">
            <figure className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/20">
              <UsersRound size={30} />
            </figure>

            <section>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">
                Gestión administrativa
              </p>
              <h1 className="mt-2 text-4xl font-bold">
                Actualización de datos del paciente
              </h1>
              <p className="mt-2 max-w-3xl text-blue-50">
                Busca pacientes registrados y actualiza su información personal,
                datos de contacto, EPS y ubicación desde el rol administrador.
              </p>
            </section>
          </section>
        </header>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900">
              Buscar paciente
            </h2>

            <section className="mt-5 flex gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Documento, nombre, correo, teléfono o EPS"
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
              />

              <button
                onClick={handleSearch}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Search size={16} />
                Buscar
              </button>
            </section>

            <section className="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-2">
              {loading ? (
                <p className="text-sm text-slate-500">Cargando pacientes...</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No se encontraron pacientes.
                </p>
              ) : (
                patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedPatient?.id === patient.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <p className="font-semibold text-slate-900">
                      {patient.primerNombre} {patient.segundoNombre}{" "}
                      {patient.primerApellido} {patient.segundoApellido}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {patient.tipoDocumento} {patient.numeroDocumento}
                    </p>

                    <p className="text-sm text-slate-600">{patient.email}</p>

                    <p className="text-sm text-slate-600">
                      Teléfono: {patient.telefono || "No registrado"}
                    </p>

                    <p className="text-sm text-slate-600">
                      EPS: {patient.eps || "No registrada"}
                    </p>

                    <p className="text-sm text-slate-600">
                      Ubicación: {patient.municipio || "Sin municipio"},{" "}
                      {patient.departamento || "Sin departamento"}
                    </p>
                  </button>
                ))
              )}
            </section>
          </article>

          <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900">
              Editar información
            </h2>

            {!selectedPatient ? (
              <p className="mt-5 text-sm text-slate-500">
                Selecciona un paciente para actualizar sus datos.
              </p>
            ) : (
              <>
                <section className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">
                    {selectedPatient.primerNombre}{" "}
                    {selectedPatient.segundoNombre}{" "}
                    {selectedPatient.primerApellido}{" "}
                    {selectedPatient.segundoApellido}
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Documento: {selectedPatient.tipoDocumento}{" "}
                    {selectedPatient.numeroDocumento}
                  </p>

                  <p className="text-sm text-slate-600">
                    Correo: {selectedPatient.email}
                  </p>
                </section>

                <section className="mt-5 grid gap-4 md:grid-cols-2">
                  {fields.map(([field, label, placeholder]) => (
                    <article key={field}>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        {label}
                      </label>

                      <input
                        name={field}
                        value={form[field]}
                        onChange={handleChange}
                        type={field === "fechaNacimiento" ? "date" : "text"}
                        placeholder={placeholder}
                        className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                    </article>
                  ))}
                </section>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
                >
                  <Save size={16} />
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </>
            )}
          </article>
        </section>
      </section>
    </main>
  );
}
