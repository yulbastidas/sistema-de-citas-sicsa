"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  HeartPulse,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (!form.email || !form.password || !form.confirmPassword) {
      alert("Completa todos los campos");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    localStorage.setItem(
      "register_credentials",
      JSON.stringify({
        email: form.email.trim(),
        password: form.password,
      }),
    );

    router.push("/register/patient-profile");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <section className="mx-auto grid min-h-[95vh] max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        {/* Formulario */}
        <section className="flex items-center justify-center px-8 py-8 md:px-16">
          <article className="w-full max-w-md">
            {/* Indicador de pasos */}
            <section className="mb-5">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold sm:text-sm">
                <span className="text-blue-600">1. Crear cuenta</span>
                <span className="text-slate-400">2. Datos personales</span>
              </div>

              <div className="relative h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-1/2 rounded-full bg-blue-600" />
              </div>

              <p className="mt-2 text-xs text-slate-500">Paso 1 de 2</p>
            </section>

            <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              <UserRound size={17} />
              Registro de paciente
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Crear cuenta
            </h1>

            <p className="mt-2 text-base leading-relaxed text-slate-600">
              Ingresa tus datos de acceso para comenzar el registro.
            </p>

            <div className="my-5 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                <HeartPulse className="text-blue-600" size={20} />
              </div>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                handleNext();
              }}
            >
              <section>
                <label
                  htmlFor="email"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <Mail size={17} className="text-blue-600" />
                  Correo electrónico
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={form.email}
                  onChange={handleChange}
                />
              </section>

              <section>
                <label
                  htmlFor="password"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <LockKeyhole size={17} className="text-blue-600" />
                  Contraseña
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Ingresa una contraseña"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={form.password}
                  onChange={handleChange}
                />
              </section>

              <section>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <Check size={17} className="text-blue-600" />
                  Confirmar contraseña
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repite tu contraseña"
                  autoComplete="new-password"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </section>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-blue-700"
              >
                Continuar
                <ArrowRight size={21} />
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-600">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/login?role=patient"
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Inicia sesión aquí
              </Link>
            </p>

            <p className="mt-5 text-center text-xs text-slate-400">
              Tus datos serán utilizados únicamente para gestionar tus citas.
            </p>
          </article>
        </section>

        {/* Imagen */}
        <section className="relative hidden md:block">
          <Image
            src="/hospital.jpg"
            alt="Hospital Clarita Santos"
            fill
            priority
            sizes="35vw"
            className="object-cover"
          />

          <section className="absolute inset-0 bg-blue-900/40" />

          <section className="absolute inset-0 flex flex-col items-center justify-center px-10 text-center text-white">
            <figure className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-lg">
              <HeartPulse className="text-blue-600" size={48} />
            </figure>

            <h2 className="text-4xl font-extrabold leading-tight drop-shadow-lg lg:text-5xl">
              Sistema de Gestión
              <br />
              Hospitalaria
            </h2>

            <p className="mt-6 max-w-lg text-xl leading-relaxed text-white/95">
              Cuidando tu salud con tecnología de vanguardia
            </p>
          </section>
        </section>
      </section>
    </main>
  );
}