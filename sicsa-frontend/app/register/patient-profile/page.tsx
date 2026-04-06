"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { registerPatient } from "@/service/auth";

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
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    const credentials = localStorage.getItem("register_credentials");

    if (!credentials) {
      alert("Primero completa el paso de correo y contraseña");
      router.push("/register");
      return;
    }

    const parsedCredentials = JSON.parse(credentials);

    try {
      setLoading(true);

      await registerPatient({
        email: parsedCredentials.email,
        password: parsedCredentials.password,
        role: "patient",
        ...form,
      });

      localStorage.removeItem("register_credentials");
      alert("Registro completado con éxito");
      router.push("/login?role=patient");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 p-6">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        <h1 className="mb-2 text-4xl font-extrabold text-slate-900">
          Completar Perfil
        </h1>
        <p className="mb-8 text-slate-600">
          Ingresa tu información personal
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <input
            name="tipoDocumento"
            placeholder="Tipo de documento"
            onChange={handleChange}
            className="input"
          />
          <input
            name="numeroDocumento"
            placeholder="Número de documento"
            onChange={handleChange}
            className="input"
          />

          <input
            name="primerNombre"
            placeholder="Primer nombre"
            onChange={handleChange}
            className="input"
          />
          <input
            name="segundoNombre"
            placeholder="Segundo nombre"
            onChange={handleChange}
            className="input"
          />

          <input
            name="primerApellido"
            placeholder="Primer apellido"
            onChange={handleChange}
            className="input"
          />
          <input
            name="segundoApellido"
            placeholder="Segundo apellido"
            onChange={handleChange}
            className="input"
          />

          <input
            name="telefono"
            placeholder="Teléfono"
            onChange={handleChange}
            className="input"
          />
          <input
            name="eps"
            placeholder="EPS"
            onChange={handleChange}
            className="input"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-10 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Registrando..." : "Completar Registro"}
        </button>
      </div>
    </div>
  );
}