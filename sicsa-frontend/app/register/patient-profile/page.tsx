"use client";

import { useState } from "react";

export default function PatientProfilePage() {
  const [form, setForm] = useState({
    tipoDocumento: "",
    numeroDocumento: "",
    primerNombre: "",
    segundoNombre: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    direccion: "",
    eps: "",
    fechaNacimiento: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
        
        <h1 className="mb-2 text-4xl font-extrabold text-slate-900">
          Completar Perfil
        </h1>
        <p className="mb-8 text-slate-600">
          Ingresa tu información personal
        </p>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <input name="tipoDocumento" placeholder="Tipo de documento" onChange={handleChange} className="input" />
          <input name="numeroDocumento" placeholder="Número de documento" onChange={handleChange} className="input" />

          <input name="primerNombre" placeholder="Primer nombre" onChange={handleChange} className="input" />
          <input name="segundoNombre" placeholder="Segundo nombre" onChange={handleChange} className="input" />

          <input name="primerApellido" placeholder="Primer apellido" onChange={handleChange} className="input" />
          <input name="segundoApellido" placeholder="Segundo apellido" onChange={handleChange} className="input" />

          <input name="telefono" placeholder="Teléfono" onChange={handleChange} className="input" />
          <input name="direccion" placeholder="Dirección" onChange={handleChange} className="input" />

          <input name="eps" placeholder="EPS" onChange={handleChange} className="input" />
          <input type="date" name="fechaNacimiento" onChange={handleChange} className="input" />
        </div>

        <button className="mt-10 w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white transition hover:bg-blue-700">
          Completar Registro
        </button>
      </div>
    </div>
  );
}