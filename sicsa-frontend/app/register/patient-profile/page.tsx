"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPatient } from "@/service/auth";

type EpsItem = {
  id: number;
  nombre: string;
  activo?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PatientProfilePage() {
  const router = useRouter();

  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    eps: "",
    epsId: "",
    genero: "",
    fechaNacimiento: "",
    departamento: "",
    municipio: "",
  });

  const [epsList, setEpsList] = useState<EpsItem[]>([]);
  const [loadingEps, setLoadingEps] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEps = async () => {
      try {
        const response = await fetch(`${API_URL}/eps`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error("No se pudo cargar la lista de EPS");
        }

        const data = (await response.json()) as EpsItem[];
        setEpsList(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
        alert("Error al cargar EPS");
      } finally {
        setLoadingEps(false);
      }
    };

    void loadEps();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    if (name === "epsId") {
      const selectedEps = epsList.find((item) => String(item.id) === value);

      setForm((prev) => ({
        ...prev,
        epsId: value,
        eps: selectedEps?.nombre || "",
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    const credentials = localStorage.getItem("register_credentials");

    if (!credentials) {
      alert("Primero completa el paso de correo y contraseña");
      router.push("/register");
      return;
    }

    const parsedCredentials = JSON.parse(credentials) as {
      email: string;
      password: string;
    };

    if (
      !form.tipoDocumento ||
      !form.numeroDocumento ||
      !form.primerNombre ||
      !form.primerApellido ||
      !form.telefono ||
      !form.eps ||
      !form.genero ||
      !form.fechaNacimiento ||
      !form.departamento ||
      !form.municipio
    ) {
      alert("Completa todos los campos obligatorios");
      return;
    }

    try {
      setLoading(true);

      await registerPatient({
        email: parsedCredentials.email,
        password: parsedCredentials.password,
        role: "patient",
        tipoDocumento: form.tipoDocumento,
        numeroDocumento: form.numeroDocumento,
        primerNombre: form.primerNombre,
        segundoNombre: form.segundoNombre,
        primerApellido: form.primerApellido,
        segundoApellido: form.segundoApellido,
        telefono: form.telefono,
        eps: form.eps,
        epsId: form.epsId ? Number(form.epsId) : undefined,
        genero: form.genero,
        fechaNacimiento: form.fechaNacimiento,
        departamento: form.departamento,
        municipio: form.municipio,
      });

      localStorage.removeItem("register_credentials");

      alert(
        "Registro completado con éxito. Revisa tu correo e ingresa el código de verificación.",
      );

      router.push(`/verify?email=${encodeURIComponent(parsedCredentials.email)}`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Error al completar el registro");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <header>
          <h1 className="mb-2 text-4xl font-extrabold text-slate-900">
            Completar Perfil
          </h1>
          <p className="mb-8 text-slate-600">
            Ingresa tu información personal para finalizar el registro
          </p>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <select
            name="tipoDocumento"
            value={form.tipoDocumento}
            onChange={handleChange}
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
            onChange={handleChange}
            className="input"
          />

          <input
            name="primerNombre"
            placeholder="Primer nombre"
            value={form.primerNombre}
            onChange={handleChange}
            className="input"
          />

          <input
            name="segundoNombre"
            placeholder="Segundo nombre"
            value={form.segundoNombre}
            onChange={handleChange}
            className="input"
          />

          <input
            name="primerApellido"
            placeholder="Primer apellido"
            value={form.primerApellido}
            onChange={handleChange}
            className="input"
          />

          <input
            name="segundoApellido"
            placeholder="Segundo apellido"
            value={form.segundoApellido}
            onChange={handleChange}
            className="input"
          />

          <input
            name="telefono"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={handleChange}
            className="input"
          />

          <select
            name="genero"
            value={form.genero}
            onChange={handleChange}
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
            onChange={handleChange}
            className="input"
          />

          <input
            name="departamento"
            placeholder="Departamento"
            value={form.departamento}
            onChange={handleChange}
            className="input"
          />

          <input
            name="municipio"
            placeholder="Municipio"
            value={form.municipio}
            onChange={handleChange}
            className="input"
          />

          <select
            name="epsId"
            value={form.epsId}
            onChange={handleChange}
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
          onClick={handleSubmit}
          disabled={loading}
          className="mt-10 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Registrando..." : "Completar Registro"}
        </button>
      </section>
    </main>
  );
}